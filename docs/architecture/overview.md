# Kiến trúc Hệ thống — BrewLite

> **Phiên bản:** 1.0  
> **Ngày cập nhật:** 2026-10-19  
> **Mô hình tham chiếu:** Layered Architecture + C4 Model (Context → Container)

---

## 1. Tổng quan Kiến trúc

BrewLite sử dụng kiến trúc **3 tầng phân tách rõ ràng** (Three-Tier / Layered Architecture):

```
┌─────────────────────────────────────────────────────────────────┐
│                        TẦNG TRÌNH BÀY                          │
│                    Presentation Layer                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Next.js 16 (TypeScript)                    │   │
│   │              Mobile-First PWA                           │   │
│   │                                                         │   │
│   │  Pages          Components         State                │   │
│   │  /menu          MenuGrid           Zustand (Cart)       │   │
│   │  /product/:id   ProductDetail      localStorage (JWT)   │   │
│   │  /cart          CartList                                │   │
│   │  /checkout      PaymentForm        Services             │   │
│   │  /confirm       OrderConfirm       axios + interceptor  │   │
│   │  /orders        OrderHistory                            │   │
│   │  /login         AuthForm                                │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TẦNG NGHIỆP VỤ                            │
│                      Business Layer                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              NestJS 12 (TypeScript)                     │   │
│   │                                                         │   │
│   │  Modules            Guards           Pipes              │   │
│   │  AuthModule         JwtAuthGuard     ValidationPipe     │   │
│   │  ProductsModule     RolesGuard       (class-validator)  │   │
│   │  OrdersModule                                           │   │
│   │  PaymentsModule     Services                            │   │
│   │  UsersModule        OrderStateMachine                   │   │
│   │  HealthModule       MockPaymentService                  │   │
│   │  PrismaModule                                           │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        TẦNG DỮ LIỆU                             │
│                         Data Layer                              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              PostgreSQL 16                              │   │
│   │                                                         │   │
│   │  Tables             Enums            Extensions         │   │
│   │  Users              order_status     pgcrypto           │   │
│   │  Products           payment_method   gen_random_uuid()  │   │
│   │  Orders             payment_status                      │   │
│   │  OrderItems         item_size                           │   │
│   │  OrderItemToppings                   Indexes            │   │
│   │  Payments           Constraints      users_email_key    │   │
│   │  Toppings           FK + Cascade     payments_key_key   │   │
│   │  Promotions                                             │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Sơ đồ C4 — Mức Container

```
┌──────────────────── BrewLite System ────────────────────────────┐
│                                                                  │
│  ┌─────────────┐   REST/HTTPS    ┌──────────────────────────┐   │
│  │  Next.js    │ ◄─────────────► │       NestJS API         │   │
│  │  Web App    │                 │                          │   │
│  │  Port 3000  │                 │  /auth   /products       │   │
│  │             │                 │  /orders /payments       │   │
│  │  TailwindCSS│                 │  /health                 │   │
│  │  Zustand    │                 │  Port 4000               │   │
│  └─────────────┘                 └──────────┬───────────────┘   │
│         ▲                                    │ Prisma ORM        │
│         │                                    ▼                   │
│    [Browser]                      ┌──────────────────────────┐   │
│    [Mobile]                       │      PostgreSQL 16        │   │
│                                   │      Port 5432           │   │
│                                   │   (internal only)        │   │
│                                   └──────────────────────────┘   │
│                                                                  │
│                                   ┌──────────────────────────┐   │
│                                   │   Mock Payment Service   │   │
│                                   │   (internal NestJS svc)  │   │
│                                   └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Cấu trúc Module NestJS

```
apps/api/src/
├── app.module.ts              # Root module — import tất cả modules
├── main.ts                    # Bootstrap + global ValidationPipe + CORS
├── prisma/
│   └── prisma.service.ts      # PrismaClient singleton
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts     # POST /auth/register, POST /auth/login
│   ├── auth.service.ts        # bcrypt + JWT sign
│   ├── jwt.strategy.ts        # Passport JWT strategy
│   └── jwt-auth.guard.ts      # Guard bảo vệ route
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts # GET /products, GET /products/:id
│   └── products.service.ts
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts   # POST /orders, GET /orders/me
│   ├── orders.service.ts      # DB Transaction + Optimistic Lock
│   └── order-state-machine.ts # assertTransition()
├── payments/
│   ├── payments.module.ts
│   ├── payments.controller.ts # POST /payments
│   ├── payments.service.ts    # Idempotency check
│   └── mock-payment.service.ts
├── users/
│   ├── users.module.ts
│   └── users.service.ts       # addLoyaltyPoints()
└── health/
    ├── health.module.ts
    └── health.controller.ts   # GET /health
```

---

## 4. Cơ chế Database Migration & Seeding

| Bước | Lệnh | Mô tả |
|---|---|---|
| Tạo migration mới | `prisma migrate dev --name <tên>` | Tạo file SQL migration trong `prisma/migrations/` |
| Áp migration Production | `prisma migrate deploy` | Chạy các migration chưa áp, không reset data |
| Seed dữ liệu mẫu | `prisma db seed` | Chạy `prisma/seed.ts` — thêm Products, Toppings mẫu |
| Sinh Prisma Client | `prisma generate` | Cập nhật type-safe client sau khi sửa schema |

> **Quy tắc Production:** Chỉ dùng `prisma migrate deploy` (không bao giờ dùng `migrate dev` hoặc `migrate reset` trên môi trường Production).

---

## 5. Cơ chế Xác thực (Authentication Flow)

```
Client                    NestJS API                  PostgreSQL
  │                           │                            │
  │── POST /auth/login ───────►│                            │
  │   { email, password }     │── SELECT user by email ───►│
  │                           │◄── { id, password_hash } ──│
  │                           │                            │
  │                           │── bcrypt.compare() ────────►│ (local)
  │                           │                            │
  │                           │── jwt.sign({ userId, email }, secret, { expiresIn: "7d" })
  │                           │
  │◄── { access_token } ──────│
  │                           │
  │── GET /orders/me ─────────►│
  │   Authorization: Bearer   │── JwtAuthGuard ────────────►│ (decode)
  │                           │── SELECT orders by userId ─►│
  │◄── [ orders ] ────────────│                            │
```

---

## 6. Cơ chế Logging & Health Check

### Logging
- NestJS Logger built-in — log ở mức `log`, `warn`, `error`.
- Mọi Exception trong Controller đều được bắt bởi Global Exception Filter.
- Format log: `[NestJS] [Module] message`.

### Health Check
`GET /health` trả về:
```json
{
  "status": "ok",
  "timestamp": "2026-10-19T12:00:00.000Z",
  "database": "connected",
  "uptime": 3600
}
```
- Endpoint này được CD Pipeline gọi sau mỗi lần deploy (Smoke Test).
- Docker Compose dùng `healthcheck` để đảm bảo API sẵn sàng trước khi Frontend khởi động.

---

## 7. Phân tích Trade-offs Kiến trúc

| Quyết định | Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|---|
| Monorepo | 1 repo, `apps/api` + `apps/web` | Dễ chia sẻ type, CI đơn giản | Build chậm hơn khi dự án lớn |
| ORM | Prisma | Type-safe, Migration rõ ràng, Schema là source of truth | Khó tùy biến query phức tạp |
| Auth | JWT Stateless | Không cần session store, Scale ngang dễ | Không thể revoke token ngay lập tức |
| State Mgmt | Zustand (client) | Nhẹ, ít boilerplate, SSR-friendly | Dữ liệu mất khi refresh (cần persist) |
| Payment | Mock Service (internal) | Không phụ thuộc vendor, test dễ | Không phản ánh latency/lỗi thực tế |
| Concurrency | Optimistic Locking | Không block DB, hiệu năng cao | Cần retry logic khi conflict |
