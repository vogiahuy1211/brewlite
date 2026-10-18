# Thư mục này chứa tài liệu thiết kế kiến trúc hệ thống BrewLite (Task 3).

## Cấu trúc

| File / Thư mục | Mô tả |
|---|---|
| `overview.md` | Tài liệu kiến trúc tổng thể (C4 / Layered Architecture) |
| `deployment.md` | Mô tả môi trường triển khai Production |
| `deployment.puml/.svg` | UML Deployment Diagram |
| `adr/` | Thư mục chứa các Architectural Decision Records (ADR) |

## ADRs (Architectural Decision Records)

| File | Quyết định |
|---|---|
| `adr/001-monorepo.md` | Chọn cấu trúc Monorepo |
| `adr/002-database-and-orm.md` | Chọn PostgreSQL + Prisma |
| `adr/003-jwt-authentication.md` | Dùng JWT Stateless Auth |
| `adr/004-inventory-concurrency.md` | Optimistic Locking cho tồn kho |
| `adr/005-payment-idempotency.md` | Idempotency Key chống trùng thanh toán |
