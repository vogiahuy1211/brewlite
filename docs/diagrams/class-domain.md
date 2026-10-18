# Class Diagram — Domain Model BrewLite

> **Mức độ:** Domain / Business Layer  
> **Công cụ:** Mermaid  
> **Căn cứ:** `apps/api/prisma/schema.prisma`  
> **Cập nhật:** 2026-10-18

## Sơ đồ

```mermaid
classDiagram
    direction TB

    %% ══════════════════════════════════════
    %% ENUMS
    %% ══════════════════════════════════════
    class OrderStatus {
        <<enumeration>>
        PENDING
        PAID
        PAYMENT_FAILED
        PREPARING
        READY
        COMPLETED
        CANCELLED
    }

    class PaymentMethod {
        <<enumeration>>
        WALLET
        CARD
    }

    class PaymentStatus {
        <<enumeration>>
        SUCCESS
        FAILED
    }

    class ItemSize {
        <<enumeration>>
        S
        M
        L
    }

    %% ══════════════════════════════════════
    %% ENTITIES
    %% ══════════════════════════════════════
    class Users {
        +UUID id
        +String email
        +String password_hash
        +Int loyalty_points
        +register(email, password) Users
        +login(email, password) String
        +addLoyaltyPoints(amount) void
    }

    class Products {
        +UUID id
        +String name
        +Decimal price
        +String image_url
        +Int stock
        +Int version
        +isAvailable(qty) Boolean
        +decreaseStock(qty, version) void
    }

    class Toppings {
        +UUID id
        +String name
        +Decimal price
    }

    class Promotions {
        +UUID id
        +String code
        +Decimal discount_amount
        +Boolean is_active
        +DateTime start_at
        +DateTime end_at
        +isValid() Boolean
        +apply(subtotal) Decimal
    }

    class Orders {
        +UUID id
        +UUID user_id
        +UUID promo_id
        +OrderStatus status
        +Decimal subtotal
        +Decimal discount_amount
        +Decimal final_amount
        +DateTime created_at
        +create(userId, items, promoCode) Orders
        +assertTransition(from, to) void
        +cancel() void
    }

    class OrderItems {
        +UUID id
        +UUID order_id
        +UUID product_id
        +ItemSize size
        +Int qty
        +Decimal unit_price
        +Decimal line_total
        +calculateLineTotal() Decimal
    }

    class OrderItemToppings {
        +UUID order_item_id
        +UUID topping_id
        +Decimal price_at_purchase
    }

    class Payments {
        +UUID id
        +UUID order_id
        +String idempotency_key
        +Decimal amount
        +PaymentMethod method
        +PaymentStatus status
        +process(orderId, method, key) Payments
        +isDuplicate(key) Boolean
    }

    class OrderStateMachine {
        <<service>>
        +VALID_TRANSITIONS Map
        +assertTransition(from OrderStatus, to OrderStatus) void
        +canTransition(from OrderStatus, to OrderStatus) Boolean
    }

    class MockPaymentService {
        <<service>>
        +processPayment(amount, method) PaymentResult
        +simulate(method) Boolean
    }

    %% ══════════════════════════════════════
    %% QUAN HỆ
    %% ══════════════════════════════════════

    %% User → Orders (1 to many)
    Users "1" --> "0..*" Orders : places

    %% Promotions → Orders (1 to many, optional)
    Promotions "0..1" --> "0..*" Orders : applies to

    %% Orders → OrderItems (1 to many)
    Orders "1" *-- "1..*" OrderItems : contains

    %% OrderItems → Products (many to 1)
    OrderItems "0..*" --> "1" Products : references

    %% OrderItems → OrderItemToppings (1 to many)
    OrderItems "1" *-- "0..*" OrderItemToppings : has

    %% OrderItemToppings → Toppings (many to 1)
    OrderItemToppings "0..*" --> "1" Toppings : references

    %% Orders → Payments (1 to many)
    Orders "1" *-- "0..*" Payments : paid by

    %% Enum associations
    Orders --> OrderStatus : status
    Payments --> PaymentMethod : method
    Payments --> PaymentStatus : status
    OrderItems --> ItemSize : size

    %% Service dependencies
    OrderStateMachine ..> OrderStatus : validates
    OrderStateMachine ..> Orders : used by
    MockPaymentService ..> Payments : creates
    MockPaymentService ..> PaymentMethod : uses
```

## Mô tả Chi tiết các Lớp

### Lớp nghiệp vụ (Entity Classes)

| Lớp | Vai trò | Ghi chú quan trọng |
|---|---|---|
| `Users` | Tài khoản người dùng | `password_hash` không bao giờ trả về qua API; `loyalty_points` cộng tự động khi đơn PAID |
| `Products` | Sản phẩm trong menu | Cột `version` dùng cho Optimistic Locking; `stock` không bao giờ âm |
| `Toppings` | Topping có thể thêm vào món | Giá topping lưu snapshot tại thời điểm đặt trong `OrderItemToppings.price_at_purchase` |
| `Promotions` | Mã khuyến mãi | Kiểm tra `is_active` + khoảng thời gian `start_at..end_at` trước khi áp dụng |
| `Orders` | Đơn hàng | Trạng thái chuyển đổi được kiểm soát bởi `OrderStateMachine` |
| `OrderItems` | Dòng sản phẩm trong đơn | Lưu `unit_price` snapshot để bảo toàn giá khi giá sản phẩm thay đổi sau |
| `OrderItemToppings` | Topping đã chọn trong dòng món | Composite PK `(order_item_id, topping_id)` |
| `Payments` | Bản ghi thanh toán | `idempotency_key` là UNIQUE — chống thanh toán trùng |

### Lớp Dịch vụ (Service Classes)

| Lớp | Vai trò | Phương thức chính |
|---|---|---|
| `OrderStateMachine` | Kiểm soát chuyển trạng thái đơn hàng | `assertTransition(from, to)` — ném Exception nếu chuyển trạng thái không hợp lệ |
| `MockPaymentService` | Giả lập cổng thanh toán | `processPayment(amount, method)` — trả về `{ success: boolean }` |

## Bảng Quan hệ

| Quan hệ | Kiểu | Mô tả |
|---|---|---|
| `Users` → `Orders` | 1 — 0..* | Một user có thể có nhiều đơn |
| `Orders` → `OrderItems` | 1 — 1..* | Một đơn phải có ít nhất 1 dòng món |
| `OrderItems` → `Products` | \*..1 | Nhiều dòng món có thể tham chiếu cùng 1 sản phẩm |
| `OrderItems` → `OrderItemToppings` | 1 — 0..* | Một dòng món có thể không có hoặc có nhiều topping |
| `OrderItemToppings` → `Toppings` | \*..1 | Nhiều lựa chọn topping tham chiếu cùng 1 Topping |
| `Orders` → `Payments` | 1 — 0..* | Một đơn có thể có nhiều lần thử thanh toán |
| `Promotions` → `Orders` | 0..1 — 0..* | Một đơn có thể áp 0 hoặc 1 mã giảm giá |
