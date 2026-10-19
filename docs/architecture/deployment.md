# Mô tả Môi trường Triển khai — BrewLite

> **Phiên bản:** 1.0  
> **Ngày cập nhật:** 2026-10-19  
> **Nền tảng Production:** Railway (hoặc Render / Fly.io)

---

## Sơ đồ Triển khai

Xem file [`deployment.svg`](./deployment.svg) hoặc mã nguồn [`deployment.mmd`](./deployment.mmd).

---

## 1. Môi trường Local (Development)

**Khởi động:** `docker compose up --build`

| Service | Image | Port (host) | Port (container) |
|---|---|---|---|
| `brewlite_web` | Dockerfile từ `apps/web` | 3000 | 3000 |
| `brewlite_api` | Dockerfile từ `apps/api` | 4000 | 4000 |
| `brewlite_postgres` | `postgres:16-alpine` | 5432 | 5432 |

**Network:** Docker internal network `brewlite_net` — các container giao tiếp qua tên service.  
**Volume:** `postgres_data` — persistent, không mất data khi restart container.  
**Healthcheck:** PostgreSQL phải `healthy` trước khi API container khởi động (`depends_on.condition: service_healthy`).

---

## 2. CI Pipeline (Pull Request)

**Trigger:** Mỗi khi mở hoặc cập nhật Pull Request vào `main`.

```
npm install (api + web)
     │
     ▼
  Lint (oxlint + eslint)
     │
     ▼
  Unit Tests (jest)
     │
     ▼
  Build (nest build + next build)
     │
     ▼
  ✅ Pass → PR có thể merge
  ❌ Fail → Block merge
```

**Branch Protection:** Bật rule `Require status checks to pass before merging` trên nhánh `main`.

---

## 3. CD Pipeline (Deploy Production)

**Trigger:** Push vào nhánh `main` hoặc tạo Git tag `v*.*.*`.

```
Lint + Test
     │
     ▼
Build Docker Images (api + web)
     │
     ▼
Push to GitHub Container Registry (ghcr.io)
     │
     ▼
Deploy to Production (Railway CLI / Render Deploy Hook)
     │
     ▼
Run DB Migration: prisma migrate deploy
     │
     ▼
Smoke Test: GET https://<api-url>/health → expect 200 OK
     │
     ▼
✅ Deployed successfully
```

**Rollback:** Nếu Smoke Test thất bại → trigger redeploy phiên bản Docker image trước đó.

---

## 4. Môi trường Production

### Cấu hình Service

| Service | URL | Ghi chú |
|---|---|---|
| **Web** (Next.js) | `https://brewlite.up.railway.app` | Public HTTPS, CDN edge |
| **API** (NestJS) | `https://brewlite-api.up.railway.app` | Public HTTPS, có `/health` |
| **Database** (PostgreSQL) | Internal only | Không expose port ra ngoài |

### Biến môi trường (Secrets)

| Biến | Service | Mô tả |
|---|---|---|
| `DATABASE_URL` | API | Connection string PostgreSQL (private) |
| `JWT_SECRET` | API | Chuỗi ngẫu nhiên ≥ 32 ký tự |
| `JWT_EXPIRES_IN` | API | `7d` |
| `PORT` | API | `4000` |
| `NEXT_PUBLIC_API_URL` | Web | URL public của API |

> ⚠️ **Không bao giờ** commit các giá trị thực của biến môi trường vào Git. Chỉ commit file `.env.example` với giá trị placeholder.

### Bảo mật Production

- **Database:** Port 5432 không expose ra Internet — chỉ truy cập qua internal network.
- **API:** HTTPS bắt buộc, TLS do nền tảng (Railway/Render) quản lý.
- **Secrets:** Quản lý qua dashboard Railway/Render hoặc GitHub Secrets (không hardcode).
- **CORS:** API chỉ cho phép origin từ domain Frontend production.

---

## 5. Checklist trước khi Nghiệm thu

- [ ] URL Frontend (`https://...`) truy cập được và hiển thị Menu.
- [ ] URL API Health (`https://.../health`) trả về `200 OK`.
- [ ] Database **không** expose port ra public Internet.
- [ ] Tất cả biến môi trường production đã được set (không dùng giá trị mặc định từ `.env.example`).
- [ ] CI Pipeline báo xanh trên Pull Request.
- [ ] CD Pipeline chạy thành công và Smoke Test pass.
- [ ] Không có file `.env` chứa secret thật nào được commit vào Git.
