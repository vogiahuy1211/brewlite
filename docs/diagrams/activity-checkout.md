# Activity Diagram — Luồng Đặt và Thanh toán (End-to-End)

> **Use-Case:** UC-07 — Checkout  
> **Công cụ:** Mermaid  
> **Cập nhật:** 2026-10-18

## Sơ đồ

```mermaid
flowchart TD
    START([🟢 Bắt đầu]) --> A1

    subgraph USER["👤 Khách hàng"]
        A1[Mở ứng dụng BrewLite]
        A4[Chọn sản phẩm\nsize + topping]
        A6[Xem Giỏ hàng\nKiểm tra tổng tiền]
        A8{Đã\nđăng nhập?}
        A9[Đăng nhập /\nĐăng ký]
        A11[Chọn phương thức\nVí / Thẻ]
        A12[Nhấn 'Xác nhận trả']
        A_RETRY{Thử\nlại?}
        A_END_FAIL([🔴 Hủy đơn])
        A_END_OK([🟢 Nhận đồ uống])
    end

    subgraph FRONTEND["🖥️ Frontend - Next.js"]
        B1[Gọi GET /products\nHiển thị Menu]
        B2{Tải\nthành công?}
        B3[Hiển thị Skeleton Loading]
        B4[Hiển thị lưới sản phẩm]
        B_ERR[Hiển thị thông báo lỗi]
        B5[Cập nhật Cart Store\nZustand]
        B6[Tính tổng tiền]
        B10[Sinh Idempotency-Key\nUUID v4]
        B11[Gọi POST /orders]
        B13[Gọi POST /payments\n+ Idempotency-Key]
        B_CONFIRM[Hiển thị màn hình\nXác nhận ✓\nMã đơn + PAID]
        B_FAIL[Hiển thị thông báo\nThanh toán thất bại]
    end

    subgraph BACKEND["⚙️ Backend - NestJS API"]
        C1[Xác thực JWT]
        C2[Validate payload\nclass-validator]
        C3{Payload\nhợp lệ?}
        C4[Mở DB Transaction\nKiểm tra tồn kho\nOptimistic Lock]
        C5{Tồn kho\nđủ?}
        C6[Tạo Orders PENDING\nTrừ stock + tăng version\nCommit Transaction]
        C7[Kiểm tra\nIdempotency-Key]
        C8{Key đã\ntồn tại?}
        C9[Gọi Mock Payment]
        C10{Thanh toán\nthành công?}
        C11[Cập nhật PAID\nCộng loyalty_points]
        C12[Cập nhật\nPAYMENT_FAILED]
        C_DUP[Trả lại kết quả\ncũ ngay lập tức]
        C_STOCK_ERR[Rollback\nTrả 409 Conflict]
    end

    subgraph DB["🗄️ PostgreSQL"]
        D1[(Lưu Orders\n+ OrderItems)]
        D2[(Lưu Payments\nSUCCESS / FAILED)]
        D3[(Cập nhật\nUsers.loyalty_points)]
    end

    %% Flow
    A1 --> B1
    B1 --> B3 --> B2
    B2 -->|Thành công| B4
    B2 -->|Thất bại| B_ERR
    B4 --> A4
    A4 --> B5 --> B6 --> A6
    A6 --> A8
    A8 -->|Chưa| A9 --> A8
    A8 -->|Đã đăng nhập| A11 --> A12
    A12 --> B10 --> B11
    B11 --> C1 --> C2 --> C3
    C3 -->|Không hợp lệ| B_ERR
    C3 -->|Hợp lệ| C4 --> C5
    C5 -->|Không đủ| C_STOCK_ERR --> B_ERR
    C5 -->|Đủ| C6 --> D1 --> B13
    B13 --> C7 --> C8
    C8 -->|Đã tồn tại| C_DUP
    C8 -->|Lần đầu| C9 --> C10
    C10 -->|Thành công| C11 --> D2 --> D3 --> B_CONFIRM --> A_END_OK
    C10 -->|Thất bại| C12 --> D2 --> B_FAIL
    C_DUP --> B_CONFIRM
    B_FAIL --> A_RETRY
    A_RETRY -->|Có| B10
    A_RETRY -->|Không| A_END_FAIL
```

## Ghi chú

| Màu / Ký hiệu | Ý nghĩa |
|---|---|
| 🟢 Bắt đầu / Kết thúc thành công | Happy path |
| 🔴 Kết thúc thất bại | Exception path |
| Hình thoi `{...}` | Điểm quyết định (Decision node) |
| Swimlane `USER` | Các hành động do khách hàng thực hiện |
| Swimlane `FRONTEND` | Xử lý tại trình duyệt / Next.js |
| Swimlane `BACKEND` | Xử lý tại NestJS API |
| Swimlane `DB` | Thao tác với PostgreSQL |

## Các nhánh Ngoại lệ được thể hiện

1. **API lỗi khi tải menu** → Hiển thị thông báo lỗi, không crash app.
2. **Chưa đăng nhập** → Chuyển hướng đăng nhập, giữ nguyên giỏ hàng.
3. **Payload không hợp lệ** → Trả 400, hiển thị lỗi cụ thể.
4. **Hết hàng (Optimistic Lock thất bại)** → Rollback, trả 409 Conflict.
5. **Thanh toán thất bại** → PAYMENT_FAILED, cho phép retry với key mới.
6. **Retry trùng lặp (same Idempotency-Key)** → Trả kết quả cũ, không xử lý lại.
