# 🎨 Modern UI Design System - Yamato SaaS

> **Reference Implementation**: User Syncs Feature  
> **Created**: 2025-01-26  
> **Author**: Claude AI Assistant  

Hệ thống thiết kế UI hiện đại được áp dụng thành công cho tính năng User Syncs, có thể tái sử dụng cho các feature khác trong Yamato SaaS.

## 📋 Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Layout Patterns](#layout-patterns)
4. [Component Patterns](#component-patterns)
5. [View Toggle Patterns](#view-toggle-patterns)
6. [Animation System](#animation-system)
7. [Responsive Design](#responsive-design)
8. [Implementation Guide](#implementation-guide)

---

## 🎯 Design Philosophy

### Core Principles
- **Card-Based Layout**: Thay thế tables truyền thống bằng card system
- **Gradient Backgrounds**: Subtle gradients để tạo depth và visual interest
- **Interactive Elements**: Hover effects, transitions, và micro-animations
- **Color-Coded Information**: Sử dụng màu sắc để phân loại thông tin
- **Responsive-First**: Mobile-friendly từ đầu
- **Accessibility**: WCAG compliant với ARIA labels

### Visual Hierarchy
```
1. Page Header (Gradient Hero)
2. Control Panel (Search, Filters, Actions)
3. Content Area (Cards/Forms)
4. Pagination/Footer
5. Modals/Overlays
```

---

## 🎨 Color System

### Primary Gradients
```css
/* Background Gradients */
.bg-primary-gradient {
  background: linear-gradient(to bottom right, #f8fafc, #eff6ff);
}

.bg-hero-gradient {
  background: linear-gradient(to right, #2563eb, #7c3aed);
}

.bg-card-gradient {
  background: linear-gradient(to bottom right, #3b82f6, #8b5cf6);
}
```

### Status Colors
```css
/* Success States */
.success-bg { background: #dcfce7; }
.success-text { color: #166534; }
.success-border { border-color: #bbf7d0; }

/* Warning States */
.warning-bg { background: #fef3c7; }
.warning-text { color: #92400e; }
.warning-border { border-color: #fde68a; }

/* Error States */
.error-bg { background: #fecaca; }
.error-text { color: #991b1b; }
.error-border { border-color: #fca5a5; }

/* Info States */
.info-bg { background: #dbeafe; }
.info-text { color: #1e40af; }
.info-border { border-color: #93c5fd; }
```

### Icon Colors
```css
.icon-blue { color: #3b82f6; }      /* Primary actions */
.icon-green { color: #10b981; }     /* Success/Active */
.icon-purple { color: #8b5cf6; }    /* Secondary */
.icon-orange { color: #f59e0b; }    /* Warning/Important */
.icon-pink { color: #ec4899; }      /* Special/Tags */
.icon-red { color: #ef4444; }       /* Danger/Delete */
```

---

## 📐 Layout Patterns

### 1. Page Structure
```tsx
<main className="container mx-auto max-w-7xl space-y-8 p-6">
  {/* Hero Header */}
  <header className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 text-white shadow-lg">
    {/* Header content */}
  </header>

  {/* Control Panel */}
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    {/* Search, filters, actions */}
  </div>

  {/* Main Content */}
  <div className="space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl">
    {/* Cards or forms */}
  </div>
</main>
```

### 2. Hero Header Pattern
```tsx
<header className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 text-white shadow-lg">
  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
    <div className="flex-1">
      <h1 className="text-4xl font-bold tracking-tight mb-2">
        {pageTitle}
      </h1>
      <p className="text-blue-100 text-lg">
        {pageDescription}
      </p>
      {/* Feature indicators */}
      <div className="flex items-center space-x-6 mt-4 text-sm text-blue-100">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          Feature 1
        </div>
        {/* More features */}
      </div>
    </div>

    {/* Primary CTA */}
    <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105">
      <span className="text-lg mr-2">+</span>
      Primary Action
    </Button>
  </div>
</header>
```

### 3. Control Panel Pattern
```tsx
<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
  <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
    {/* Search Section */}
    <div className="flex flex-1 items-center space-x-4">
      <div className="relative max-w-lg flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-500 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        />
      </div>
      
      {/* Toggle controls */}
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        <span className="ml-3 text-sm font-medium text-gray-700">
          Toggle Option
        </span>
      </label>
    </div>

    {/* Action Buttons */}
    <div className="flex flex-wrap items-center gap-3">
      {/* Filter dropdown */}
      <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <select className="bg-transparent border-0 text-sm font-medium text-gray-700 focus:outline-none focus:ring-0">
          <option>Sort by</option>
        </select>
      </div>

      {/* Action buttons */}
      <button className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-200 transform hover:scale-105">
        <Download className="mr-2 h-4 w-4" />
        Export
      </button>
    </div>
  </div>
</div>
```

---

## 🧩 Component Patterns

### 1. Modern Form Pattern
```tsx
<div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl">
  <form className="space-y-8">
    {/* Form Header */}
    <div className="text-center pb-6 border-b border-gray-200">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Title</h2>
      <p className="text-gray-600">Form description</p>
    </div>

    {/* Form Fields */}
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
        <IconComponent className="w-4 h-4 mr-2 text-blue-500" />
        Field Label
        <span className="text-red-500 ml-1">*</span>
      </label>
      <input
        className="block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300"
        placeholder="Placeholder text"
      />
    </div>

    {/* Grid Layout for Multiple Fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Field components */}
    </div>
  </form>
</div>
```

### 2. Card Component Pattern
```tsx
<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
  {/* Card Header */}
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center space-x-3">
      {/* Avatar */}
      <div className="relative">
        {imageUrl ? (
          <img src={imageUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {name?.charAt(0) || email.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Status indicator */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
        <p className="text-sm text-gray-500 truncate flex items-center">
          <Mail className="w-3 h-3 mr-1" />
          {subtitle}
        </p>
      </div>
    </div>
    
    {/* Status Badge */}
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isActive ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
      {isActive ? 'Active' : 'Inactive'}
    </div>
  </div>

  {/* Card Content */}
  <div className="space-y-3 mb-4">
    {/* Info sections */}
  </div>

  {/* Card Actions */}
  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
    <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200">
      <Edit className="w-4 h-4 mr-1" />
      Edit
    </button>
  </div>
</div>
```

### 3. Modal Pattern
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
  <div className="relative mx-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
    {/* Modal content */}
  </div>
</div>
```

### 4. Delete Confirmation Pattern
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
  <div className="relative mx-4 w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300">
    <div className="text-center">
      {/* Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
        <Trash2 className="h-8 w-8 text-red-600" />
      </div>
      
      {/* Title & Content */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
      
      {/* User preview */}
      <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
        {/* User info display */}
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200">
          Cancel
        </button>
        <button className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200">
          <Trash2 className="w-4 h-4 mr-2" />
          Confirm Delete
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 🔄 View Toggle Patterns

### Purpose
Provide users with flexibility to view data in different formats (card view for visual scanning, list view for detailed information) while maintaining consistent design patterns and smooth transitions.

### Implementation Components

#### 1. View Mode State Management
```tsx
// React state for view mode
const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

// Toggle between views
const toggleView = (mode: 'card' | 'list') => {
  setViewMode(mode);
};
```

#### 2. Toggle Control Component
```tsx
{/* View Mode Toggle */}
<div className="flex items-center bg-gray-100 rounded-lg p-1">
  <button
    type="button"
    onClick={() => setViewMode('card')}
    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      viewMode === 'card'
        ? 'bg-white text-indigo-600 shadow-sm'
        : 'text-gray-600 hover:text-gray-800'
    }`}
    title="Card View"
  >
    <Grid3X3 className="h-4 w-4 mr-1" />
    Cards
  </button>
  <button
    type="button"
    onClick={() => setViewMode('list')}
    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      viewMode === 'list'
        ? 'bg-white text-indigo-600 shadow-sm'
        : 'text-gray-600 hover:text-gray-800'
    }`}
    title="List View"
  >
    <List className="h-4 w-4 mr-1" />
    List
  </button>
</div>
```

#### 3. Card View Pattern
```tsx
{/* Card View - Grid Layout */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Icon/Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{item.title}</h3>
            <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
          <TagIcon className="w-3 h-3 mr-1" />
          {item.status}
        </div>
      </div>

      {/* Card Content */}
      <div className="space-y-3 mb-4">
        {/* Item details */}
      </div>

      {/* Card Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
        <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200">
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>
    </div>
  ))}
</div>
```

#### 4. List View Pattern
```tsx
{/* List View - Table-like Structure */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
  {/* List Header */}
  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
      <div className="col-span-3">Title</div>
      <div className="col-span-2">Category</div>
      <div className="col-span-2">Status</div>
      <div className="col-span-3">Details</div>
      <div className="col-span-1">Date</div>
      <div className="col-span-1">Actions</div>
    </div>
  </div>

  {/* List Items */}
  <div className="divide-y divide-gray-100">
    {items.map(item => (
      <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Title */}
          <div className="col-span-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Other columns */}
          <div className="col-span-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {item.category}
            </span>
          </div>

          {/* Actions */}
          <div className="col-span-1">
            <div className="flex items-center space-x-1">
              <button className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-all duration-200">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

#### 5. Conditional Rendering Logic
```tsx
{/* Main Content with View Toggle */}
{viewMode === 'card' ? (
  /* Card View */
  <CardViewComponent />
) : (
  /* List View */
  <ListViewComponent />
)}
```

### Design Guidelines

#### Visual Hierarchy
- **Toggle Control**: Positioned in Control Panel, right section
- **Active State**: White background with colored text and shadow
- **Inactive State**: Transparent background with gray text
- **Icons**: Use Grid3X3 for card view, List for list view

#### Color Coding
```css
/* Active toggle button */
.toggle-active {
  background: white;
  color: theme-color; /* indigo-600, blue-600, etc. */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Inactive toggle button */
.toggle-inactive {
  background: transparent;
  color: #6b7280; /* gray-600 */
}

/* Hover states */
.toggle-inactive:hover {
  color: #374151; /* gray-800 */
}
```

#### Responsive Considerations
- **Mobile**: Toggle remains accessible, buttons stack appropriately
- **Tablet**: Grid adjusts to 2 columns for card view
- **Desktop**: Full 3-column grid for optimal space usage

#### Accessibility Features
- **ARIA Labels**: Clear button titles and roles
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper state announcements
- **Color Contrast**: WCAG compliant color combinations

### Usage Examples

#### Production Steps Implementation
```tsx
// State management
const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

// In Control Panel
<div className="flex items-center bg-gray-100 rounded-lg p-1">
  <button
    onClick={() => setViewMode('card')}
    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
    }`}
  >
    <Grid3X3 className="h-4 w-4 mr-1" />
    Cards
  </button>
  <button
    onClick={() => setViewMode('list')}
    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
    }`}
  >
    <List className="h-4 w-4 mr-1" />
    List
  </button>
</div>

// Conditional rendering
{viewMode === 'card' ? (
  <CardGridComponent />
) : (
  <ListTableComponent />
)}
```

### Best Practices

1. **Default View**: Start with card view for better visual appeal
2. **State Persistence**: Consider persisting user preference in localStorage
3. **Consistent Icons**: Use Grid3X3 and List icons across all implementations
4. **Smooth Transitions**: Apply 200ms transitions for state changes
5. **Feature Parity**: Ensure both views support all actions (edit, delete, etc.)
6. **Performance**: Use React.memo for view components to prevent unnecessary re-renders

### Feature-Specific Theming

Adapt colors based on feature domain:
- **Products**: Blue theme (`text-blue-600`, `bg-blue-100`)
- **Production Steps**: Indigo theme (`text-indigo-600`, `bg-indigo-100`)
- **Users**: Purple theme (`text-purple-600`, `bg-purple-100`)
- **Orders**: Green theme (`text-green-600`, `bg-green-100`)

---

## 🎬 Animation System

### Hover Effects
```css
/* Standard hover transform */
.hover-lift {
  transition: all 0.2s ease;
  transform: translateY(0);
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Button hover scale */
.hover-scale {
  transition: transform 0.2s ease;
}
.hover-scale:hover {
  transform: scale(1.05);
}

/* Card hover effect */
.card-hover {
  transition: all 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}
```

### Loading States
```tsx
{/* Spinner */}
<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

{/* Button loading state */}
{isLoading ? (
  <>
    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
    Loading...
  </>
) : (
  <>
    <Icon className="w-4 h-4 mr-2" />
    Action
  </>
)}
```

### Modal Animations
```css
/* Tailwind CSS classes */
.modal-enter {
  @apply animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300;
}

.modal-backdrop {
  @apply animate-in fade-in duration-300;
}
```

---

## 📱 Responsive Design

### Breakpoint Strategy
```css
/* Mobile First Approach */
.container {
  @apply mx-auto max-w-7xl px-4 sm:px-6 lg:px-8;
}

/* Grid Responsive */
.card-grid {
  @apply grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6;
}

/* Form Grid */
.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

/* Header Responsive */
.header-content {
  @apply flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0;
}
```

### Mobile Optimizations
```tsx
{/* Stack buttons on mobile */}
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <button>Cancel</button>
  <button>Confirm</button>
</div>

{/* Hide/show elements based on screen size */}
<div className="hidden md:block">Desktop only content</div>
<div className="md:hidden">Mobile only content</div>

{/* Responsive text sizes */}
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Title</h1>
```

---

## 🛠️ Implementation Guide

### Step 1: Setup Dependencies
```bash
npm install lucide-react
# Ensure Tailwind CSS is configured with animations
```

### Step 2: Create Base Components
```tsx
// components/ui/Card.tsx
export function Card({ children, className = "", hover = true }) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${hover ? 'hover:shadow-md transition-all duration-200 transform hover:-translate-y-1' : ''} ${className}`}>
      {children}
    </div>
  );
}

// components/ui/FormField.tsx
export function FormField({ label, icon: Icon, required = false, children, error }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
        {Icon && <Icon className="w-4 h-4 mr-2 text-blue-500" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">
            <span className="text-red-600 text-xs">!</span>
          </span>
          {error}
        </p>
      )}
    </div>
  );
}
```

### Step 3: Apply to New Features
```tsx
// Khi tạo feature mới, sử dụng pattern:

// 1. Page Structure
<main className="container mx-auto max-w-7xl space-y-8 p-6">
  {/* Hero header with gradient */}
  {/* Control panel with search */}
  {/* Card-based content */}
</main>

// 2. Form Implementation
<div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl">
  {/* Form with FormField components */}
</div>

// 3. List Implementation
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {/* Card components */}
</div>
```

### Step 4: Customization Guidelines
1. **Colors**: Thay đổi gradient colors trong hero header
2. **Icons**: Chọn icons phù hợp từ Lucide React
3. **Spacing**: Giữ nguyên spacing patterns (space-y-8, p-6, gap-6)
4. **Animations**: Sử dụng duration-200 cho consistency

---

## ✅ Checklist cho Feature Mới

### Planning Phase
- [ ] Xác định primary action và secondary actions
- [ ] Chọn color scheme phù hợp với domain
- [ ] Xác định các status states cần thiết
- [ ] Planning responsive behavior

### Implementation Phase
- [ ] Implement hero header với gradient
- [ ] Create control panel với search và filters
- [ ] Implement card-based layout (thay vì table)
- [ ] Add hover animations và transitions
- [ ] Implement modal với animations
- [ ] Add loading states và error handling

### Quality Assurance
- [ ] Test responsive design trên các screen sizes
- [ ] Verify animations smooth trên các browsers
- [ ] Check accessibility với screen readers
- [ ] Validate color contrast ratios
- [ ] Test keyboard navigation

---

## 🎨 Quick Reference

### Common Class Combinations
```css
/* Card */
.card = "bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"

/* Button Primary */
.btn-primary = "inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 transform hover:scale-105"

/* Input */
.input = "block w-full rounded-lg border py-3 px-4 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300"

/* Modal */
.modal = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
```

---

## 📞 Usage Instructions

Để áp dụng design system này cho feature mới:

```
"Hãy áp dụng Modern UI Design System (tham khảo MODERN_UI_DESIGN_SYSTEM.md) để tạo UI cho feature [tên feature]. 

Yêu cầu:
- Sử dụng card-based layout thay vì table
- Gradient hero header 
- Modern form với FormField pattern
- Hover animations và micro-interactions
- Responsive design
- Modal với animations
- Color-coded status indicators

Tham khảo implementation từ User Syncs feature."
```

---

**Happy Coding! 🚀**