# ADR-003: Xác thực bằng JWT Stateless

> **Ngày quyết định:** 2026-10-07  
> **Trạng thái:** Accepted  
> **Người quyết định:** Dev Team

---

## Bối cảnh

Hệ thống cần cơ chế xác thực để bảo vệ các endpoint nhạy cảm (`POST /orders`, `POST /payments`, `GET /orders/me`). Cần quyết định giữa xác thực dựa trên Session phía server hay Token phía client.

## Các lựa chọn đã xem xét

| Lựa chọn | Mô tả |
|---|---|
| **JWT Stateless** (đã chọn) | Server ký token, client lưu và gửi kèm mỗi request |
| Session + Cookie | Server lưu session trong memory hoặc Redis |
| OAuth2 / OIDC | Dùng provider ngoài (Google, GitHub) |

## Quyết định

**Sử dụng JWT (JSON Web Token) Stateless** với thư viện `@nestjs/jwt` + `passport-jwt`.

- Payload: `{ sub: userId, email }`
- Secret: Lấy từ biến môi trường `JWT_SECRET`
- Thời hạn: `JWT_EXPIRES_IN = 7d`
- Lưu trữ phía client: `localStorage` (với Axios interceptor tự động gắn vào header)

## Lý do

- **Stateless:** Server không lưu trạng thái session — phù hợp với môi trường containerized và horizontal scaling.
- **Đơn giản:** Không cần Redis hay session store — giảm dependency cho MVP.
- **NestJS ecosystem:** `@nestjs/passport` + `passport-jwt` tích hợp mượt mà, ít boilerplate.
- **Phù hợp Next.js:** Frontend SPA gửi Bearer token trong header `Authorization` — pattern chuẩn cho REST API.

## Cơ chế hoạt động

```
1. POST /auth/login → API verify password → jwt.sign(payload, secret) → trả access_token
2. Client lưu token vào localStorage
3. Mọi request sau: Axios interceptor tự gắn Authorization: Bearer <token>
4. JwtAuthGuard trên NestJS: jwt.verify(token, secret) → inject user vào request
```

## Hệ quả

- ✅ Không cần infrastructure bổ sung (Redis, session store).
- ✅ API hoàn toàn Stateless — dễ scale và test.
- ⚠️ Không thể revoke token trước khi hết hạn (không có blacklist) — chấp nhận được cho MVP 7 ngày.
- ⚠️ `localStorage` dễ bị XSS — production nên chuyển sang `httpOnly cookie`, nhưng nằm ngoài scope MVP.
- ⚠️ Nếu `JWT_SECRET` bị lộ, toàn bộ token đều bị compromise — phải bảo vệ secret cẩn thận qua biến môi trường.
