// Bộ kiểm thử Node: chạy module TypeScript thật cùng Axios/Zustand, giả lập mạng và lưu trữ.
// Chạy: node --test tests/integration.test.mjs (không phải E2E trên trình duyệt/Backend).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
const nodeRequire = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));

const user = { id: '00000000-0000-4000-8000-000000000001', email: 'a@example.invalid', loyalty_points: 0 };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
};
const tick = () => new Promise(resolve => setImmediate(resolve));
function environment() {
  const values = new Map(), modules = new Map(), events = {}, calls = [];
  const env = {
    calls, events, values,
    storage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key),
    },
    respond: async config => ({ data: config.url === '/auth/me' ? user : {}, status: 200, statusText: 'OK', headers: {}, config }),
  };
  const axiosFacade = Object.assign((...args) => axios(...args), axios, {
    create: options => axios.create({ ...options, adapter: config => { calls.push(config); return env.respond(config); } }),
  });
  env.load = filename => {
    const full = path.resolve(testDirectory, '../src', filename);
    if (filename.endsWith('.tsx')) modules.delete(full);
    if (modules.has(full)) return modules.get(full).exports;
    const loaded = { exports: {} }; modules.set(full, loaded);
    const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(code, {
      exports: loaded.exports, module: loaded, process, console, crypto: { randomUUID },
      window: { addEventListener: (name, fn) => { events[name] = fn; } },
      localStorage: env.storage, sessionStorage: env.storage, setTimeout, clearTimeout,
      URLSearchParams, URL, Intl, AbortController,
      require: name => {
        if (env.overrides?.[name]) return env.overrides[name];
        if (name === 'axios') return axiosFacade;
        if (name.startsWith('./')) return env.load(path.relative(path.resolve(testDirectory, '../src'), path.resolve(path.dirname(full), name)) + '.ts');
        if (name.startsWith('@/')) return env.load(name.slice(2) + '.ts');
        return nodeRequire(name);
      },
    }, { filename: full });
    return loaded.exports;
  };
  env.session = env.load('services/session.ts');
  env.api = env.load('services/api.ts');
  env.login = async (token = 'token-A') => env.session.acceptLogin({ access_token: token }, env.session.captureSession());
  return env;
}
function httpError(config, status) {
  return new axios.AxiosError('HTTP ' + status, 'ERR_BAD_RESPONSE', config, null, { status, data: {}, config });
}

test('restore verifies /auth/me once; cached user is not authentication', async () => {
  const e = environment(); e.storage.setItem('brewlite_token', 'A'); e.storage.setItem('brewlite_user', '{"id":"fake"}');
  const wait = deferred(); e.respond = config => wait.promise.then(() => ({ data: user, config }));
  const a = e.session.verifySession(), b = e.session.verifySession();
  assert.equal(e.session.useSession.getState().status, 'checking'); assert.equal(e.calls.length, 1);
  wait.resolve(); await Promise.all([a,b]); assert.equal(e.session.useSession.getState().user.id, user.id);
});
test('login/register skip verification interceptor and retain main DTO', async () => {
  const e = environment(); await e.api.login({email:'a',password:'b'}); await e.api.register({email:'a',password:'b'});
  assert.deepEqual(e.calls.map(c => c.url), ['/auth/login','/auth/register']);
  assert.ok(e.calls.every(c => !c.headers.Authorization));
});
test('logout/login same token rotates lifecycle identity', async () => {
  const e=environment(); await e.login(); const old=e.session.captureSession();
  e.session.logout(); await e.login(); assert.equal(e.session.isSessionCurrent(old),false);
});
for (const token of ['token-B', 'token-A']) test('waiting request never dispatches under replacement '+token, async () => {
  const e=environment(); e.storage.setItem('brewlite_token','token-A');
  const wait=deferred(); e.respond=config=>config.url==='/auth/me'?wait.promise.then(()=>({data:user,config})):Promise.resolve({data:{},config});
  const request=e.api.createOrder({items:[]}); const rejected=assert.rejects(request, {code:'ERR_AUTH_SESSION_CHANGED'});
  await tick(); e.session.logout();
  const login=e.login(token); wait.resolve(); await login; await rejected;
  assert.equal(e.calls.filter(c=>c.url==='/orders').length,0);
});
test('late 401 from old request cannot logout new session', async () => {
  const e=environment(); await e.login(); const wait=deferred();
  e.respond=config=>config.url==='/orders'?wait.promise.then(()=>{throw httpError(config,401);}):Promise.resolve({data:user,config});
  const request=e.api.createOrder({items:[]}); const rejected=assert.rejects(request); await tick();
  e.session.logout(); await e.login('token-B'); wait.resolve(); await rejected;
  assert.equal(e.session.useSession.getState().status,'authenticated'); assert.equal(e.session.captureSession().token,'token-B');
});
for(const status of [401,500,'network']) test('initial verification '+status, async()=>{
  const e=environment(); e.storage.setItem('brewlite_token','A');
  e.respond=async config=>{throw status==='network'?new axios.AxiosError('network','ERR_NETWORK',config):httpError(config,status);};
  await e.session.verifySession();
  assert.equal(e.session.useSession.getState().status,status===401?'anonymous':'unavailable');
  assert.equal(e.storage.getItem('brewlite_token'),status===401?null:'A');
});
test('background revalidation keeps identity/authenticated while pending and on 500', async()=>{
  const e=environment(); await e.login(); const identity=e.session.captureSession(), wait=deferred();
  e.respond=config=>wait.promise.then(()=>{throw httpError(config,500);});
  const verify=e.session.verifySession(true); assert.equal(e.session.useSession.getState().status,'authenticated');
  wait.resolve(); await verify; assert.equal(e.session.useSession.getState().status,'authenticated'); assert.equal(e.session.isSessionCurrent(identity),true);
});
test('background 401 invalidates session',async()=>{
  const e=environment();await e.login();e.respond=async config=>{throw httpError(config,401);};await e.session.verifySession(true);
  assert.equal(e.session.useSession.getState().status,'anonymous');
});
test('authenticated HTTP 401 invalidates only current session, preserves cart/attempt storage',async()=>{
  const e=environment();await e.login();e.storage.setItem('brewlite_cart_storage','cart');e.storage.setItem('brewlite_checkout_attempt','attempt');
  e.respond=async config=>{throw httpError(config,401);};await assert.rejects(e.api.getMyOrders());
  assert.equal(e.session.useSession.getState().status,'anonymous');assert.equal(e.storage.getItem('brewlite_cart_storage'),'cart');assert.equal(e.storage.getItem('brewlite_checkout_attempt'),'attempt');
});
test('safe return path rejects external/protocol-relative paths',()=>{
  const e=environment(); for(const value of ['https://bad.invalid','//bad.invalid','/\\bad.invalid','/login','/checkout?next=//bad.invalid'])assert.equal(e.session.safeReturnPath(value),'/');
  assert.equal(e.session.safeReturnPath('/checkout'),'/checkout');
});
test('storage failure is unavailable and protected request does not dispatch',async()=>{
  const e=environment();e.storage.getItem=()=>{throw Error('storage denied');};
  await assert.rejects(e.api.createOrder({items:[]}));assert.equal(e.calls.length,0);assert.equal(e.session.useSession.getState().status,'unavailable');
});
test('timeout is finite; network errors do not invalidate or retry POST',async()=>{
  const e=environment();await e.login();
  assert.equal(e.api.apiClient.defaults.timeout,15000);
  e.respond=async config=>{throw new axios.AxiosError('timeout','ECONNABORTED',config);};
  await assert.rejects(e.api.processPayment({orderId:'o',method:'WALLET',idempotencyKey:'k'}));
  assert.equal(e.calls.filter(c=>c.url==='/payments').length,1);assert.equal(e.session.useSession.getState().status,'authenticated');
});

const orderId = '00000000-0000-4000-8000-000000000002';
const toppingId = '00000000-0000-4000-8000-000000000003';
const cartItems = () => [{ id:'item', productId:user.id, name:'Coffee', qty:1, size:'M', price:35000, imageUrl:null, toppings:[{id:toppingId,name:'Pearl',price:5000}] }];
const payment = { id:'payment', orderId, method:'WALLET', amount:35000, status:'SUCCESS', orderStatus:'PAID', isDuplicate:false, message:'OK' };

function component(e, filename, props = {}) {
  const states=[], refs=[], effects=[]; let cursor=0, refCursor=0, initial=true, updates=0;
  const react = {
    useState: value => { const i=cursor++; if(!(i in states))states[i]=value;return [states[i],next=>{updates++;states[i]=typeof next==='function'?next(states[i]):next;}]; },
    useRef: value => {const i=refCursor++;return refs[i] ||= {current:value};},
    useEffect: fn => {if(initial)effects.push({fn,cleanup:null});},
    use: value => value,
  };
  e.overrides = {
    ...(e.overrides || {}), react,
    'react/jsx-runtime': {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},
    'next/navigation': {useRouter:()=>e.router,usePathname:()=>e.pathname || '/checkout'},
    'next/link': {default:'a',__esModule:true},
    '@/hooks/useHydrated': {useHydrated:()=>true},
    '@/services/session': {...e.session, useSession:Object.assign(selector=>selector?selector(e.session.useSession.getState()):e.session.useSession.getState(),e.session.useSession)},
  };
  const Page=e.load(filename).default;
  const render=()=>{cursor=0;refCursor=0;return Page(props);};
  render();initial=false;effects.forEach(e=>e.cleanup=e.fn());
  function nodes(node){return !node||typeof node!=='object'?[]:[node,...[].concat(node.props?.children||[]).flatMap(nodes)];}
  return {render, text:()=>JSON.stringify(render()), button:()=>nodes(render()).find(n=>n.type==='button'&&'disabled'in n.props),
    unmount:()=>effects.forEach(e=>e.cleanup?.()), strict:()=>{effects.forEach(e=>e.cleanup?.());effects.forEach(e=>e.cleanup=e.fn());}, updates:()=>updates};
}
async function checkout(options={}) {
  const e=environment();await e.login();const routes=[];let clears=0;
  e.router={push:p=>routes.push(p),replace:p=>routes.push(p)};
  const cart={items:cartItems(),clearCart:()=>{clears++;cart.items=[];}};
  const useCartStore=Object.assign(selector=>selector(cart),{getState:()=>cart});
  e.overrides={'@/store/cart':{useCartStore}};
  e.respond=async config=>{
    if(config.url==='/auth/me')return {data:e.profile ?? user,config};
    if(config.url==='/orders')return {data:{id:orderId,status:'PENDING',finalAmount:35000},config};
    if(config.url==='/payments'){
      if(options.wait)await options.wait.promise;
      if(options.error)throw options.error(config);
      return {data:options.response ?? payment,config};
    }
    return {data:{},config};
  };
  const view=component(e,'app/checkout/page.tsx');await tick();
  return {e,view,cart,routes,clears:()=>clears};
}
test('Checkout valid payment clears once and keeps main payload',async()=>{
  const h=await checkout(),fn=h.view.button().props.onClick;await fn();await fn();
  assert.equal(h.clears(),1);assert.deepEqual(h.routes,['/orders/'+orderId]);
  const request=h.e.calls.find(c=>c.url==='/payments');
  assert.deepEqual(Object.keys(JSON.parse(request.data)).sort(),['idempotencyKey','method','orderId']);
});
for(const change of [
  item=>item.qty++,item=>item.size='L',item=>item.productId=orderId,item=>item.toppings[0].id=orderId,item=>item.toppings[0].price++,item=>item.price++,
])test('Checkout changed cart value is preserved',async()=>{
  const wait=deferred(),h=await checkout({wait}),p=h.view.button().props.onClick();await tick();
  change(h.cart.items[0]);wait.resolve();await p;
  assert.equal(h.clears(),0);assert.deepEqual(h.routes,['/orders/'+orderId]);
});
for(const [label,response] of [
  ['FAILED',{...payment,status:'FAILED',orderStatus:'PAYMENT_FAILED'}],
  ['wrong Order',{...payment,orderId:'other'}],['wrong method',{...payment,method:'CARD'}],
  ['wrong amount',{...payment,amount:10}],['missing fields',{}],
])test('Checkout '+label+' keeps cart and locks',async()=>{
  const h=await checkout({response});await h.view.button().props.onClick();await h.view.button().props.onClick();
  assert.equal(h.clears(),0);assert.equal(h.routes.length,0);assert.equal(h.e.calls.filter(c=>c.url==='/orders').length,1);
});
for(const status of [401,403,404,409,500,503,'timeout','network'])test('Checkout transport '+status+' preserves cart',async()=>{
  const h=await checkout({error:config=>typeof status==='number'?httpError(config,status):new axios.AxiosError(status,status==='timeout'?'ECONNABORTED':'ERR_NETWORK',config)});
  await h.view.button().props.onClick();await h.view.button().props.onClick();
  assert.equal(h.clears(),0);assert.equal(h.routes.length,0);assert.equal(h.e.calls.filter(c=>c.url==='/orders').length,1);
});
for(const sameToken of [false,true])test('Checkout account switch or same-token relogin cannot clear identical cart '+sameToken,async()=>{
  const wait=deferred(),h=await checkout({wait}),p=h.view.button().props.onClick();await tick();
  h.e.session.logout();if(!sameToken)h.e.profile={...user,id:orderId,email:'b@example.invalid'};
  await h.e.login(sameToken?'token-A':'token-B');wait.resolve();await p;
  assert.equal(h.clears(),0);assert.equal(h.routes.length,0);
});
test('Checkout empty/invalid cart remains unlocked before request',async()=>{
  const h=await checkout(),fn=h.view.button().props.onClick;
  for(const qty of [0,-1,1.5,NaN]){h.cart.items[0].qty=qty;await fn();assert.equal(h.view.button().props.disabled,false);}
  h.cart.items=[];await fn();assert.equal(h.e.calls.filter(c=>c.url==='/orders').length,0);
  h.cart.items=cartItems();await h.view.button().props.onClick();assert.equal(h.clears(),1);
});
test('Checkout double click one request; reload does not POST or release pending attempt',async()=>{
  const wait=deferred(),h=await checkout({wait}),fn=h.view.button().props.onClick,p=fn();await fn();await tick();
  h.view.unmount();const newer=component(h.e,'app/checkout/page.tsx');await tick();await newer.button().props.onClick();
  wait.resolve();await p;assert.equal(h.clears(),0);assert.equal(h.routes.length,0);
  assert.equal(h.e.calls.filter(c=>c.url==='/orders').length,1);assert.equal(newer.button().props.disabled,true);
});
test('Checkout Strict Mode replay does not POST and real unmount prevents side effects',async()=>{
  const wait=deferred(),h=await checkout({wait});h.view.strict();await tick();assert.equal(h.e.calls.filter(c=>c.url==='/orders').length,0);
  const p=h.view.button().props.onClick();await tick();h.view.unmount();const updates=h.view.updates();wait.resolve();await p;
  assert.equal(h.clears(),0);assert.equal(h.view.updates(),updates);
});
test('Checkout confirmed replay accepts later fulfilled Order state',async()=>{
  const h=await checkout({response:{...payment,isDuplicate:true,orderStatus:'READY'}});await h.view.button().props.onClick();assert.equal(h.clears(),1);
});
test('Checkout cleanup failure does not erase confirmed result or auto POST',async()=>{
  const h=await checkout();h.e.storage.removeItem=key=>{if(key==='brewlite_checkout_attempt')throw Error('denied');h.e.values.delete(key);};
  await h.view.button().props.onClick();assert.equal(h.clears(),1);assert.equal(h.routes.length,1);
  assert.equal(JSON.parse(h.e.storage.getItem('brewlite_checkout_attempt')).phase,'paid');
  const newer=component(h.e,'app/checkout/page.tsx');await tick();assert.equal(newer.button().props.disabled,true);
});

test('real Axios HTTP adapter enforces finite timeout without POST retry',async()=>{
  let requests=0;const server=http.createServer(()=>{requests++;});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const e=environment();await e.login();
    await assert.rejects(e.api.apiClient.post('/payments',{},{
      baseURL:`http://127.0.0.1:${server.address().port}`,adapter:axios.getAdapter('http'),timeout:100,
    }),{code:'ECONNABORTED'});
    assert.equal(requests,1);assert.equal(e.session.useSession.getState().status,'authenticated');
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('same-token session changed in another tab invalidates previous identity',async()=>{
  const e=environment();await e.login();const identity=e.session.captureSession();
  e.storage.setItem('brewlite_session_id',randomUUID());e.events.storage({key:'brewlite_session_id'});
  assert.equal(e.session.isSessionCurrent(identity),false);await tick();
});
test('SessionBoundary preserves subtree key during background verification; 401 gates it',async()=>{
  const e=environment();await e.login();e.router={replace:()=>{}};const view=component(e,'components/SessionBoundary.tsx',{children:'CHECKOUT'});
  const before=view.text(),wait=deferred();e.respond=config=>wait.promise.then(()=>{throw httpError(config,401);});
  const p=e.session.verifySession(true);assert.equal(view.text(),before);wait.resolve();await p;
  assert.ok(!view.text().includes('CHECKOUT'));
});
test('Payment in flight survives revalidation of same session',async()=>{
  const wait=deferred(),h=await checkout({wait}),p=h.view.button().props.onClick();await tick();
  await h.e.session.verifySession(true);wait.resolve();await p;assert.equal(h.clears(),1);
});
test('tampered or unreadable attempt record blocks POST, no automatic recovery',async()=>{
  const h=await checkout();h.e.storage.setItem('brewlite_checkout_attempt','{bad-json');
  await h.view.button().props.onClick();assert.equal(h.e.calls.filter(c=>c.url==='/orders').length,0);
});
test('expired session restore does not delete pending attempt',async()=>{
  const e=environment();e.storage.setItem('brewlite_token','expired');e.storage.setItem('brewlite_checkout_attempt','pending');
  e.respond=async config=>{throw httpError(config,401);};await e.session.verifySession();
  assert.equal(e.storage.getItem('brewlite_checkout_attempt'),'pending');
});
for(const status of ['PENDING','PAID','PAYMENT_FAILED','PREPARING','READY','COMPLETED','CANCELLED']){
  test('Confirmation renders verified '+status,async()=>{
    const e=environment();await e.login();e.router={push:()=>{},replace:()=>{}};
    e.respond=async config=>({data:{id:orderId,status,finalAmount:35000,items:[]},config});
    const view=component(e,'app/orders/[id]/page.tsx',{params:{id:orderId}});
    await tick();assert.ok(view.text().includes(status));
    if(!['PAID','PREPARING','READY','COMPLETED'].includes(status))assert.ok(!view.text().includes('Số tiền đã thanh toán'));
    assert.ok(!view.text().includes('3 - 5 phút'));
  });
}
for(const status of [403,404,500,503]){
  test('Confirmation HTTP '+status+' has no PAID fallback',async()=>{
    const e=environment();await e.login();e.router={push:()=>{},replace:()=>{}};
    e.respond=async config=>{throw httpError(config,status);};
    const view=component(e,'app/orders/[id]/page.tsx',{params:{id:orderId}});
    await tick();assert.ok(view.text().includes('Chưa xác minh'));assert.ok(!view.text().includes('PAID'));
  });
}
test('Confirmation rejects wrong Order or unknown status',()=>{
  const e=environment(),{readOrder}=e.load('services/orderConfirmation.ts');
  assert.throws(()=>readOrder({id:'other',status:'PAID',finalAmount:35000,items:[]},orderId));
  assert.throws(()=>readOrder({id:orderId,status:'FAKE',finalAmount:35000,items:[]},orderId));
});
test('Confirmation unmount blocks late result',async()=>{
  const e=environment();await e.login();e.router={push:()=>{},replace:()=>{}};const wait=deferred();
  e.respond=config=>wait.promise.then(()=>({data:{id:orderId,status:'PAID',finalAmount:35000,items:[]},config}));
  const view=component(e,'app/orders/[id]/page.tsx',{params:{id:orderId}});await tick();view.unmount();const updates=view.updates();
  wait.resolve();await tick();assert.equal(view.updates(),updates);
});

for (const [label, orderStatus] of [
  ['mảng', ['PAID']], ['object', {value:'PAID'}], ['null', null],
  ['undefined', undefined], ['boolean', true], ['number', 1],
]) test('B-01: orderStatus '+label+' phải là UNCONFIRMED', async()=>{
  const h=await checkout({response:{...payment,orderStatus}});
  await h.view.button().props.onClick();
  assert.equal(h.clears(),0);assert.equal(h.routes.length,0);
  assert.ok(h.view.text().includes('UNCONFIRMED'));assert.equal(h.view.button().props.disabled,true);
});
test('B-01: SUCCESS + PAID dạng chuỗi vẫn thành công',async()=>{
  const h=await checkout({response:payment});await h.view.button().props.onClick();
  assert.equal(h.clears(),1);assert.deepEqual(h.routes,['/orders/'+orderId]);
});

for(const operation of ['user-cache','session-id'])test('B-02: lỗi '+operation+' không ngăn xóa token',async()=>{
  const e=environment();await e.login();const old=e.session.captureSession();
  const remove=e.storage.removeItem,set=e.storage.setItem;let tokenRemoval=0;
  e.storage.removeItem=key=>{
    if(key==='brewlite_token')tokenRemoval++;
    if(operation==='user-cache'&&key==='brewlite_user')throw Error('storage denied');
    remove(key);
  };
  e.storage.setItem=(key,value)=>{
    if(operation==='session-id'&&key==='brewlite_session_id')throw Error('storage denied');
    set(key,value);
  };
  const result=e.session.logout();
  assert.equal(tokenRemoval,1);assert.equal(e.storage.getItem('brewlite_token'),null);
  assert.equal(result.success,true);assert.equal(e.session.isSessionCurrent(old),false);
  const reload=environment();for(const [key,value] of e.values)reload.storage.setItem(key,value);
  await reload.session.verifySession();assert.equal(reload.session.useSession.getState().status,'anonymous');
  assert.equal(reload.calls.length,0);
});
for(const failure of ['throw','no-op','read-back','all-storage'])test('B-02: không xác minh được xóa token ('+failure+') phải báo thất bại',async()=>{
  const e=environment();await e.login();
  const remove=e.storage.removeItem,get=e.storage.getItem,set=e.storage.setItem;
  e.storage.removeItem=key=>{
    if(failure==='all-storage'||(key==='brewlite_token'&&failure==='throw'))throw Error('denied');
    if(key==='brewlite_token'&&failure==='no-op')return;
    remove(key);
  };
  e.storage.getItem=key=>{
    if(failure==='all-storage'||(key==='brewlite_token'&&failure==='read-back'))throw Error('denied');
    return get(key);
  };
  e.storage.setItem=(key,value)=>{if(failure==='all-storage')throw Error('denied');set(key,value);};
  const result=e.session.logout();
  assert.equal(result.success,false);assert.ok(result.error.includes('Đăng xuất chưa hoàn tất'));
  assert.equal(e.session.useSession.getState().status,'unavailable');
  assert.equal(e.session.useSession.getState().identity.token,null);
  const routes=[];e.pathname='/orders';e.router={replace:p=>routes.push(p)};
  const boundary=component(e,'components/SessionBoundary.tsx',{children:'PRIVATE'});
  await tick();assert.ok(boundary.text().includes('Đăng xuất chưa hoàn tất'));
  assert.ok(boundary.text().includes('khôi phục phiên cũ'));assert.equal(routes.length,0);
  await assert.rejects(e.api.createOrder({items:[]}));
  assert.equal(e.calls.filter(c=>c.url==='/orders').length,0);
});
test('B-02: logout thành công không khôi phục user sau reload',async()=>{
  const e=environment();await e.login();assert.equal(e.session.logout().success,true);
  const reload=environment();for(const [key,value] of e.values)reload.storage.setItem(key,value);
  await reload.session.verifySession();assert.equal(reload.session.useSession.getState().status,'anonymous');
  assert.equal(reload.session.useSession.getState().user,null);
});
test('B-02: nút logout không điều hướng khi token vẫn còn',async()=>{
  const e=environment();await e.login();const routes=[];e.router={push:p=>routes.push(p),replace:p=>routes.push(p)};
  e.respond=async config=>({data:[],config});
  const view=component(e,'app/orders/page.tsx');await tick();
  function nodes(node){return !node||typeof node!=='object'?[]:[node,...[].concat(node.props?.children||[]).flatMap(nodes)];}
  const button=nodes(view.render()).find(n=>n.type==='button'&&n.props['aria-label']==='Đăng xuất');
  const remove=e.storage.removeItem;e.storage.removeItem=key=>{if(key!=='brewlite_token')remove(key);};
  button.props.onClick();assert.equal(routes.length,0);
  assert.equal(e.session.useSession.getState().status,'unavailable');
});
test('B-02: 401 khi xóa token thất bại vẫn cảnh báo, không báo anonymous',async()=>{
  const e=environment();await e.login();
  e.storage.removeItem=()=>{throw Error('denied');};
  e.respond=async config=>{throw httpError(config,401);};
  await assert.rejects(e.api.getMyOrders());
  assert.equal(e.session.useSession.getState().status,'unavailable');
  assert.ok(e.session.useSession.getState().logoutError.includes('Đăng xuất chưa hoàn tất'));
});
