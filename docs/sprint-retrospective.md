# Báo cáo Sprint Review & Sprint Retrospective — BrewLite

> **Đề tài:** BrewLite — Hệ thống đặt cà phê và thanh toán không dùng tiền mặt  
> **Môn học:** Công nghệ Phần mềm — ĐH Sài Gòn  
> **Thời gian:** Học kỳ I, Năm học 2026–2027  

---

## PHẦN 1: SPRINT REVIEW (BÀN GIAO SẢN PHẨM)

### 1. Mục tiêu Sprint (Sprint Goal)
* **Sprint 1:** Thiết lập kiến trúc Monorepo, xây dựng API Menu (`/api/products`), giao diện danh sách món Mobile-First và CI Pipeline tự động.
* **Sprint 2:** Hoàn thiện luồng người dùng End-to-End: Tùy biến món (Size/Topping) $\rightarrow$ Giỏ hàng Zustand $\rightarrow$ Xác thực JWT $\rightarrow$ Đặt hàng $\rightarrow$ Thanh toán Idempotent $\rightarrow$ Xác nhận & Lịch sử đơn. Kiểm soát tồn kho và máy trạng thái đơn hàng.

### 2. Kết quả đạt được (Demo & Increment)
1. **Luồng người dùng (Customer Flow):**
   * Đã kiểm thử thành công trên cả trình duyệt máy tính và thiết bị di động thật (iOS/Android) qua mạng nội bộ.
   * Tính giá động chính xác theo Size (S: 0đ, M: +5k, L: +10k) và 5 loại Topping.
   * Áp dụng mã giảm giá thành công (`WELCOME10` giảm 10.000đ).
   * Tự động cộng điểm thưởng thành viên (Loyalty points: 10.000đ = 1 điểm).
2. **Nghiệp vụ Backend Chuyên sâu (Task 10):**
   * **Order State Machine:** Đạt 10/10 test cases, chặn hoàn toàn các hành vi nhảy cóc trạng thái sai.
   * **Idempotent Payment:** Bảo vệ giao dịch an toàn, gửi nhiều lần cùng một `Idempotency-Key` chỉ tạo đúng 1 bản ghi thanh toán.
   * **Concurrency Control:** Áp dụng Optimistic Locking (`version`), đặt đồng thời không bao giờ bị âm tồn kho.
3. **Chất lượng mã nguồn:**
   * CI Pipeline tự động kiểm tra Lint, Test và Build trên mỗi Pull Request.
   * Tách biệt rõ ràng các tầng: Presentation (Next.js) $\leftrightarrow$ Business API (NestJS) $\leftrightarrow$ Data Layer (PostgreSQL + Prisma).

---

## PHẦN 2: SPRINT RETROSPECTIVE (CẢI TIẾN QUY TRÌNH)

### 1. Những điều nhóm đã làm tốt (What went well)
* **Tuân thủ quy trình chặt chẽ:** Đi đúng thứ tự 5 Task tuần tự từ Khai thác yêu cầu (SRS) $\rightarrow$ Mô hình hóa UML $\rightarrow$ Kiến trúc & ADR $\rightarrow$ Sprint 1 $\rightarrow$ Sprint 2.
* **Phối hợp công nghệ hiệu quả:** Sự kết hợp giữa Next.js Turbopack và NestJS mang lại hiệu năng phản hồi API cực nhanh (< 200ms).
* **Ma trận truy vết (Traceability Matrix):** Toàn bộ $FR-01 \rightarrow FR-10$ đều được ánh xạ rõ ràng sang file code và test case tương ứng.
* **Xử lý kịp thời các vấn đề môi trường:** Khắc phục thành công sự cố cross-origin dev resource trên thiết bị di động và xung đột CI.

### 2. Những điểm còn hạn chế và thách thức (What could be improved)
* **Quản lý biến môi trường:** Ban đầu cấu hình IP giữa máy tính và điện thoại cần chỉnh sửa thủ công (`.env.local`).
* **Hạ tầng kiểm thử:** Cần thời gian cài đặt PostgreSQL service cho GitHub Actions để chạy các test case tích hợp.
* **Phạm vi mở rộng:** Chưa có giao diện thời gian thực (WebSocket) thông báo cho Barista khi có đơn mới (thuộc phạm vi Out-of-Scope trong MVP).

### 3. Kế hoạch hành động cho phiên bản sau (Action Items)
* **Kế hoạch 1:** Tích hợp Webhook thật từ MoMo/VNPAY khi chuyển sang giai đoạn thương mại hóa.
* **Kế hoạch 2:** Xây dựng Dashboard riêng cho Barista và Quản trị viên cửa hàng để quản lý tồn kho trực tiếp.
* **Kế hoạch 3:** Đóng gói toàn bộ hệ thống bằng Docker Production Container để việc triển khai lên bất kỳ Cloud Provider nào cũng diễn ra trong 1 bước duy nhất.
