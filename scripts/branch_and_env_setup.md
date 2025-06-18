# Git Branch & Dev Environment Setup

## 1. Tạo branch mới để phát triển song song
```bash
git checkout -b feature/multi-agent-system
```

## 2. Thiết lập môi trường dev độc lập
- Tạo virtualenv mới:
  ```bash
  python -m venv .venv-multiagent
  source .venv-multiagent/bin/activate  # hoặc .venv-multiagent\Scripts\activate trên Windows
  pip install -r requirements.txt
  ```
- Copy `.env.example` thành `.env` và cấu hình lại các key cho branch mới
- Đảm bảo workspace, DB, session lưu riêng biệt cho branch mới nếu cần test song song

## 3. Gợi ý lệnh kiểm tra trạng thái branch
```bash
git status
git branch
```
