# ADR-002: Sử dụng PostgreSQL và Prisma ORM

> **Ngày quyết định:** 2026-10-07  
> **Trạng thái:** Accepted  
> **Người quyết định:** Dev Team

---

## Bối cảnh

Hệ thống BrewLite cần một cơ sở dữ liệu lưu trữ dữ liệu có cấu trúc chặt chẽ (Users, Orders, Payments) với yêu cầu tính toàn vẹn giao dịch cao (Transaction, Foreign Key). Đồng thời cần một ORM hỗ trợ Migration tự động và type-safe để phòng tránh lỗi runtime.

## Các lựa chọn đã xem xét

| Thành phần | Lựa chọn đã xem xét |
|---|---|
| **Database** | PostgreSQL, MySQL, MongoDB, SQLite |
| **ORM** | Prisma, TypeORM, Drizzle, Raw SQL |

## Quyết định

**Database:** PostgreSQL 16  
**ORM:** Prisma 6 với Migration và Seeding

## Lý do

### PostgreSQL
- **ACID compliance:** Đảm bảo tính toàn vẹn giao dịch — bắt buộc cho nghiệp vụ tạo đơn + trừ tồn kho trong cùng 1 transaction.
- **`SELECT ... FOR UPDATE`:** Hỗ trợ Pessimistic Locking — nền tảng cho Optimistic Locking với cột `version`.
- **`gen_random_uuid()`:** Sinh UUID v4 tại tầng DB, không phụ thuộc ứng dụng.
- **Ecosystem:** Được hỗ trợ sẵn trên Render, Railway, Fly.io — các nền tảng deploy đề bài cho phép.

### Prisma
- **Type-safe client:** Tự động sinh TypeScript types từ `schema.prisma` — phát hiện lỗi tại compile time.
- **Migration rõ ràng:** Mỗi thay đổi schema tạo 1 file SQL migration có thể review và rollback.
- **Seeding:** Hỗ trợ `prisma db seed` để inject dữ liệu mẫu — cần thiết cho demo và testing.
- **Dễ học:** Cú pháp `schema.prisma` trực quan hơn TypeORM decorators.

### Lý do không chọn TypeORM
- Decorator-heavy, khó debug khi query phức tạp.
- Migration của TypeORM dễ gây mất dữ liệu nếu không cẩn thận.

## Hệ quả

- ✅ Schema là **Single Source of Truth** — Prisma tự sinh DB types và client.
- ✅ Migration được version control — dễ track và rollback.
- ✅ Production deploy an toàn bằng `prisma migrate deploy`.
- ⚠️ Phải chạy `prisma generate` sau mỗi lần thay đổi `schema.prisma`.
- ⚠️ Prisma không hỗ trợ tốt một số query rất phức tạp — cần dùng `$queryRaw` trong trường hợp đó.
