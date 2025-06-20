# Tổng hợp các lỗi đã sửa trong quá trình phát triển tính năng Product Step Crosstab

Đây là tài liệu ghi lại chi tiết các lỗi đã phát sinh và được khắc phục trong quá trình triển khai tính năng "Product Step Crosstab", từ khâu backend đến frontend và kiểm thử.

## 1. Lỗi Build Project (`npm run build`)

Quá trình build project đã thất bại nhiều lần với các nguyên nhân khác nhau.

### 1.1. Lỗi do file conflict với App Router

-   **Triệu chứng:** Build thất bại với lỗi liên quan đến cấu trúc file.
-   **Nguyên nhân:** Tồn tại file cũ `src/pages/dashboard.tsx`, vốn thuộc cấu trúc `Pages Router` của Next.js, gây xung đột với cấu trúc `App Router` đang được sử dụng trong dự án.
-   **Giải pháp:** Xóa file `src/pages/dashboard.tsx`.

### 1.2. Lỗi Import trong Client Component

-   **Triệu chứng:** Build thất bại với lỗi "Attempted to import `getTranslations` from `next-intl/server` in a client component".
-   **Nguyên nhân:** Component `ProductStepCrosstabContainer.tsx` được đánh dấu là `"use client"` nhưng lại import `getTranslations` vốn chỉ dành cho Server Component.
-   **Giải pháp:** Thay thế `getTranslations` bằng hook `useTranslations` từ `next-intl` để phù hợp với Client Component.

### 1.3. Lỗi Type và Component không tương thích

-   **Triệu chứng:** Build thất bại tại trang `product-step-crosstab/page.tsx` do props không tương thích.
-   **Nguyên nhân:** Sử dụng component `<DashboardHeader>` không đúng chuẩn của dự án cho việc hiển thị tiêu đề trang. Component chuẩn là `<TitleBar>`.
-   **Giải pháp:** Thay thế `<DashboardHeader>` bằng `<TitleBar>` và truyền prop `title` tương ứng.

### 1.4. Lỗi Type `never` trong `ActiveLink.tsx`

-   **Triệu chứng:** Build thất bại với lỗi type: `Property 'startsWith' does not exist on type 'never'`.
-   **Nguyên nhân:** Prop `href` trong component `ActiveLink` có thể nhận giá trị `null`, nhưng logic bên trong hàm `isActive` không xử lý trường hợp này, dẫn đến lỗi type khi gọi phương thức `startsWith`.
-   **Giải pháp:** Thêm một dòng kiểm tra `if (!href) return false;` ở đầu hàm `isActive` để xử lý trường hợp `href` là `null`.

## 2. Lỗi Test (`npm run test`)

Hệ thống test ban đầu thất bại hoàn toàn với 2 nguyên nhân chính.

### 2.1. Lỗi Cấu hình Vitest

-   **Triệu chứng:** `npm run test` báo lỗi về cấu hình Vitest.
-   **Nguyên nhân:** Trong project tồn tại 2 file cấu hình Vitest là `vitest.config.ts` và `vitest.config.mts`. File `vitest.config.ts` có nội dung không hợp lệ gây ra xung đột.
-   **Giải pháp:** Xóa file `vitest.config.ts` không cần thiết.

### 2.2. Lỗi thiếu Provider Context trong môi trường Test

-   **Triệu chứng:** Hàng loạt test case thất bại với lỗi không tìm thấy `useTranslations` (từ `next-intl`) hoặc `auth()` (từ `Clerk`).
-   **Nguyên nhân:** Môi trường test của Vitest không tự động bao bọc các component với các Provider cần thiết như `NextIntlClientProvider` (cho đa ngôn ngữ) và `ClerkProvider` (cho xác thực).
-   **Giải pháp:**
    1.  Tạo một utility `render` tùy chỉnh tại `src/utils/test-utils.tsx`.
    2.  Utility này sẽ bao bọc component cần test trong `ClerkProvider` và `NextIntlClientProvider` với các cấu hình mặc định.
    3.  Cập nhật tất cả các file test đang bị lỗi để sử dụng hàm `render` tùy chỉnh này thay vì hàm `render` gốc từ `@testing-library/react`.

### 2.3. Lỗi Type trong dữ liệu Mock của Test

-   **Triệu chứng:** Sau khi sửa lỗi Provider, các test case vẫn báo lỗi TypeScript.
-   **Nguyên nhân:** Dữ liệu mock (giả lập) được sử dụng trong các file test không khớp với kiểu dữ liệu (type) thực tế mà component yêu cầu. Ví dụ: một trường `createdAt` được định nghĩa là `Date` nhưng trong mock lại là `string`.
-   **Giải pháp:** Sửa lại kiểu dữ liệu của dữ liệu mock trong các file test (`*.test.tsx`) cho chính xác (ví dụ: `new Date()` thay vì chuỗi ngày tháng).

## 3. Lỗi Linter (`npm run lint`)

-   **Triệu chứng:** Linter báo warning về các button thiếu thuộc tính `type`.
-   **Nguyên nhân:** Các thẻ `<button>` trong các component mới tạo không có thuộc tính `type="button"`. Theo mặc định, button trong một form sẽ có `type="submit"`, có thể gây ra hành vi không mong muốn.
-   **Giải pháp:** Thêm `type="button"` vào tất cả các component button đã tạo (`ProductStepCrosstabContainer.tsx`, `ProductStepCrosstabFilter.tsx`).

## 4. Lỗi hiển thị trên UI

-   **Triệu chứng:** Giá trị `null` hoặc `undefined` từ API được hiển thị dưới dạng trống trong bảng crosstab, nhưng gây lỗi ở console hoặc logic hiển thị.
-   **Nguyên nhân:** Logic render trong cell của bảng không xử lý triệt để các giá trị `null` hoặc `undefined` trước khi hiển thị.
-   **Giải pháp:** (Do bạn fix) Cập nhật lại logic render cell, đảm bảo rằng mọi giá trị `null` hoặc `undefined` được chuyển đổi thành một chuỗi rỗng (`''`) trước khi render ra `div`.

```diff
- return <div className="text-right">{value ?? ''}</div>;
+ const displayValue = value === null || value === undefined ? '' : String(value);
+ return <div className="text-right">{displayValue}</div>;
``` 