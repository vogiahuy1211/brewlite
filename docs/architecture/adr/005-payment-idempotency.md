# ADR-005: Chống Thanh toán Trùng lặp bằng Idempotency Key

> **Ngày quyết định:** 2026-10-07  
> **Trạng thái:** Accepted  
> **Người quyết định:** Dev Team

---

## Bối cảnh

Trong môi trường mạng không ổn định, client có thể gửi cùng một request thanh toán nhiều lần do:
- Timeout — client không nhận được response và retry.
- Double-click — người dùng bấm nút "Thanh toán" 2 lần liên tiếp.
- Network retry tự động của thư viện HTTP.

Nếu không có cơ chế bảo vệ, mỗi request có thể tạo một giao dịch thanh toán mới và trừ tiền nhiều lần.

## Các lựa chọn đã xem xét

| Lựa chọn | Cơ chế |
|---|---|
| **Idempotency Key** (đã chọn) | Client sinh UUID và gửi kèm request; server lưu và kiểm tra |
| Disable nút sau click | Chỉ bảo vệ ở frontend, không bảo vệ ở server |
| Chỉ kiểm tra trạng thái đơn | Không đủ — race condition vẫn xảy ra khi 2 request song song |

## Quyết định

**Sử dụng Idempotency Key** — Client sinh UUID v4 trước khi gọi `POST /payments` và gửi kèm trong body request. Server lưu key vào bảng `Payments` với ràng buộc `UNIQUE`.

### Cơ chế hoạt động

```
Client                              Server                    DB
  │                                    │                       │
  │── POST /payments ──────────────────►│                       │
  │   { orderId,                        │── SELECT FROM Payments│
  │     method: "WALLET",               │   WHERE key = uuid ──►│
  │     idempotencyKey: "uuid-1234" }   │◄── null ──────────────│
  │                                    │                       │
  │                                    │── Gọi MockPayment     │
  │                                    │── INSERT Payments ────►│
  │                                    │   (key = "uuid-1234") │
  │◄── 200 OK { status: "PAID" } ──────│                       │
  │                                    │                       │
  │ [Mạng lỗi, retry sau 2s]           │                       │
  │                                    │                       │
  │── POST /payments ──────────────────►│                       │
  │   { idempotencyKey: "uuid-1234" }   │── SELECT FROM Payments│
  │                                    │   WHERE key = uuid ──►│
  │                                    │◄── Payment record ─────│
  │◄── 200 OK { status: "PAID" } ──────│ (trả lại kết quả cũ) │
  │   (KHÔNG trừ tiền lần 2)           │                       │
```

### Implementation

```typescript
// PaymentsService
async processPayment(dto: CreatePaymentDto): Promise<Payment> {
  // 1. Kiểm tra key đã tồn tại chưa
  const existing = await this.prisma.payments.findUnique({
    where: { idempotency_key: dto.idempotencyKey }
  });

  if (existing) {
    return existing; // Trả lại kết quả cũ — không xử lý lại
  }

  // 2. Gọi Mock Payment Service
  const result = await this.mockPaymentService.processPayment(dto.amount, dto.method);

  // 3. Lưu kết quả với key
  return this.prisma.payments.create({
    data: {
      order_id: dto.orderId,
      idempotency_key: dto.idempotencyKey,
      amount: dto.amount,
      method: dto.method,
      status: result.success ? 'SUCCESS' : 'FAILED'
    }
  });
}
```

### Quy tắc sinh Idempotency Key

- **Client** sinh UUID v4 mới cho **mỗi lần thanh toán mới** (không phải mỗi lần retry).
- **Retry** sau thất bại (`PAYMENT_FAILED`) phải sinh **key mới** — vì đây là hành động thanh toán mới.
- **Duplicate detection** chỉ áp dụng khi client muốn gửi lại đúng request cũ (do timeout, không nhận được response).

## Lý do

- **Đảm bảo "exactly-once" semantics** — thanh toán chỉ được xử lý đúng một lần dù có bao nhiêu retry.
- **DB UNIQUE constraint** làm lớp bảo vệ cuối — ngay cả khi 2 request cùng lúc vượt qua application check.
- **Schema đã sẵn sàng:** Cột `idempotency_key VARCHAR(255) UNIQUE` đã có trong bảng `Payments`.

## Hệ quả

- ✅ Không bao giờ trừ tiền 2 lần cho cùng 1 ý định thanh toán.
- ✅ Safe to retry — client có thể retry thoải mái mà không lo mất tiền.
- ✅ Có thể viết Integration Test chứng minh: gọi 2 lần cùng key → chỉ 1 bản ghi trong DB.
- ⚠️ Client phải có trách nhiệm sinh và lưu key đúng cách.
- ⚠️ Key không có thời hạn trong MVP — production nên thêm TTL hoặc cleanup job.
