# BrewLite ☕

> Ứng dụng đặt cà phê và thanh toán không dùng tiền mặt — Đồ án môn Công nghệ Phần mềm, Đại học Sài Gòn.

## Giới thiệu

BrewLite giúp khách hàng đặt và thanh toán đồ uống chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.

## Cấu trúc Repository (Monorepo)

```
brewlite/
├── apps/
│   ├── api/          # Backend NestJS (TypeScript) — Port 4000
│   └── web/          # Frontend Next.js (TypeScript) — Port 3000
├── database/         # SQL schema dump gốc
├── docs/
│   ├── requirements/ # SRS, Use-Cases, Context & Scope
│   ├── diagrams/     # Activity, Sequence, Class diagrams (.puml + .svg)
│   └── architecture/ # Kiến trúc tổng thể + ADRs
├── tests/            # Integration & E2E tests
├── .env.example      # Template biến môi trường
├── docker-compose.yml
└── README.md
```

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js 16 (TypeScript), TailwindCSS, Zustand |
| Backend | NestJS 12 (TypeScript), Passport-JWT, class-validator |
| Database | PostgreSQL 16 + Prisma ORM |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Chạy Local (Docker)

**Yêu cầu:** Docker Desktop đã cài và đang chạy.

```bash
# 1. Sao chép biến môi trường
cp .env.example .env

# 2. Khởi động toàn bộ hệ thống
docker compose up --build

# Truy cập:
#   Frontend: http://localhost:3000
#   Backend:  http://localhost:4000
#   Health:   http://localhost:4000/health
```

## Chạy Development (Không dùng Docker)

```bash
# ── Backend ──
cd apps/api
cp .env.example .env          # cấu hình DATABASE_URL
npm install
npx prisma migrate dev        # chạy migration
npx prisma db seed            # seed dữ liệu mẫu
npm run start:dev             # http://localhost:4000

# ── Frontend ──
cd apps/web
cp .env.example .env.local    # cấu hình NEXT_PUBLIC_API_URL
npm install
npm run dev                   # http://localhost:3000
```

## Kiểm thử

```bash
# Unit tests (backend)
cd apps/api && npm test

# Unit tests (frontend)
cd apps/web && npm test

# Integration & E2E tests
cd tests && npm test
```

## CI/CD

- **CI:** GitHub Actions tự động chạy Lint → Test → Build trên mỗi Pull Request.
- **CD:** Tự động deploy lên Production khi push tag hoặc merge vào `main`.

## Tài liệu

| Tài liệu | Đường dẫn |
|---|---|
| Bối cảnh & Phạm vi | `docs/requirements/context-and-scope.md` |
| Đặc tả Yêu cầu (SRS) | `docs/requirements/srs.md` |
| Sơ đồ hệ thống (UML) | `docs/diagrams/` |
| Kiến trúc & ADR | `docs/architecture/` |
| Ma trận Truy vết | `docs/traceability-matrix.md` |

## Thành viên nhóm

<!-- TODO: Cập nhật danh sách thành viên -->
| Họ tên | MSSV | Vai trò |
|---|---|---|
|  |  |  |
