# Beograd Demo (Frontend + Backend)

Demo này mô phỏng 3 trang:

- Login
- Thông tin sinh viên
- Kết quả học tập

## 1) Cấu trúc

- `demo/backend`: API sinh dữ liệu học tập theo học lực + kỳ học
- `demo/frontend`: Next.js + Tailwind UI theo style SaaS dashboard

## 2) Tài khoản demo

- Username: `Beograd`
- Password: `Beograd`

## 3) Cách chạy

### Cách nhanh (1 click)

Double-click file `demo/start-demo.bat`.

File này sẽ tự:

- mở 2 cửa sổ terminal (backend + frontend)
- tự `npm install` nếu chưa có `node_modules`
- đợi frontend sẵn sàng rồi tự mở trang demo `http://localhost:3000`
- chạy backend ở `http://localhost:4000`
- chạy frontend ở `http://localhost:3000`

### Cách thủ công (fallback)

Mở 2 terminal:

### Terminal A - Backend

```bash
cd demo/backend
npm install
npm run dev
```

Backend chạy tại `http://localhost:4000`.

### Terminal B - Frontend

```bash
cd demo/frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:3000`.

## 4) Luồng test

1. Vào trang login.
2. Chọn `học lực` (Xuất sắc/Giỏi/Khá/Trung bình/Yếu/Kém).
3. Chọn `kiểu fill điểm` (Ổn định/Cân bằng/Dao động).
4. Chọn `năm học - học kỳ` mục tiêu.
5. Đăng nhập để hệ thống sinh dữ liệu từ năm 1 kỳ 1 đến kỳ đã chọn.

## 5) Quy tắc tính điểm đã áp dụng

- Quy đổi hệ 10 -> điểm chữ theo bảng bạn gửi:
  - A: 8.5 - 10
  - B+: 7.8 - 8.4
  - B: 7.0 - 7.7
  - C+: 6.3 - 6.9
  - C: 5.5 - 6.2
  - D+: 4.8 - 5.4
  - D: 4.0 - 4.7
  - F+: 3.0 - 3.9
  - F: 0.0 - 2.9
- Quy đổi điểm chữ -> hệ 4:
  - A 4.0, B+ 3.5, B 3.0, C+ 2.5, C 2.0, D+ 1.5, D 1.0, F+ 0.5, F 0.0
- GPA học kỳ và tích lũy tính theo trung bình có trọng số tín chỉ.

## 6) Ghi chú

- Dữ liệu môn học được mô phỏng theo khung chương trình CNTT qua nhiều học kỳ.
- Điểm được tạo tự động để tiệm cận đúng dải học lực đã chọn.
