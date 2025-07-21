# Implementation Plan

- [x] 1. Tạo cấu trúc types và interfaces cơ bản
  - Tạo file types cho EmployeeDeliveryReceiptInventory với đầy đủ type definitions
  - Định nghĩa interfaces cho API responses, filters, và form data
  - Tạo error types và validation schemas
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Tạo API route handler cho stored procedure
  - Implement GET endpoint `/api/employee-delivery-receipt-inventory` để gọi stored procedure
  - Xử lý query parameters cho filtering (plan_code, product_code, production_step_code, employee_id)
  - Implement pagination và sorting logic
  - Thêm error handling và validation cho API inputs
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Tạo API endpoint cho filter options
  - Implement GET endpoint `/api/employee-delivery-receipt-inventory/filter-options`
  - Truy vấn database để lấy danh sách plans, products, production steps, employees
  - Format dữ liệu cho dropdown components
  - Cache filter options để tối ưu performance
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Tạo custom hooks cho data fetching
  - Implement `useEmployeeDeliveryReceiptInventory` hook với TanStack Query
  - Implement `useEmployeeDeliveryReceiptInventoryFilters` hook cho filter state management
  - Thêm error handling và loading states
  - Implement URL sync cho filters
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 5. Tạo filter component
  - Implement `EmployeeDeliveryReceiptInventoryFilter` component
  - Tạo search input với debouncing
  - Tạo dropdown selects cho plan, product, production step, employee
  - Implement clear filters functionality
  - Thêm responsive design cho mobile
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2_

- [x] 6. Tạo skeleton loading component
  - Implement `EmployeeDeliveryReceiptInventorySkeleton` component
  - Tạo skeleton animation cho table rows
  - Tạo skeleton cho filter section và summary cards
  - Đảm bảo skeleton match với layout thực tế
  - _Requirements: 7.3_

- [x] 7. Tạo main list component với table display
  - Implement `EmployeeDeliveryReceiptInventoryList` component
  - Tạo responsive table với TanStack Table
  - Implement các cột: employee, plan, product, step, quantities, completion rate
  - Thêm sorting functionality cho các cột
  - Format numbers với thousand separators
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 6.1, 6.2, 7.1, 7.2_

- [x] 8. Implement summary statistics cards
  - Tạo summary cards hiển thị tổng records, employees, assigned, received
  - Calculate và hiển thị average completion rate
  - Update statistics khi filters thay đổi
  - Thêm icons và styling cho cards
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Implement completion rate visualization
  - Thêm color coding cho completion rate column (red < 50%, yellow 50-99%, green >= 100%)
  - Tạo progress bar visualization cho completion rates
  - Format percentage display với 2 decimal places
  - Thêm tooltips cho completion rate explanation
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 10. Tạo Excel export functionality
  - Implement `useEmployeeDeliveryReceiptInventoryExport` hook
  - Tạo API endpoint `/api/employee-delivery-receipt-inventory/export`
  - Generate Excel file với filtered data
  - Implement download với proper filename format
  - Thêm loading state cho export process
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 11. Tạo page component và routing
  - Tạo page component tại `/dashboard/employee-delivery-receipt-inventory`
  - Integrate main list component vào page layout
  - Thêm page title và breadcrumb navigation
  - Implement proper error boundaries
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 12. Implement pagination và performance optimizations
  - Thêm pagination controls cho large datasets
  - Implement virtual scrolling nếu cần thiết
  - Optimize re-renders với React.memo và useMemo
  - Thêm debouncing cho search inputs
  - _Requirements: 7.4_

- [x] 13. Thêm responsive design và mobile optimization
  - Implement responsive table với horizontal scroll trên mobile
  - Optimize filter layout cho mobile devices
  - Thêm collapsible filter panel
  - Test và fix layout issues trên các screen sizes
  - _Requirements: 7.1, 7.2_

- [x] 14. Implement error handling và user feedback
  - Thêm comprehensive error handling cho tất cả API calls
  - Implement retry mechanisms cho failed requests
  - Tạo user-friendly error messages
  - Thêm toast notifications cho actions
  - _Requirements: 1.4_

- [x] 15. Viết unit tests cho components và hooks
  - Test `EmployeeDeliveryReceiptInventoryList` component rendering và interactions
  - Test `EmployeeDeliveryReceiptInventoryFilter` component functionality
  - Test custom hooks với mock data
  - Test error scenarios và edge cases
  - _Requirements: All requirements_

- [x] 16. Viết integration tests cho API endpoints
  - Test API route handlers với different query parameters
  - Test stored procedure integration
  - Test error handling và validation
  - Test export functionality
  - _Requirements: All requirements_

- [x] 17. Implement accessibility features
  - Thêm ARIA labels cho screen readers
  - Implement keyboard navigation support
  - Test với screen reader software
  - Ensure proper focus management
  - _Requirements: 7.1, 7.2_

- [x] 18. Performance testing và optimization
  - Test với large datasets
  - Optimize query performance
  - Implement caching strategies
  - Monitor và optimize bundle size
  - _Requirements: 7.4_

- [x] 19. Final integration và testing
  - Integration testing với existing system
  - End-to-end testing của complete user workflows
  - Cross-browser testing
  - Performance testing trên production-like environment
  - _Requirements: All requirements_

- [x] 20. Documentation và deployment preparation

  - Update API documentation
  - Tạo user guide cho feature
  - Prepare deployment scripts nếu cần
  - Final code review và cleanup
  - _Requirements: All requirements_
