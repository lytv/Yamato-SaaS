# Requirements Document

## Introduction

Chức năng Employee Delivery Receipt Inventory là một hệ thống theo dõi và hiển thị thông tin Giao/Nhận/Tồn kho cho từng nhân viên trong quy trình sản xuất gia công. Hệ thống này sẽ cung cấp giao diện để xem, lọc và xuất báo cáo về tình trạng công việc được giao, đã nhận và tồn kho hiện tại của từng nhân viên theo kế hoạch, sản phẩm và công đoạn sản xuất.

## Requirements

### Requirement 1

**User Story:** Là một quản lý sản xuất, tôi muốn xem tổng quan về tình trạng giao/nhận/tồn của tất cả nhân viên, để có thể theo dõi tiến độ công việc tổng thể.

#### Acceptance Criteria

1. WHEN người dùng truy cập trang Employee Delivery Receipt Inventory THEN hệ thống SHALL hiển thị danh sách tất cả nhân viên với thông tin giao/nhận/tồn
2. WHEN dữ liệu được tải THEN hệ thống SHALL hiển thị các cột: Nhân viên, Kế hoạch, Sản phẩm, Công đoạn, Tổng giao, Tổng nhận, Lỗi, Làm lại, Tồn kho hiện tại, Tỷ lệ hoàn thành
3. WHEN không có dữ liệu THEN hệ thống SHALL hiển thị thông báo "Không có dữ liệu"
4. WHEN có lỗi khi tải dữ liệu THEN hệ thống SHALL hiển thị thông báo lỗi và nút thử lại

### Requirement 2

**User Story:** Là một quản lý sản xuất, tôi muốn lọc dữ liệu theo các tiêu chí khác nhau, để có thể tập trung vào những thông tin cần thiết.

#### Acceptance Criteria

1. WHEN người dùng nhập vào ô tìm kiếm THEN hệ thống SHALL lọc dữ liệu theo tên nhân viên
2. WHEN người dùng chọn kế hoạch từ dropdown THEN hệ thống SHALL lọc dữ liệu theo mã kế hoạch đã chọn
3. WHEN người dùng chọn sản phẩm từ dropdown THEN hệ thống SHALL lọc dữ liệu theo mã sản phẩm đã chọn
4. WHEN người dùng chọn công đoạn từ dropdown THEN hệ thống SHALL lọc dữ liệu theo mã công đoạn đã chọn
5. WHEN người dùng chọn nhân viên cụ thể THEN hệ thống SHALL lọc dữ liệu chỉ cho nhân viên đó
6. WHEN người dùng nhấn "Xóa bộ lọc" THEN hệ thống SHALL reset tất cả bộ lọc về trạng thái mặc định

### Requirement 3

**User Story:** Là một quản lý sản xuất, tôi muốn sắp xếp dữ liệu theo các cột khác nhau, để có thể dễ dàng phân tích thông tin.

#### Acceptance Criteria

1. WHEN người dùng click vào header cột THEN hệ thống SHALL sắp xếp dữ liệu theo cột đó theo thứ tự tăng dần
2. WHEN người dùng click lại vào cùng header cột THEN hệ thống SHALL sắp xếp dữ liệu theo thứ tự giảm dần
3. WHEN dữ liệu được sắp xếp THEN hệ thống SHALL hiển thị biểu tượng mũi tên chỉ hướng sắp xếp
4. WHEN có nhiều cột được sắp xếp THEN hệ thống SHALL ưu tiên cột được click cuối cùng

### Requirement 4

**User Story:** Là một quản lý sản xuất, tôi muốn xuất dữ liệu ra Excel, để có thể chia sẻ và phân tích offline.

#### Acceptance Criteria

1. WHEN người dùng nhấn nút "Xuất Excel" THEN hệ thống SHALL tạo file Excel chứa dữ liệu hiện tại
2. WHEN file Excel được tạo THEN hệ thống SHALL tự động tải file về máy người dùng
3. WHEN có bộ lọc được áp dụng THEN file Excel SHALL chỉ chứa dữ liệu đã được lọc
4. WHEN xuất Excel THEN file SHALL có tên định dạng "Employee_Delivery_Receipt_Inventory_YYYYMMDD_HHMMSS.xlsx"

### Requirement 5

**User Story:** Là một quản lý sản xuất, tôi muốn xem thống kê tổng quan, để có cái nhìn nhanh về tình trạng chung.

#### Acceptance Criteria

1. WHEN trang được tải THEN hệ thống SHALL hiển thị card thống kê tổng số bản ghi
2. WHEN trang được tải THEN hệ thống SHALL hiển thị card thống kê tổng số nhân viên
3. WHEN trang được tải THEN hệ thống SHALL hiển thị card thống kê tổng số lượng đã giao
4. WHEN trang được tải THEN hệ thống SHALL hiển thị card thống kê tổng số lượng đã nhận
5. WHEN có bộ lọc được áp dụng THEN các thống kê SHALL được cập nhật theo dữ liệu đã lọc

### Requirement 6

**User Story:** Là một quản lý sản xuất, tôi muốn xem chi tiết từng dòng dữ liệu với định dạng rõ ràng, để có thể đọc hiểu thông tin dễ dàng.

#### Acceptance Criteria

1. WHEN hiển thị số lượng THEN hệ thống SHALL định dạng số với dấu phân cách hàng nghìn
2. WHEN hiển thị tỷ lệ hoàn thành THEN hệ thống SHALL hiển thị dưới dạng phần trăm với 2 chữ số thập phân
3. WHEN tỷ lệ hoàn thành >= 100% THEN hệ thống SHALL hiển thị màu xanh
4. WHEN tỷ lệ hoàn thành < 50% THEN hệ thống SHALL hiển thị màu đỏ
5. WHEN tỷ lệ hoàn thành >= 50% và < 100% THEN hệ thống SHALL hiển thị màu vàng

### Requirement 7

**User Story:** Là một người dùng, tôi muốn giao diện responsive và thân thiện, để có thể sử dụng trên các thiết bị khác nhau.

#### Acceptance Criteria

1. WHEN truy cập trên mobile THEN giao diện SHALL tự động điều chỉnh để phù hợp với màn hình nhỏ
2. WHEN truy cập trên tablet THEN bảng dữ liệu SHALL có thể cuộn ngang
3. WHEN loading dữ liệu THEN hệ thống SHALL hiển thị skeleton loading animation
4. WHEN có nhiều dữ liệu THEN hệ thống SHALL hỗ trợ phân trang hoặc lazy loading