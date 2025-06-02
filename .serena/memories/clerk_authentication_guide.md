# Hướng dẫn toàn diện: Triển khai xác thực người dùng với Clerk trong Next.js

## Mục lục
1. [Giới thiệu](#giới-thiệu)
2. [Thiết lập dự án](#thiết-lập-dự-án)
3. [Cấu hình Clerk](#cấu-hình-clerk)
4. [Thêm ClerkProvider](#thêm-clerkprovider)
5. [Bảo vệ routes với Middleware](#bảo-vệ-routes-với-middleware)
6. [Thêm các thành phần UI xác thực](#thêm-các-thành-phần-ui-xác-thực)
7. [Truy cập thông tin người dùng đã xác thực](#truy-cập-thông-tin-người-dùng-đã-xác-thực)
8. [Xác thực trong Route Handlers (API Routes)](#xác-thực-trong-route-handlers-api-routes)
9. [Tùy chỉnh giao diện đăng nhập/đăng ký](#tùy-chỉnh-giao-diện-đăng-nhậpđăng-ký)
10. [Xử lý đa ngôn ngữ với Clerk](#xử-lý-đa-ngôn-ngữ-với-clerk)
11. [Các tình huống nâng cao](#các-tình-huống-nâng-cao)
12. [Các vấn đề thường gặp và cách khắc phục](#các-vấn-đề-thường-gặp-và-cách-khắc-phục)

## Giới thiệu

Clerk là một giải pháp xác thực và quản lý người dùng toàn diện cho các ứng dụng web hiện đại. Nó cung cấp các thành phần React được xây dựng sẵn và các hooks để quản lý đăng nhập, đăng ký, hồ sơ người dùng và nhiều tính năng khác. Trong hướng dẫn này, chúng ta sẽ tìm hiểu cách tích hợp Clerk vào ứng dụng Next.js sử dụng App Router.

### Ưu điểm của Clerk

- **Đơn giản hóa xác thực**: Không cần phải tự xây dựng hệ thống xác thực từ đầu
- **Các thành phần UI có sẵn**: Các thành phần đăng nhập, đăng ký, quản lý hồ sơ người dùng
- **Hỗ trợ nhiều phương thức đăng nhập**: Email/mật khẩu, xã hội (Google, Facebook...), Magic links, Passkeys
- **Bảo mật cao**: Tuân thủ các tiêu chuẩn bảo mật hiện đại
- **Tích hợp tốt với Next.js**: Hỗ trợ cả App Router và Pages Router

## Thiết lập dự án

### Bước 1: Tạo dự án Next.js mới

```bash
npx create-next-app@latest my-auth-app
cd my-auth-app
```

Trong quá trình thiết lập, chọn các tùy chọn sau:
- Yes để TypeScript
- Yes để App Router
- Yes để các tùy chọn khác (Tailwind CSS, ESLint, v.v.)

### Bước 2: Cài đặt Clerk SDK

```bash
npm install @clerk/nextjs
```

## Cấu hình Clerk

### Bước 1: Đăng ký tài khoản Clerk

1. Truy cập [dashboard.clerk.com](https://dashboard.clerk.com)
2. Đăng ký tài khoản mới hoặc đăng nhập vào tài khoản hiện có
3. Tạo ứng dụng mới trong Clerk Dashboard

### Bước 2: Cấu hình phương thức xác thực

Trong Clerk Dashboard:
1. Chọn ứng dụng của bạn
2. Đi đến "Authentication" > "Email, Phone, Username"
3. Bật các phương thức xác thực mà bạn muốn hỗ trợ (Email, Google, Facebook, v.v.)

### Bước 3: Lấy API keys

1. Trong Clerk Dashboard, đi đến "API Keys"
2. Sao chép `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` và `CLERK_SECRET_KEY`

### Bước 4: Thêm biến môi trường

Tạo file `.env.local` trong thư mục gốc dự án và thêm các biến môi trường sau:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Thêm ClerkProvider

Để sử dụng Clerk trong ứng dụng, chúng ta cần bọc ứng dụng của mình trong `ClerkProvider`. Đây là thành phần cung cấp context xác thực cho toàn bộ ứng dụng.

### Thêm ClerkProvider vào layout.tsx

Mở file `src/app/layout.tsx` và cập nhật như sau:

```tsx
import './globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My Authenticated App',
  description: 'Next.js app with Clerk authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## Bảo vệ routes với Middleware

Clerk sử dụng middleware để bảo vệ các routes trong ứng dụng Next.js. Middleware sẽ chạy trước khi request đến server, cho phép bạn kiểm tra xác thực và phân quyền.

### Tạo middleware.ts

Tạo file `src/middleware.ts` ở thư mục gốc của thư mục `src` với nội dung sau:

```tsx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Định nghĩa các routes cần bảo vệ
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/api/protected(.*)',
]);

// Định nghĩa các routes công khai
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Nếu route là protected, yêu cầu xác thực
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Bỏ qua Next.js internals và tất cả các file tĩnh
    '/((?!_next|[^?]*\\.(html?|css|js|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)',
    // Luôn chạy cho API routes
    '/(api|trpc)(.*)',
  ],
};
```

## Thêm các thành phần UI xác thực

Clerk cung cấp các thành phần UI được xây dựng sẵn cho đăng nhập, đăng ký và quản lý hồ sơ người dùng.

### Tạo trang Sign In

Tạo file `src/app/sign-in/page.tsx`:

```tsx
'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded bg-white p-4 shadow-md">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
```

### Tạo trang Sign Up

Tạo file `src/app/sign-up/page.tsx`:

```tsx
'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded bg-white p-4 shadow-md">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
```

### Thêm UserButton vào Navigation Bar

Tạo file `src/components/Navbar.tsx`:

```tsx
'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Navbar() {
  const { isLoaded, userId } = useAuth();

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow">
      <div>
        <Link href="/" className="text-xl font-bold">
          My App
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>

        {isLoaded && userId
          ? (
              <>
                <Link href="/dashboard" className="hover:text-blue-600">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            )
          : (
              <>
                <Link href="/sign-in" className="hover:text-blue-600">
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
      </div>
    </nav>
  );
}
```

Bây giờ, thêm Navbar vào layout:

```tsx
// src/app/layout.tsx
import './globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My Authenticated App',
  description: 'Next.js app with Clerk authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Navbar />
          <main className="container mx-auto px-4 py-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

## Truy cập thông tin người dùng đã xác thực

Clerk cung cấp các hooks và helpers để truy cập thông tin người dùng đã xác thực từ cả client và server.

### Truy cập thông tin người dùng từ Client Component

```tsx
'use client';

import { useUser } from '@clerk/nextjs';

export default function ProfileClient() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded || !isSignedIn) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Hồ sơ người dùng</h1>
      <p>
        Xin chào,
        {user.firstName}
        !
      </p>
      <p>
        Email:
        {user.primaryEmailAddress?.emailAddress}
      </p>
      <img
        src={user.imageUrl}
        alt={`${user.firstName}'s avatar`}
        className="size-20 rounded-full"
      />
    </div>
  );
}
```

### Truy cập thông tin người dùng từ Server Component

```tsx
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function ProfileServer() {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    return <div>Bạn cần đăng nhập để xem trang này</div>;
  }

  return (
    <div>
      <h1>Hồ sơ người dùng (Server Component)</h1>
      <p>
        ID:
        {userId}
      </p>
      <p>
        Tên:
        {user.firstName}
        {' '}
        {user.lastName}
      </p>
      <p>
        Email:
        {user.emailAddresses[0]?.emailAddress}
      </p>
    </div>
  );
}
```

### Tạo trang Dashboard được bảo vệ

Tạo file `src/app/dashboard/page.tsx`:

```tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <div className="rounded bg-white p-6 shadow">
        <p className="mb-2">
          <span className="font-semibold">
            Xin chào,
            {user?.firstName}
            !
          </span>
        </p>
        <p>
          Bạn đã đăng nhập thành công vào ứng dụng.
        </p>
      </div>
    </div>
  );
}
```

## Xác thực trong Route Handlers (API Routes)

Bảo vệ API routes là rất quan trọng để đảm bảo rằng chỉ người dùng đã xác thực mới có thể truy cập dữ liệu nhạy cảm.

### Tạo API Route được bảo vệ

Tạo file `src/app/api/protected/user/route.ts`:

```tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await currentUser();

  return NextResponse.json({
    id: user?.id,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.emailAddresses[0]?.emailAddress,
    imageUrl: user?.imageUrl,
  });
}
```

### Truy cập API Route từ Client Component

```tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function UserProfile() {
  const { isLoaded, isSignedIn } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/protected/user');

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const data = await response.json();
          setUserData(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) {
    return <div>Vui lòng đăng nhập để xem thông tin</div>;
  }

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (error) {
    return (
      <div>
        Lỗi:
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2>Thông tin người dùng</h2>
      {userData && (
        <div>
          <p>
            ID:
            {userData.id}
          </p>
          <p>
            Tên:
            {userData.firstName}
            {' '}
            {userData.lastName}
          </p>
          <p>
            Email:
            {userData.email}
          </p>
          <img
            src={userData.imageUrl}
            alt="Avatar"
            className="size-20 rounded-full"
          />
        </div>
      )}
    </div>
  );
}
```

## Tùy chỉnh giao diện đăng nhập/đăng ký

Clerk cho phép bạn tùy chỉnh giao diện của các thành phần xác thực.

### Tùy chỉnh SignIn component

```tsx
'use client';

import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function CustomSignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded bg-white p-4 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold">Đăng nhập</h1>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
          appearance={{
            baseTheme: dark,
            elements: {
              formButtonPrimary:
                'bg-indigo-600 hover:bg-indigo-700 text-sm normal-case',
              card: 'bg-white',
              headerTitle: 'text-gray-900',
              headerSubtitle: 'text-gray-600',
              formFieldLabel: 'text-gray-700',
              formFieldInput: 'border-gray-300 focus:border-indigo-500',
              footerActionLink: 'text-indigo-600 hover:text-indigo-700',
            },
          }}
          localization={{
            signIn: {
              start: {
                title: 'Đăng nhập vào tài khoản của bạn',
                subtitle: 'để tiếp tục sử dụng ứng dụng',
              },
            },
          }}
        />
      </div>
    </div>
  );
}
```

## Xử lý đa ngôn ngữ với Clerk

Clerk hỗ trợ đa ngôn ngữ, cho phép bạn cung cấp trải nghiệm người dùng được địa phương hóa.

### Thiết lập đa ngôn ngữ với ClerkProvider

```tsx
// src/app/layout.tsx
import './globals.css';

import { enUS, viVN } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My Authenticated App',
  description: 'Next.js app with Clerk authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Xác định ngôn ngữ dựa trên các tham số
  // Ví dụ: có thể lấy từ cookie, local storage, hoặc tham số URL
  const locale = 'vi'; // Hoặc 'en' cho tiếng Anh

  // Chọn gói bản địa hóa tương ứng
  const localization = locale === 'vi' ? viVN : enUS;

  return (
    <ClerkProvider localization={localization}>
      <html lang={locale}>
        <body className={inter.className}>
          <Navbar />
          <main className="container mx-auto px-4 py-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

## Các tình huống nâng cao

### Xác thực với nhiều tổ chức (Organizations)

Clerk hỗ trợ quản lý tổ chức, cho phép người dùng tham gia nhiều tổ chức khác nhau.

#### Bật tính năng tổ chức trong Clerk Dashboard

1. Đi đến "Organizations" > "Settings"
2. Bật "Enable organizations"

#### Tạo trang Organization Profile

```tsx
'use client';

import { OrganizationProfile } from '@clerk/nextjs';

export default function OrganizationProfilePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-3xl rounded bg-white p-4 shadow-md">
        <OrganizationProfile
          path="/organization-profile"
          routing="path"
          appearance={{
            elements: {
              card: 'w-full',
              navbar: 'hidden',
            },
          }}
        />
      </div>
    </div>
  );
}
```

#### Tạo trang Organization Switcher

```tsx
'use client';

import { OrganizationSwitcher } from '@clerk/nextjs';

export default function OrganizationSwitcherComponent() {
  return (
    <OrganizationSwitcher
      appearance={{
        elements: {
          organizationSwitcherTrigger: 'py-2 px-4',
        },
      }}
    />
  );
}
```

### Tích hợp với Server Actions

Clerk có thể được sử dụng với Server Actions của Next.js để bảo vệ các thao tác.

```tsx
'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // Thực hiện lưu dữ liệu vào cơ sở dữ liệu
  // ...

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
```

### Xác thực với JWT tokens trong API

```tsx
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { userId, sessionClaims } = getAuth(request);

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // sessionClaims chứa thông tin từ JWT token
  // Có thể được sử dụng để xác thực với dịch vụ bên thứ ba

  return NextResponse.json({
    userId,
    sessionClaims,
  });
}
```

## Các vấn đề thường gặp và cách khắc phục

### 1. Lỗi "No such host is known"

**Vấn đề**: Khi chạy ứng dụng, bạn gặp lỗi "No such host is known" liên quan đến Clerk.

**Giải pháp**: Kiểm tra kết nối internet và đảm bảo rằng biến môi trường `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` và `CLERK_SECRET_KEY` đã được cấu hình đúng.

### 2. Lỗi "Clerk: Failed to resolve environment"

**Vấn đề**: Bạn gặp lỗi "Clerk: Failed to resolve environment" khi chạy ứng dụng.

**Giải pháp**: Đảm bảo rằng bạn đã khởi động lại server sau khi thêm biến môi trường.

### 3. Các thành phần của Clerk không hiển thị đúng

**Vấn đề**: Các thành phần như SignIn, SignUp không hiển thị đúng.

**Giải pháp**: Đảm bảo rằng bạn đã thêm 'use client' directive ở đầu file khi sử dụng các thành phần UI của Clerk.

### 4. Middleware không bảo vệ routes

**Vấn đề**: Middleware không hoạt động đúng, routes không được bảo vệ.

**Giải pháp**:
- Đảm bảo file `middleware.ts` được đặt đúng vị trí (thư mục gốc của `src` hoặc thư mục gốc dự án)
- Kiểm tra cấu hình `matcher` trong `middleware.ts`
- Đảm bảo rằng bạn đang sử dụng `auth().protect()` cho routes cần bảo vệ

### 5. Lỗi "Invalid token"

**Vấn đề**: Bạn gặp lỗi "Invalid token" khi truy cập API routes.

**Giải pháp**: Đảm bảo rằng token được tạo và truyền đúng, và kiểm tra cài đặt secret keys trong Clerk Dashboard.
