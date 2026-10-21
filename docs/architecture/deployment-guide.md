# Hướng dẫn Triển khai Production (Deployment Guide) — BrewLite

Tài liệu này hướng dẫn cách triển khai toàn bộ hệ thống BrewLite lên môi trường đám mây (Cloud Production) với HTTPS công khai theo yêu cầu của Task 5.3 & Task 5.4.

---

## 1. Kiến trúc Triển khai Khuyến nghị (Render.com hoặc Railway.app)

Hệ thống gồm 3 thành phần độc lập:
1. **Database:** Managed PostgreSQL (Private Network)
2. **Backend:** NestJS Web Service (Docker / Node.js Runtime) $\rightarrow$ Cổng `4000`
3. **Frontend:** Next.js Web Service $\rightarrow$ Cổng `3000` (Mobile-First PWA)

```text
[Người dùng / Điện thoại]
         │ (HTTPS)
         ▼
┌───────────────────┐        (HTTPS REST)        ┌───────────────────┐
│ Next.js Frontend  │ ─────────────────────────► │  NestJS Backend   │
│ (Vercel / Render) │                            │  (Render / Cloud) │
└───────────────────┘                            └─────────┬─────────┘
                                                           │ (Internal SSL)
                                                           ▼
                                                 ┌───────────────────┐
                                                 │ PostgreSQL 16 DB  │
                                                 │ (Render / Private)│
                                                 └───────────────────┘
```

---

## 2. Các bước triển khai chi tiết lên Render.com (Miễn phí)

### Bước 2.1: Tạo Cơ sở dữ liệu PostgreSQL
1. Đăng nhập [render.com](https://render.com) bằng tài khoản GitHub.
2. Bấm **New +** $\rightarrow$ chọn **PostgreSQL**.
3. Điền thông tin:
   * **Name:** `brewlite-db`
   * **Database:** `brewlite_db`
   * **User:** `brewlite_user`
   * **Region:** Singapore (Southeast Asia - gần nhất, độ trễ thấp)
4. Sau khi tạo xong, sao chép:
   * **Internal Database URL** (dùng cho backend kết nối nội bộ)
   * **External Database URL** (dùng nếu kết nối từ bên ngoài)

---

### Bước 2.2: Triển khai Backend API (NestJS)
1. Bấm **New +** $\rightarrow$ chọn **Web Service**.
2. Chọn repository GitHub: `vogiahuy1211/brewlite`.
3. Cấu hình thông số:
   * **Name:** `brewlite-api`
   * **Root Directory:** `apps/api`
   * **Runtime:** `Node`
   * **Build Command:**
     ```bash
     npm install --legacy-peer-deps && npx prisma generate && npx prisma db push && npx ts-node prisma/seed.ts && npm run build
     ```
   * **Start Command:**
     ```bash
     npm run start:prod
     ```
4. Thêm các biến môi trường (**Environment Variables**):
   * `DATABASE_URL`: *(Dán Internal Database URL từ bước 2.1)*
   * `JWT_SECRET`: `brewlite_super_secret_production_key_2026_xyz`
   * `JWT_EXPIRES_IN`: `7d`
   * `PORT`: `4000`
5. Bấm **Create Web Service**. 
6. Khi deploy xong, bạn sẽ có URL: `https://brewlite-api.onrender.com`.
7. Kiểm tra endpoint kiểm thử: `https://brewlite-api.onrender.com/api/health` $\rightarrow$ Trả về `{"status":"ok","database":"connected"}`.

---

### Bước 2.3: Triển khai Frontend (Next.js)
1. Bấm **New +** $\rightarrow$ chọn **Web Service** (hoặc dùng **Vercel** nếu muốn nhanh nhất).
2. Chọn repository: `vogiahuy1211/brewlite`.
3. Cấu hình thông số:
   * **Name:** `brewlite-web`
   * **Root Directory:** `apps/web`
   * **Runtime:** `Node`
   * **Build Command:**
     ```bash
     npm install && npm run build
     ```
   * **Start Command:**
     ```bash
     npm run start
     ```
4. Thêm biến môi trường:
   * `NEXT_PUBLIC_API_URL`: `https://brewlite-api.onrender.com` *(URL của Backend vừa tạo ở bước 2.2)*
5. Bấm **Deploy**.
6. Khi hoàn tất, bạn sẽ nhận được link HTTPS công khai của app: `https://brewlite-web.onrender.com`.

---

## 3. Kịch bản Rollback khi triển khai thất bại

Nếu phiên bản mới bị lỗi trên Production:
1. Trên giao diện Render/Railway, vào mục **Deploys**.
2. Chọn commit/bản deploy thành công gần nhất trước đó.
3. Bấm nút **Rollback to this deploy**.
4. Hệ thống sẽ tự động khôi phục bản build cũ trong vòng dưới 60 giây.
