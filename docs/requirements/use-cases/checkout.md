# Use-Case UC-07: Đặt và Thanh toán Đơn hàng

> **Phiên bản:** 1.0  
> **Ngày cập nhật:** 2026-10-18  
> **Yêu cầu liên quan:** FR-03, FR-06, FR-07

---

## 1. Thông tin Tổng quát

| Thuộc tính | Nội dung |
|---|---|
| **Mã Use-Case** | UC-07 |
| **Tên** | Đặt và Thanh toán Đơn hàng (Checkout) |
| **Actor chính** | Khách hàng (đã đăng nhập) |
| **Actor phụ** | Mock Payment Service |
| **Mức độ** | Luồng nghiệp vụ cốt lõi (Core Business Flow) |
| **Trigger** | Khách nhấn nút **"Thanh toán"** trên màn hình Giỏ hàng |

---

## 2. Điều kiện Tiên quyết (Pre-conditions)

- [ ] Khách hàng đã đăng nhập — JWT token hợp lệ và chưa hết hạn.
- [ ] Giỏ hàng có ít nhất 1 sản phẩm với số lượng ≥ 1.
- [ ] Tất cả sản phẩm trong giỏ hàng còn tồn kho đủ.

---

## 3. Hậu điều kiện (Post-conditions)

### Thành công:
- Đơn hàng được tạo với trạng thái `PAID` trong CSDL.
- Tồn kho của các sản phẩm bị trừ đúng số lượng.
- Điểm tích lũy (loyalty_points) của khách hàng được cộng thêm.
- Khách hàng thấy màn hình Xác nhận với mã đơn và trạng thái `PAID`.

### Thất bại — Thanh toán lỗi:
- Đơn hàng được tạo với trạng thái `PAYMENT_FAILED`.
- Tồn kho **không** bị trừ.
- Khách hàng nhận thông báo lỗi và có thể thử lại.

---

## 4. Luồng Chính (Main Flow — Happy Path)

| Bước | Actor | Hành động |
|---|---|---|
| 1 | Khách hàng | Nhấn **"Thanh toán"** trên màn hình Giỏ hàng. |
| 2 | Frontend | Kiểm tra token JWT trong localStorage — nếu thiếu, chuyển hướng đến trang Đăng nhập. |
| 3 | Frontend | Hiển thị màn hình Thanh toán với tổng tiền và lựa chọn phương thức (Ví / Thẻ). |
| 4 | Khách hàng | Chọn phương thức thanh toán → nhấn **"Xác nhận trả"**. |
| 5 | Frontend | Sinh `Idempotency-Key` (UUID v4) mới; gọi `POST /orders` kèm danh sách món và JWT token. |
| 6 | API (NestJS) | Xác thực JWT → lấy `userId`. |
| 7 | API (NestJS) | Validate payload bằng `class-validator` (qty > 0, productId hợp lệ, v.v.). |
| 8 | API (NestJS) | Mở **Database Transaction**: lấy `SELECT ... FOR UPDATE` / kiểm tra `version` từng sản phẩm. |
| 9 | API (NestJS) | Nếu tồn kho đủ: tạo bản ghi `Orders` (status=`PENDING`) + `OrderItems`; trừ `stock` và tăng `version`. |
| 10 | API (NestJS) | Commit transaction → trả về `{ orderId, status: "PENDING", finalAmount }`. |
| 11 | Frontend | Gọi `POST /payments` với `{ orderId, method, idempotencyKey }` + JWT token. |
| 12 | API (NestJS) | Kiểm tra `idempotency_key` trong bảng `Payments` — nếu đã tồn tại, trả lại kết quả cũ (bước 15). |
| 13 | API (NestJS) | Gọi Mock Payment Service với `{ amount, method }`. |
| 14 | Mock Payment | Trả về kết quả: `{ success: true }`. |
| 15 | API (NestJS) | Lưu bản ghi `Payments` (status=`SUCCESS`); cập nhật `Orders.status` → `PAID`; cộng `loyalty_points`. |
| 16 | Frontend | Nhận `{ status: "PAID", orderId }`; hiển thị màn hình **Xác nhận Đơn hàng** (mã đơn + icon ✓). |

---

## 5. Luồng Rẽ nhánh (Alternative Flows)

### AF-01: Áp mã Khuyến mãi
> **Kích hoạt:** Sau bước 3, trước bước 5 — khách nhập mã giảm giá.

| Bước | Hành động |
|---|---|
| 3a | Khách nhập mã promo vào ô input và nhấn "Áp dụng". |
| 3b | Frontend gửi `GET /promotions/validate?code=XYZ`. |
| 3c | API kiểm tra mã: hợp lệ + còn hạn → trả về `{ discountAmount }`. |
| 3d | Frontend cập nhật tổng tiền hiển thị. |
| 3e | Quay lại bước 4, gửi kèm `promoCode` trong payload `POST /orders`. |

---

### AF-02: Retry thanh toán sau PAYMENT_FAILED
> **Kích hoạt:** Sau bước 14 trả về `{ success: false }`.

| Bước | Hành động |
|---|---|
| 14a | Mock Payment trả về `{ success: false }`. |
| 14b | API lưu `Payments` (status=`FAILED`); cập nhật `Orders.status` → `PAYMENT_FAILED`. |
| 14c | API trả về `{ status: "PAYMENT_FAILED", message: "Thanh toán thất bại, vui lòng thử lại." }`. |
| 14d | Frontend hiển thị thông báo lỗi và nút **"Thử lại"**. |
| 14e | Khách nhấn Thử lại → sinh `Idempotency-Key` mới → quay lại bước 11. |

---

### AF-03: Retry trùng lặp (Duplicate Payment Request)
> **Kích hoạt:** Bước 12 — `idempotency_key` đã tồn tại trong bảng Payments.

| Bước | Hành động |
|---|---|
| 12a | API tìm thấy bản ghi Payment cũ với cùng key. |
| 12b | Trả về ngay kết quả của lần xử lý đầu tiên (không gọi lại Mock Payment). |

---

## 6. Luồng Ngoại lệ (Exception Flows)

### EF-01: Hết hàng khi tạo đơn
> **Kích hoạt:** Bước 8/9 — tồn kho không đủ.

| Bước | Hành động |
|---|---|
| 9a | Transaction phát hiện `stock < qty` hoặc `version` không khớp (Optimistic Locking thất bại). |
| 9b | Rollback transaction. |
| 9c | API trả về `409 Conflict` với `{ message: "Sản phẩm X đã hết hàng." }`. |
| 9d | Frontend hiển thị thông báo và đề xuất xóa món hết hàng khỏi giỏ. |

---

### EF-02: Chưa đăng nhập
> **Kích hoạt:** Bước 2 — không có JWT token.

| Bước | Hành động |
|---|---|
| 2a | Frontend phát hiện không có token trong localStorage. |
| 2b | Lưu trạng thái giỏ hàng hiện tại (Zustand persist). |
| 2c | Chuyển hướng đến trang Đăng nhập với query param `?redirect=/checkout`. |
| 2d | Sau khi đăng nhập thành công, redirect lại trang Giỏ hàng. |

---

### EF-03: JWT hết hạn hoặc không hợp lệ
> **Kích hoạt:** Bước 6 — API xác thực JWT thất bại.

| Bước | Hành động |
|---|---|
| 6a | NestJS AuthGuard từ chối request. |
| 6b | API trả về `401 Unauthorized`. |
| 6c | Frontend bắt lỗi từ Axios interceptor → xóa token cũ → chuyển hướng về trang Đăng nhập. |

---

### EF-04: Payload không hợp lệ
> **Kích hoạt:** Bước 7 — `class-validator` phát hiện dữ liệu sai.

| Bước | Hành động |
|---|---|
| 7a | API trả về `400 Bad Request` với danh sách lỗi validation. |
| 7b | Frontend hiển thị thông báo lỗi tương ứng. |

---

## 7. Sơ đồ Trạng thái Đơn hàng (Order State Machine)

```
              ┌─────────────────┐
              │    « start »    │
              └────────┬────────┘
                       │ POST /orders
                       ▼
              ┌─────────────────┐
   ┌──────────│     PENDING     │
   │ hủy đơn └────────┬────────┘
   │                  │ POST /payments (success)
   │                  ▼
   │         ┌─────────────────┐       ┌──────────────────┐
   │         │      PAID       │──────►│  PAYMENT_FAILED  │
   │         └────────┬────────┘ fail  └────────┬─────────┘
   │ hủy đơn          │                         │ thử lại
   │                  │ barista nhận            └──────────► PENDING
   │                  ▼
   │         ┌─────────────────┐
   │         │   PREPARING     │
   │         └────────┬────────┘
   │                  │ pha xong
   │                  ▼
   │         ┌─────────────────┐
   │         │     READY       │
   │         └────────┬────────┘
   │                  │ giao cho khách
   │                  ▼
   │         ┌─────────────────┐
   │         │   COMPLETED     │
   │         └─────────────────┘
   │
   ▼
┌─────────────────┐
│   CANCELLED     │
└─────────────────┘
```

**Quy tắc chuyển trạng thái hợp lệ:**

| Từ | Cho phép chuyển sang |
|---|---|
| `PENDING` | `PAID`, `PAYMENT_FAILED`, `CANCELLED` |
| `PAYMENT_FAILED` | `PENDING` (thử lại) |
| `PAID` | `PREPARING`, `CANCELLED` |
| `PREPARING` | `READY` |
| `READY` | `COMPLETED` |
| `COMPLETED` | *(không cho phép)* |
| `CANCELLED` | *(không cho phép)* |

---

## 8. Ánh xạ đến Yêu cầu (Traceability)

| Bước Use-Case | Mã FR | Thành phần Code |
|---|---|---|
| Xác thực JWT (bước 6) | FR-05 | `JwtAuthGuard`, `AuthModule` |
| Validate payload (bước 7) | FR-06 | `CreateOrderDto` + `class-validator` |
| Optimistic Locking (bước 8–9) | FR-06, NFR-04 | `OrdersService.create()` + DB Transaction |
| Idempotency Key (bước 12) | FR-07, NFR-04 | `PaymentsService.processPayment()` |
| Mock Payment (bước 13–14) | FR-07 | `MockPaymentService` |
| State Machine (bước 15) | FR-06, FR-07 | `OrderStateMachine.assertTransition()` |
| Loyalty Points (bước 15) | NFR — Loyalty | `UsersService.addLoyaltyPoints()` |
