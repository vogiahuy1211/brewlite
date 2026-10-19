# ADR-001: Sử dụng cấu trúc Monorepo

> **Ngày quyết định:** 2026-10-07  
> **Trạng thái:** Accepted  
> **Người quyết định:** Dev Team

---

## Bối cảnh

Dự án BrewLite gồm 2 ứng dụng độc lập: Frontend (Next.js) và Backend (NestJS), cùng chia sẻ các kiểu dữ liệu (DTO, API response types) và cần phối hợp CI/CD chặt chẽ. Nhóm cần quyết định tổ chức repository theo hướng nào.

## Các lựa chọn đã xem xét

| Lựa chọn | Mô tả |
|---|---|
| **Monorepo** (đã chọn) | Một repository duy nhất, cấu trúc `apps/api` + `apps/web` |
| Multi-repo | Mỗi app một repository riêng biệt |
| Nx / Turborepo Monorepo | Monorepo có công cụ quản lý dependency nâng cao |

## Quyết định

**Chọn Monorepo đơn giản** với cấu trúc `apps/api` và `apps/web` trong cùng 1 repository, không dùng công cụ Monorepo phức tạp (Nx, Turborepo) để giảm độ phức tạp cho đồ án.

## Lý do

- **Chia sẻ context dễ dàng:** Toàn bộ team nhìn thấy cả Frontend và Backend trong cùng 1 nơi.
- **CI/CD đơn giản hơn:** Một file `docker-compose.yml` và một GitHub Actions workflow quản lý cả hai app.
- **Đồng bộ phiên bản:** Commit lịch sử phản ánh đúng sự thay đổi của cả hệ thống, không bị tách rời giữa 2 repo.
- **Phù hợp quy mô:** Đồ án sinh viên không cần Nx hay Turborepo — overkill cho team 6 người.

## Hệ quả

- ✅ Tất cả tài liệu, code và CI/CD nằm tập trung tại một nơi.
- ✅ Dễ review cross-cutting changes (ví dụ: thêm field API ảnh hưởng cả frontend và backend trong cùng 1 PR).
- ⚠️ `node_modules` của `apps/api` và `apps/web` riêng biệt — không share, phải `npm install` từng thư mục.
- ⚠️ Khi dự án lớn lên, sẽ cần cân nhắc chuyển sang Turborepo hoặc Nx.
