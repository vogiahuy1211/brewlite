# Ma trận Truy vết (Traceability Matrix) — BrewLite

> **Dự án:** BrewLite (Hệ thống đặt cà phê và thanh toán không dùng tiền mặt)  
> **Căn cứ:** Assignment 2 — Section 8  
> **Ngày cập nhật:** 2026-10-19  

---

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ | Code Backend (API / Service) | Code Frontend (UI / Store) | Kiểm thử (Test Case) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-01** | US-01 Xem Menu | Activity-01, Class-01 | `GET /api/products`<br>`ProductsController.findAll()` | `app/page.tsx`<br>`ProductCard.tsx` | `products.service.spec.ts`<br>(findAll test) |
| **FR-02** | US-02 Chi tiết & Tùy chọn (Size, Topping) | Sequence-01, Class-01 | `GET /api/products/:id`<br>`GET /api/toppings` | `app/products/[id]/page.tsx` | `products.service.spec.ts`<br>(findOne test) |
| **FR-03** | US-03 Giỏ hàng (Cart) | Activity-01 | (Client-side State) | `store/cart.ts` (Zustand)<br>`app/cart/page.tsx` | Cart Store Unit Test |
| **FR-04** | US-04 Đăng ký tài khoản | Sequence-01, Class-01 | `POST /api/auth/register`<br>`AuthService.register()` | `app/login/page.tsx` | Auth Registration Test (bcrypt + unique check) |
| **FR-05** | US-05 Đăng nhập & Xác thực JWT | Sequence-01, Class-01 | `POST /api/auth/login`<br>`JwtAuthGuard` | `app/login/page.tsx`<br>`services/api.ts` | Auth JWT Validation Test |
| **FR-06** | US-06 Tạo đơn hàng | Sequence-01, Class-01 | `POST /api/orders`<br>`OrdersService.create()` | `app/checkout/page.tsx` | Concurrency & Stock Check Test |
| **FR-07** | US-07 Thanh toán Idempotent (Ví/Thẻ) | Sequence-01, Class-01 | `POST /api/payments`<br>`PaymentsService.processPayment()` | `app/checkout/page.tsx` | Idempotency Key Test (gửi 2 lần chỉ tạo 1) |
| **FR-08** | US-08 Xác nhận & Lịch sử đơn | Wireframe-05 | `GET /api/orders/me`<br>`GET /api/orders/:id` | `app/orders/[id]/page.tsx`<br>`app/orders/page.tsx` | Order History Retrieval Test |
| **FR-09** | US-09 Quản lý trạng thái (State Machine) | Activity-01, State Machine | `order-state-machine.ts`<br>`assertTransition()` | `app/orders/[id]/page.tsx` | `order-state-machine.spec.ts`<br>(10/10 test cases passed) |
| **FR-10** | US-10 Khuyến mãi & Loyalty | Class-01 | `GET /api/promotions/validate`<br>`Users.loyalty_points` | `app/checkout/page.tsx`<br>`app/orders/page.tsx` | Promotion Validation & Points Test |
| **NFR-01** | Hiệu năng phản hồi < 500ms | Architecture Overview | NestJS fast routes, indexed queries | Next.js Server Components / Turbopack | Load test / Smoke test |
| **NFR-02** | Bảo mật (Hash password, JWT) | Deployment Diagram | `bcrypt` (salt 10), `Passport-JWT` | Bearer token interceptor | Security audit |
| **NFR-03** | Khả dụng Mobile-first (PWA) | Activity-01 | Mobile-first responsive API | TailwindCSS responsive layout | Viewport test (375px - 768px) |
| **NFR-04** | Kiểm soát tồn kho đồng thời (Concurrency) | Sequence-01 (Optimistic Locking) | DB Transaction + `version` check | Out of stock notification | Concurrency conflict test |
| **NFR-05** | DevOps & Health Monitoring | Deployment Diagram | `GET /api/health` | Container orchestration | CD Smoke test |
