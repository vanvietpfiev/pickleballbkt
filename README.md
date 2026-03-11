# Giải Pickleball Ban Kỹ Thuật — Vietnam Airlines 🏓

Ứng dụng quản lý giải Pickleball nội bộ cho Ban Kỹ Thuật – Vietnam Airlines.

## Tính Năng

- **Quản lý VĐV**: Thêm/sửa/xóa/import danh sách vận động viên với điểm đánh giá
- **Chia đội cân bằng**: Thuật toán cân bằng tổng điểm + hỗ trợ đội ghép sẵn
- **Bảng đấu tự động**: Vòng bảng round-robin → knockout
- **Cập nhật kết quả**: Nhập tỉ số theo set (Best of 3)
- **Bảng xếp hạng**: Realtime + vinh danh Top 3 với hiệu ứng confetti

## Chạy Local

Mở trực tiếp file `index.html` bằng trình duyệt.

Hoặc dùng Python server:
```bash
python -m http.server 8000
```
Truy cập: http://localhost:8000

## Deploy (Streamlit)

```bash
pip install streamlit
streamlit run app.py
```

## Tech Stack

- HTML / CSS / JavaScript (Vanilla)
- Streamlit (deployment wrapper)
- localStorage (data persistence)
