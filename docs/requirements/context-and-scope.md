# Bối cảnh & Phạm vi — BrewLite

> **Phiên bản:** 1.0  
> **Ngày cập nhật:** 2026-10-18  
> **Môn học:** Công nghệ Phần mềm — Đại học Sài Gòn

---

## 1. Bối cảnh Bài toán (Problem Context)

Các quán cà phê vừa và nhỏ tại Việt Nam thường gặp tình trạng:

- Khách hàng phải **xếp hàng lâu** tại quầy, đặc biệt giờ cao điểm.
- Nhân viên quầy dễ ghi **nhầm order** khi đông khách.
- **Thanh toán tiền mặt** gây chậm trễ và mất thời gian thối tiền.
- Không có **lịch sử đơn hàng** hay **chương trình khách hàng thân thiết** tự động.

**BrewLite** ra đời nhằm giải quyết các vấn đề trên thông qua một ứng dụng web đặt đồ uống và thanh toán không dùng tiền mặt, hoạt động trên thiết bị di động.

---

## 2. Tuyên bố Tầm nhìn Sản phẩm (Product Vision)

> *"BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."*

---

## 3. Các Bên Liên Quan (Stakeholders)

| # | Nhóm Stakeholder | Vai trò / Kỳ vọng | Mức độ ảnh hưởng |
|---|---|---|---|
| 1 | **Khách hàng (Customer)** | Người dùng cuối — đặt đồ uống, tùy chọn size/topping, thanh toán qua ví/thẻ, xem lịch sử đơn | Cao |
| 2 | **Barista / Nhân viên quầy** | Nhận thông báo đơn mới, cập nhật trạng thái đơn (PREPARING → READY) | Cao |
| 3 | **Quản lý quán / Product Owner** | Quản lý menu sản phẩm, xem báo cáo doanh thu, cấu hình khuyến mãi | Cao |
| 4 | **Giảng viên hướng dẫn** | Đánh giá chất lượng code, tài liệu, quy trình CI/CD, hệ thống production | Cao |
| 5 | **Đội ngũ phát triển (Dev Team)** | Thiết kế, xây dựng, kiểm thử và vận hành hệ thống | Cao |
| 6 | **Cổng thanh toán (Payment Gateway)** | Cung cấp dịch vụ xử lý giao dịch ví điện tử / thẻ ngân hàng (mock trong MVP) | Trung bình |

---

## 4. Phạm vi Hệ thống (System Scope)

### 4.1 Sơ đồ Ngữ cảnh (Context Diagram)

```
┌─────────────────────────────────────────────────────┐
│                    BrewLite System                  │
│                                                     │
│  ┌─────────────┐    REST API    ┌───────────────┐  │
│  │  Next.js    │ ◄────────────► │   NestJS API  │  │
│  │  Web (PWA)  │                │               │  │
│  └─────────────┘                └──────┬────────┘  │
│                                        │            │
│                                        ▼            │
│                                 ┌──────────────┐   │
│                                 │  PostgreSQL  │   │
│                                 │   Database   │   │
│                                 └──────────────┘   │
└─────────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
    [Khách hàng]              [Mock Payment Service]
    [Barista]
    [Quản lý]
```

### 4.2 Trong Phạm vi MVP — In-Scope

| Tính năng | Mô tả ngắn |
|---|---|
| Xem menu sản phẩm | Hiển thị danh sách đồ uống với ảnh, tên, giá |
| Chi tiết & tùy chọn | Chọn size (S/M/L), topping, tính giá động |
| Giỏ hàng | Thêm, sửa số lượng, xóa, xem tổng tiền |
| Đăng ký / Đăng nhập | Tạo tài khoản, xác thực bằng JWT |
| Tạo đơn hàng | Gửi giỏ hàng, tạo đơn trạng thái PENDING |
| Thanh toán | Chọn ví/thẻ, xử lý qua Mock Payment Service |
| Xác nhận & lịch sử đơn | Xem mã đơn, trạng thái và lịch sử các đơn đã đặt |
| Quản lý trạng thái đơn | State Machine: PENDING → PAID → PREPARING → READY → COMPLETED |
| Khuyến mãi (Promotion) | Áp mã giảm giá khi tạo đơn |
| Tích điểm (Loyalty) | Cộng điểm tự động khi đơn chuyển sang PAID |
| Kiểm soát tồn kho | Chống bán âm kho bằng Optimistic Locking |
| Chống thanh toán trùng | Idempotency Key trên endpoint thanh toán |
| Health Check API | `GET /health` cho DevOps và giám sát |
| CI/CD Pipeline | Tự động lint, test, build, deploy lên Production |

### 4.3 Ngoài Phạm vi MVP — Out-of-Scope

| Tính năng | Lý do loại trừ |
|---|---|
| Tích hợp cổng thanh toán thật (MoMo, VNPAY, Stripe) | Cần tài khoản merchant — sẽ mock trong MVP |
| Giao diện quản lý cho Barista / Quản lý (Admin Panel) | Nằm ngoài luồng khách hàng của MVP |
| Thông báo real-time (WebSocket / Push Notification) | Phức tạp hóa kiến trúc, để Sprint sau |
| Hệ thống đánh giá & review sản phẩm | Tính năng phụ, không ảnh hưởng luồng chính |
| Ứng dụng Mobile Native (iOS/Android) | Web PWA đã đáp ứng đủ yêu cầu |
| Đa ngôn ngữ (i18n) | Hệ thống chỉ cần tiếng Việt trong MVP |
| In hóa đơn / Xuất báo cáo PDF | Tính năng vận hành nâng cao |

---

## 5. Giả định (Assumptions)

| # | Giả định |
|---|---|
| A-01 | Khách hàng đã có điện thoại có kết nối Internet và trình duyệt web hiện đại. |
| A-02 | Hệ thống Mock Payment Service luôn trả về kết quả xác định (thành công / thất bại) trong vòng 2 giây. |
| A-03 | Dữ liệu menu sản phẩm được seed thủ công bởi đội dev; chưa có giao diện admin để quản lý. |
| A-04 | Mỗi người dùng chỉ có một tài khoản được định danh bởi email duy nhất. |
| A-05 | Đơn vị tiền tệ sử dụng là VNĐ (VND), không cần chuyển đổi ngoại tệ. |
| A-06 | Môi trường Production được cung cấp bởi một trong các nền tảng: Render, Railway, Fly.io, hoặc VPS. |

---

## 6. Ràng buộc (Constraints)

| # | Loại | Ràng buộc |
|---|---|---|
| C-01 | Kỹ thuật | Frontend phải dùng **Next.js** (TypeScript); Backend phải dùng **NestJS** (TypeScript). |
| C-02 | Kỹ thuật | Cơ sở dữ liệu phải là **PostgreSQL**, truy cập qua **Prisma ORM** với Migration. |
| C-03 | Bảo mật | Mật khẩu người dùng phải được băm bằng **bcrypt** trước khi lưu vào database. |
| C-04 | Bảo mật | Xác thực API bằng **JWT stateless** (không lưu session phía server). |
| C-05 | DevOps | Toàn bộ hệ thống phải có thể khởi động tại local bằng một lệnh `docker compose up`. |
| C-06 | DevOps | Hệ thống Production phải chạy qua **HTTPS** và đang hoạt động tại thời điểm nghiệm thu. |
| C-07 | Quy trình | Mọi tính năng phải đi qua Pull Request và CI Pipeline phải pass trước khi merge. |
| C-08 | Môn học | Phải tuân thủ thứ tự nộp: Task 1 → Task 2 → Task 3 → Task 4 → Task 5. |

---

## 7. Rủi ro ban đầu (Initial Risks)

| # | Rủi ro | Xác suất | Tác động | Biện pháp giảm thiểu |
|---|---|---|---|---|
| R-01 | Deploy Production thất bại trước ngày nghiệm thu | Trung bình | Cao | Thiết lập CD + Smoke Test sớm; có kịch bản Rollback |
| R-02 | Race condition khi nhiều user đặt cùng 1 món hết hàng | Thấp | Cao | Optimistic Locking với cột `version` + Unit Test |
| R-03 | Thanh toán bị gọi 2 lần do mạng chậm | Trung bình | Cao | Idempotency Key trên bảng `Payments` + Integration Test |
| R-04 | Lộ thông tin nhạy cảm (JWT Secret, DB Password) qua Git | Thấp | Rất cao | `.gitignore` loại trừ `.env`; dùng biến môi trường trên CI/CD |
| R-05 | Tài liệu không khớp với code thực tế (Traceability) | Trung bình | Cao | Duy trì `traceability-matrix.md` song song với từng sprint |
