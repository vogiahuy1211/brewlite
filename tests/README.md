# Hướng dẫn Kiểm thử & Vận hành Tự động (Testing Guide) — BrewLite

Tài liệu này hướng dẫn cách chạy toàn bộ các bài kiểm thử tự động của hệ thống BrewLite, bao gồm Unit Tests, Integration Tests chứng minh 4 nghiệp vụ Task 10 và E2E API Tests.

---

## 1. Danh mục các bộ kiểm thử

| Loại kiểm thử | File thực thi | Mục đích kiểm chứng | Tiêu chí đề bài |
| :--- | :--- | :--- | :--- |
| **Unit Test** | `src/products/products.service.spec.ts` | Kiểm thử logic tìm kiếm sản phẩm và xử lý lỗi 404 | Task 4.3 |
| **Unit Test** | `src/orders/order-state-machine.spec.ts` | Kiểm thử State Machine 10 chuyển đổi trạng thái hợp lệ & chặn chuyển sai | Task 10 (Tiêu chí a) |
| **Integration Test** | `test/task10.e2e-spec.ts` | • **Idempotency-Key**: Gửi 2 lần cùng key chỉ tạo 1 giao dịch duy nhất<br>• **Optimistic Locking**: Đặt đồng thời không vượt tồn kho<br>• **State Machine API**: Chặn nhảy cóc qua HTTP | Task 10 (Tiêu chí a, b, c) |
| **E2E API Test** | `test/app.e2e-spec.ts` | Kiểm tra kết nối cơ sở dữ liệu qua `/api/health` và lấy menu `/api/products` | Task 5.2 |

---

## 2. Hướng dẫn chạy kiểm thử chi tiết

Mở terminal tại thư mục gốc của dự án hoặc thư mục `apps/api`:

### 2.1 Chạy toàn bộ Unit Tests (Không cần DB)
```bash
cd apps/api
npm test
```
*Kết quả mong đợi:* Tất cả test suite trong `src/` đều **PASS**.

### 2.2 Chạy Integration Tests cho Task 10 (Cần kết nối PostgreSQL)
```bash
cd apps/api
npm run test:e2e
```
Lệnh này sẽ tự động chạy:
1. `test/task10.e2e-spec.ts`
   - Test thanh toán trùng lặp (`Idempotency-Key`) $\rightarrow$ PASSED
   - Test đặt hàng đồng thời cạnh tranh số lượng còn lại (`Optimistic Locking`) $\rightarrow$ PASSED
   - Test chặn chuyển trạng thái sai qua API $\rightarrow$ PASSED
2. `test/app.e2e-spec.ts`
   - Test endpoint `/api/health` và `/api/products` $\rightarrow$ PASSED

---

## 3. Kết quả chạy mẫu (Verification Log)

```text
PASS src/orders/order-state-machine.spec.ts
  Order State Machine
    √ cho phép chuyển PENDING -> PAID (1 ms)
    √ cho phép chuyển PENDING -> PAYMENT_FAILED
    √ cho phép chuyển PENDING -> CANCELLED (1 ms)
    √ cho phép chuyển PAID -> PREPARING
    √ cho phép chuyển PREPARING -> READY
    √ cho phép chuyển READY -> COMPLETED (1 ms)
    √ chặn nhảy cóc sai quy trình: PENDING -> COMPLETED (12 ms)
    √ chặn nhảy cóc sai quy trình: PENDING -> READY
    √ chặn chuyển tiếp từ trạng thái kết thúc COMPLETED
    √ chặn chuyển tiếp từ trạng thái kết thúc CANCELLED (1 ms)

PASS test/task10.e2e-spec.ts
  Task 10 Core Business Integration Tests
    Yêu cầu (b): Idempotent Payment
      √ gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn/giao dịch duy nhất (40 ms)
    Yêu cầu (c): Concurrency Control & Optimistic Locking
      √ đặt hàng đồng thời không vượt quá số lượng tồn kho còn lại (không bán âm) (51 ms)
    Yêu cầu (a): Order State Machine qua API
      √ chặn cập nhật trạng thái nhảy cóc bất hợp lệ (ví dụ: PENDING -> COMPLETED) (18 ms)

PASS test/app.e2e-spec.ts
  Health & Products (e2e)
    √ /api/health (GET) (167 ms)
    √ /api/products (GET) (177 ms)
```
