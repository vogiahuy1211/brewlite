# Sequence Diagram — Đặt và Thanh toán Đơn hàng

> **Use-Case:** UC-07 — Checkout  
> **Công cụ:** Mermaid  
> **Cập nhật:** 2026-10-18

## Sơ đồ

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Khách hàng
    participant UI as 🖥️ Next.js UI
    participant API as ⚙️ NestJS API
    participant DB as 🗄️ PostgreSQL
    participant PAY as 💳 Mock Payment

    %% ══════════════════════════════════════
    %% BƯỚC 1: XEM MENU
    %% ══════════════════════════════════════
    rect rgb(235, 245, 255)
        Note over Customer,DB: 📋 Giai đoạn 1 — Xem Menu
        Customer->>UI: Mở trang chủ
        UI->>API: GET /products
        API->>DB: SELECT * FROM Products WHERE stock > 0
        DB-->>API: Danh sách sản phẩm
        API-->>UI: 200 OK — [ { id, name, price, imageUrl, stock } ]
        UI-->>Customer: Hiển thị lưới sản phẩm (ảnh, tên, giá)
    end

    %% ══════════════════════════════════════
    %% BƯỚC 2: CHỌN MÓN & GIỎ HÀNG
    %% ══════════════════════════════════════
    rect rgb(235, 255, 240)
        Note over Customer,UI: 🛒 Giai đoạn 2 — Chọn món & Giỏ hàng (Client-side)
        Customer->>UI: Chọn sản phẩm → size M → topping
        UI->>API: GET /products/:id
        API->>DB: SELECT product + toppings WHERE id = :id
        DB-->>API: Chi tiết sản phẩm
        API-->>UI: 200 OK — { id, name, price, sizes, toppings }
        UI-->>Customer: Hiển thị màn hình chi tiết + tính giá động
        Customer->>UI: Nhấn "Thêm vào giỏ"
        UI->>UI: Zustand: addToCart(item) — cập nhật state + badge
        Customer->>UI: Nhấn "Thanh toán"
    end

    %% ══════════════════════════════════════
    %% BƯỚC 3: XÁC THỰC
    %% ══════════════════════════════════════
    rect rgb(255, 248, 225)
        Note over Customer,API: 🔐 Giai đoạn 3 — Xác thực JWT
        UI->>UI: Kiểm tra localStorage → token tồn tại?

        alt Chưa đăng nhập
            UI-->>Customer: Redirect → /login?redirect=/checkout
            Customer->>UI: Nhập email + password
            UI->>API: POST /auth/login { email, password }
            API->>DB: SELECT user WHERE email = ?
            DB-->>API: User record (password_hash)
            API->>API: bcrypt.compare(password, hash)
            API-->>UI: 200 OK — { access_token, expires_in: "7d" }
            UI->>UI: localStorage.setItem("token", access_token)
            UI-->>Customer: Redirect về /checkout
        end
    end

    %% ══════════════════════════════════════
    %% BƯỚC 4: TẠO ĐƠN HÀNG
    %% ══════════════════════════════════════
    rect rgb(255, 240, 245)
        Note over Customer,DB: 📦 Giai đoạn 4 — Tạo Đơn hàng
        Customer->>UI: Nhấn "Xác nhận trả" (chọn Ví / Thẻ)
        UI->>UI: Sinh idempotencyKey = uuid()
        UI->>API: POST /orders\nHeader: Authorization: Bearer <token>\nBody: { items: [...], promoCode? }
        API->>API: JwtAuthGuard.canActivate() → giải mã userId
        API->>API: class-validator → validate CreateOrderDto

        alt Payload không hợp lệ
            API-->>UI: 400 Bad Request { errors: [...] }
            UI-->>Customer: Hiển thị lỗi validation
        end

        API->>DB: BEGIN TRANSACTION
        loop Mỗi sản phẩm trong đơn
            API->>DB: SELECT id, stock, version FROM Products\nWHERE id = ? FOR UPDATE
            DB-->>API: { stock, version }

            alt Tồn kho không đủ hoặc version không khớp
                API->>DB: ROLLBACK
                API-->>UI: 409 Conflict { message: "Sản phẩm X đã hết hàng" }
                UI-->>Customer: Thông báo hết hàng
            end

            API->>DB: UPDATE Products\nSET stock = stock - qty,\n    version = version + 1\nWHERE id = ? AND version = ?
        end

        API->>DB: INSERT INTO Orders (userId, status=PENDING, ...)
        API->>DB: INSERT INTO OrderItems (...)
        API->>DB: COMMIT
        DB-->>API: orderId
        API-->>UI: 201 Created\n{ orderId, status: "PENDING", finalAmount }
    end

    %% ══════════════════════════════════════
    %% BƯỚC 5: THANH TOÁN (IDEMPOTENT)
    %% ══════════════════════════════════════
    rect rgb(240, 240, 255)
        Note over Customer,PAY: 💳 Giai đoạn 5 — Thanh toán (Idempotent)
        UI->>API: POST /payments\nHeader: Authorization: Bearer <token>\nBody: { orderId, method, idempotencyKey }
        API->>API: JwtAuthGuard.canActivate()
        API->>DB: SELECT * FROM Payments\nWHERE idempotency_key = ?

        alt Idempotency-Key đã tồn tại (duplicate request)
            DB-->>API: Payment record cũ
            API-->>UI: 200 OK — kết quả của lần xử lý đầu tiên
            Note right of API: ⚡ Không gọi lại Payment Service
        else Lần đầu tiên
            DB-->>API: null
            API->>PAY: processPayment({ amount, method })

            alt Thanh toán THÀNH CÔNG
                PAY-->>API: { success: true, transactionId }
                API->>DB: INSERT INTO Payments\n(orderId, key, status=SUCCESS)
                API->>DB: UPDATE Orders\nSET status = 'PAID'
                API->>DB: UPDATE Users\nSET loyalty_points = loyalty_points + earned
                DB-->>API: OK
                API-->>UI: 200 OK\n{ status: "PAID", orderId, transactionId }
                UI-->>Customer: 🎉 Màn hình Xác nhận\n✓ Đặt hàng thành công\nMã đơn: #1042 | PAID

            else Thanh toán THẤT BẠI
                PAY-->>API: { success: false, reason }
                API->>DB: INSERT INTO Payments\n(orderId, key, status=FAILED)
                API->>DB: UPDATE Orders\nSET status = 'PAYMENT_FAILED'
                DB-->>API: OK
                API-->>UI: 200 OK\n{ status: "PAYMENT_FAILED", message: "..." }
                UI-->>Customer: ❌ Thanh toán thất bại\nNút "Thử lại"
                Note over Customer,UI: Khách thử lại → UI sinh key MỚI\n→ quay lại POST /payments
            end
        end
    end
```

## Ghi chú Kỹ thuật

| # | Điểm kỹ thuật | Vị trí trong sơ đồ |
|---|---|---|
| 1 | **JWT Auth Guard** | Bước 14, 28 — mọi route có dữ liệu nhạy cảm đều xác thực token |
| 2 | **class-validator** | Bước 16 — validate DTO trước khi xử lý business logic |
| 3 | **Database Transaction** | Bước 18–26 — BEGIN → UPDATE stock → INSERT Order → COMMIT/ROLLBACK |
| 4 | **Optimistic Locking** | Bước 21 — `WHERE id = ? AND version = ?` chống race condition |
| 5 | **Idempotency-Key** | Bước 30–32 — kiểm tra key trước khi gọi Payment, trả lại kết quả cũ nếu trùng |
| 6 | **Loyalty Points** | Bước 38 — cộng điểm ngay khi đơn chuyển sang PAID |
| 7 | **State Machine** | Bước 37, 43 — `assertTransition(PENDING, PAID)` và `assertTransition(PENDING, PAYMENT_FAILED)` |
