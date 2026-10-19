# ADR-004: Kiểm soát Tồn kho Đồng thời bằng Optimistic Locking

> **Ngày quyết định:** 2026-10-07  
> **Trạng thái:** Accepted  
> **Người quyết định:** Dev Team

---

## Bối cảnh

Khi nhiều khách hàng cùng đặt một món đang có ít hàng tồn kho, có thể xảy ra race condition dẫn đến **Overselling** (bán âm kho). Ví dụ: 2 khách cùng đọc `stock = 1`, cả hai thấy còn hàng, và cả hai đều tạo đơn thành công — kết quả `stock = -1`.

Hệ thống cần một cơ chế đảm bảo tính toàn vẹn tồn kho mà không ảnh hưởng quá nhiều đến hiệu năng.

## Các lựa chọn đã xem xét

| Lựa chọn | Cơ chế | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **Optimistic Locking** (đã chọn) | Cột `version` + `WHERE version = ?` | Hiệu năng cao, không block | Cần retry logic khi conflict |
| Pessimistic Locking | `SELECT ... FOR UPDATE` | Đảm bảo 100% | Block row, giảm throughput |
| Application Lock | Mutex/Queue tại tầng service | Không cần DB | Không hoạt động khi scale ngang |

## Quyết định

**Sử dụng Optimistic Locking** với cột `version` trong bảng `Products`.

### Cơ chế hoạt động

```sql
-- Bước 1: Đọc stock và version hiện tại trong Transaction
BEGIN;
SELECT stock, version FROM "Products" WHERE id = $1;
-- → { stock: 1, version: 5 }

-- Bước 2: Kiểm tra tồn kho
-- Nếu stock < qty → ROLLBACK → trả 409

-- Bước 3: Cập nhật với điều kiện version khớp
UPDATE "Products"
SET stock = stock - $qty,
    version = version + 1
WHERE id = $1 AND version = $2;
-- Nếu 0 rows affected → version đã bị thay đổi bởi request khác → ROLLBACK → retry

COMMIT;
```

### Xử lý conflict

```typescript
// Trong OrdersService
async createOrder(dto: CreateOrderDto) {
  return this.prisma.$transaction(async (tx) => {
    for (const item of dto.items) {
      const product = await tx.products.findUnique({
        where: { id: item.productId }
      });

      if (product.stock < item.qty) {
        throw new ConflictException(`Sản phẩm ${product.name} đã hết hàng`);
      }

      const updated = await tx.products.updateMany({
        where: { id: item.productId, version: product.version },
        data: { stock: { decrement: item.qty }, version: { increment: 1 } }
      });

      if (updated.count === 0) {
        throw new ConflictException(`Xung đột tồn kho, vui lòng thử lại`);
      }
    }
    // ... tạo Order và OrderItems
  });
}
```

## Lý do chọn Optimistic Locking

- **Hiệu năng:** Không lock row trong suốt quá trình xử lý — các request khác vẫn đọc được.
- **Schema đã sẵn sàng:** Cột `version` đã có trong `schema.prisma` từ đầu.
- **Phù hợp traffic thấp-trung bình:** Xác suất conflict thấp trong điều kiện quán cà phê thực tế.
- **Dễ test:** Có thể viết unit/integration test giả lập concurrent requests.

## Hệ quả

- ✅ Tồn kho không bao giờ âm.
- ✅ Hiệu năng tốt hơn Pessimistic Locking khi traffic thấp.
- ✅ Schema `Products` đã có `version` và `stock` sẵn sàng.
- ⚠️ Khi conflict xảy ra, client nhận 409 và cần xử lý (hiển thị thông báo hết hàng).
- ⚠️ Không tự retry — client phải làm mới giỏ hàng và thử lại thủ công.
