# Đặc tả Yêu cầu Phần mềm (SRS) — BrewLite

> **Phiên bản:** 1.0  
> **Ngày cập nhật:** 2026-10-18  
> **Căn cứ:** BrewLite Product Specification v1.0 + Assignment 2

---

## 1. Mục đích Tài liệu

Tài liệu này mô tả đầy đủ các yêu cầu chức năng (FR), yêu cầu phi chức năng (NFR), độ ưu tiên MoSCoW và tiêu chí chấp nhận (Acceptance Criteria) của hệ thống BrewLite phục vụ cho việc thiết kế, phát triển và kiểm thử.

---

## 2. Sơ đồ Use-Case Tổng quát

```
                        ┌─────────────────────────────────────┐
                        │           BrewLite System           │
                        │                                     │
  ┌──────────┐          │  (UC-01) Xem menu sản phẩm         │
  │          │◄─────────┤  (UC-02) Xem chi tiết & tùy chọn  │
  │ Khách    │          │  (UC-03) Quản lý giỏ hàng          │
  │ hàng     │◄─────────┤  (UC-04) Đăng ký tài khoản        │
  │          │◄─────────┤  (UC-05) Đăng nhập                 │
  └──────────┘          │  (UC-06) Tạo đơn hàng              │
                        │  (UC-07) Thanh toán                 │
                        │  (UC-08) Xem lịch sử đơn hàng      │
  ┌──────────┐          │                                     │
  │ Payment  │◄─────────┤  (UC-07) Thanh toán (mock)         │
  │ Gateway  │          │                                     │
  └──────────┘          │                                     │
                        │  (UC-09) Cập nhật trạng thái đơn   │
  ┌──────────┐          │                                     │
  │ Barista  │◄─────────┤  (UC-10) Xem đơn mới               │
  └──────────┘          │                                     │
                        └─────────────────────────────────────┘
```

---

## 3. Yêu cầu Chức năng (Functional Requirements)

### FR-01 — Xem Danh sách Sản phẩm (Menu)
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Hệ thống hiển thị danh sách đồ uống gồm ảnh, tên, giá cơ sở. |
| **Actor** | Khách hàng (không yêu cầu đăng nhập) |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Acceptance Criteria** | **Given** người dùng mở trang chủ, **When** trang load xong, **Then** hiển thị lưới sản phẩm với ảnh + tên + giá; hiển thị skeleton loading khi đang tải; hiển thị thông báo lỗi khi API thất bại; hiển thị "Chưa có sản phẩm" khi danh sách rỗng. |
| **API liên quan** | `GET /products` |

---

### FR-02 — Xem Chi tiết Sản phẩm & Tùy chọn
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Khách chọn size (S/M/L) và topping (đa lựa chọn); hệ thống tính giá động = giá cơ sở + chênh lệch size + tổng giá topping đã chọn. |
| **Actor** | Khách hàng |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Acceptance Criteria** | **Given** khách vào trang chi tiết món, **When** chọn size M và 1 topping, **Then** giá hiển thị cập nhật đúng theo công thức; nút "Thêm vào giỏ" kích hoạt khi đã chọn đủ size. |
| **API liên quan** | `GET /products/:id` |

---

### FR-03 — Quản lý Giỏ hàng (Cart)
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Khách thêm/sửa số lượng/xóa món trong giỏ; giỏ hàng được lưu ở client-state (Zustand); badge số lượng hiển thị trên icon giỏ. |
| **Actor** | Khách hàng |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Acceptance Criteria** | **Given** giỏ có 2 món, **When** tăng số lượng món 1 lên 3, **Then** tổng tiền tạm tính cập nhật đúng; badge icon hiển thị tổng số món (không phải số loại). Xóa hết món → giỏ trống → ẩn nút Thanh toán. |
| **API liên quan** | (Client-side state — Zustand) |

---

### FR-04 — Đăng ký Tài khoản
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Người dùng tạo tài khoản bằng email + mật khẩu; mật khẩu được băm bằng bcrypt trước khi lưu. |
| **Actor** | Khách hàng mới |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Acceptance Criteria** | **Given** email chưa tồn tại, **When** gửi `POST /auth/register` với email hợp lệ + password ≥ 8 ký tự, **Then** trả về `201 Created` và object user (không có password). Email đã tồn tại → `409 Conflict`. |
| **API liên quan** | `POST /auth/register` |

---

### FR-05 — Đăng nhập & Xác thực JWT
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Người dùng đăng nhập bằng email + mật khẩu; hệ thống phát JWT token; frontend lưu token vào localStorage và gắn vào header `Authorization: Bearer <token>` cho các request sau. |
| **Actor** | Khách hàng đã có tài khoản |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Acceptance Criteria** | **Given** tài khoản tồn tại, **When** gửi đúng email + password, **Then** trả về `{ access_token: "...", expires_in: "7d" }`. Sai mật khẩu → `401 Unauthorized`. Route tạo đơn / thanh toán không có token → `401 Unauthorized`. |
| **API liên quan** | `POST /auth/login` |

---

### FR-06 — Tạo Đơn hàng
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Khách đã đăng nhập gửi giỏ hàng lên server; server validate dữ liệu, kiểm tra tồn kho, tạo đơn trạng thái PENDING và trả về mã đơn. |
| **Actor** | Khách hàng (đã đăng nhập) |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Acceptance Criteria** | **Given** giỏ hàng hợp lệ và tồn kho đủ, **When** gọi `POST /orders`, **Then** trả về `201 Created` với `{ orderId, status: "PENDING", finalAmount }`. Tồn kho không đủ → `409 Conflict`. Không có token → `401`. Payload sai định dạng → `400 Bad Request`. |
| **API liên quan** | `POST /orders` |

---

### FR-07 — Thanh toán Không tiền mặt (Mock)
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Khách chọn phương thức (Ví điện tử / Thẻ ngân hàng), gửi yêu cầu thanh toán kèm `Idempotency-Key`; hệ thống gọi Mock Payment, cập nhật trạng thái đơn sang PAID hoặc PAYMENT_FAILED. |
| **Actor** | Khách hàng (đã đăng nhập) |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Acceptance Criteria** | **Given** đơn đang PENDING, **When** gọi `POST /payments` với Idempotency-Key lần đầu, **Then** đổi sang PAID và trả `200 OK`. Gọi lần 2 cùng key → trả lại kết quả cũ, không xử lý lại. Thanh toán lỗi → PAYMENT_FAILED, cho phép thử lại. |
| **API liên quan** | `POST /payments` |

---

### FR-08 — Xem Lịch sử Đơn hàng
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Người dùng xem danh sách các đơn hàng đã tạo của mình, sắp xếp theo thời gian mới nhất. |
| **Actor** | Khách hàng (đã đăng nhập) |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Acceptance Criteria** | **Given** user đã có 3 đơn, **When** gọi `GET /orders/me`, **Then** trả về mảng 3 đơn đúng thứ tự mới nhất, mỗi đơn có `orderId`, `status`, `finalAmount`, `createdAt`. Không có token → `401`. |
| **API liên quan** | `GET /orders/me` |

---

## 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

### NFR-01 — Hiệu năng (Performance)
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | API phản hồi dưới ngưỡng thời gian quy định trong điều kiện bình thường. |
| **Ưu tiên MoSCoW** | **Should Have** |
| **Tiêu chí** | `GET /products` phản hồi ≤ 500ms. `POST /orders` và `POST /payments` phản hồi ≤ 1000ms. |

---

### NFR-02 — Bảo mật (Security)
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Dữ liệu nhạy cảm phải được bảo vệ ở mọi tầng. |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Tiêu chí** | Mật khẩu băm bằng bcrypt (cost ≥ 10). JWT ký bằng secret ≥ 32 ký tự, hết hạn sau 7 ngày. Không lưu thông tin nhạy cảm trong Git. Toàn bộ traffic Production qua HTTPS. |

---

### NFR-03 — Khả dụng trên Thiết bị di động (Mobile-First / Responsive)
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Giao diện phải hoạt động mượt mà trên điện thoại (màn hình ≥ 375px). |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Tiêu chí** | Toàn bộ 5 màn hình chính hiển thị đúng layout trên viewport 375px × 812px. Font size tối thiểu 14px. Các nút bấm có vùng chạm ≥ 44×44px. |

---

### NFR-04 — Độ tin cậy Giao dịch (Reliability)
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Hệ thống đảm bảo tính toàn vẹn dữ liệu khi xử lý đồng thời và retry. |
| **Ưu tiên MoSCoW** | **Must Have** |
| **Tiêu chí** | Tồn kho không bao giờ âm khi nhiều request đồng thời. Cùng 1 Idempotency-Key không tạo 2 bản ghi thanh toán. Mọi thao tác đọc-sửa tồn kho nằm trong DB Transaction. |

---

### NFR-05 — Khả năng Bảo trì & Kiểm thử (Maintainability)
| Thuộc tính | Nội dung |
|---|---|
| **Mô tả** | Code dễ đọc, dễ test, dễ mở rộng. |
| **Ưu tiên MoSCoW** | **Should Have** |
| **Tiêu chí** | Code coverage Unit Test backend ≥ 60%. Mỗi NestJS module độc lập (Service / Controller / Module tách biệt). Không có magic string — dùng Enum / Constant. |

---

## 5. Bảng Tổng hợp MoSCoW

| Mã | Tính năng | MoSCoW | Sprint |
|---|---|---|---|
| FR-01 | Xem danh sách sản phẩm | **Must** | Sprint 1 |
| FR-02 | Chi tiết & tùy chọn size/topping | **Must** | Sprint 2 |
| FR-03 | Giỏ hàng (Cart) | **Must** | Sprint 2 |
| FR-04 | Đăng ký tài khoản | **Must** | Sprint 2 |
| FR-05 | Đăng nhập & JWT | **Must** | Sprint 2 |
| FR-06 | Tạo đơn hàng | **Must** | Sprint 2 |
| FR-07 | Thanh toán mock (Idempotent) | **Must** | Sprint 2 |
| FR-08 | Lịch sử đơn hàng | **Must** | Sprint 2 |
| — | Khuyến mãi (Promotion) | **Should** | Sprint 2 |
| — | Tích điểm Loyalty | **Should** | Sprint 2 |
| — | Admin quản lý menu | **Won't** | Out of MVP |
| — | Thông báo real-time | **Won't** | Out of MVP |
| NFR-01 | Hiệu năng API | **Should** | Xuyên suốt |
| NFR-02 | Bảo mật | **Must** | Xuyên suốt |
| NFR-03 | Mobile-First UI | **Must** | Xuyên suốt |
| NFR-04 | Độ tin cậy giao dịch | **Must** | Sprint 2 |
| NFR-05 | Khả năng kiểm thử | **Should** | Xuyên suốt |
