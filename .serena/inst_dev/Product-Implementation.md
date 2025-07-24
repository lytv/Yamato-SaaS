# Product Feature Implementation Plan

## 🎯 **OVERVIEW & CONTEXT**

Product represents the foundation product catalog that manages base products (NHA01, NHA02A) before they are extended into variants through ProductSub. It's the simplest table in our production planning system, focusing on basic product information, family grouping, and lifecycle management.

**Key Characteristics:**
- Foundation product management (NHA01, NHA02A style codes)
- Product family organization system
- Basic lifecycle management (draft, active, discontinued)
- Foundation pricing structure
- Variant count integration (calculated from ProductSub)

**Based on Todos Pattern:** Direct application but even simpler than todos

**Simplest Implementation:** No foreign keys, minimal business logic, straightforward UI

---

## 🔧 **PREREQUISITES & DEPENDENCIES**

**Required Dependencies:**
- Existing todos feature (as reference pattern)
- Drizzle ORM setup
- Clerk authentication
- Shadcn UI components
- Next.js App Router

**No Hard Dependencies:** Product is a foundation table that will be referenced by ProductSub

**Optional Future Integration:**
- ProductSub table (will reference Product)
- Variant counting (calculated field)

**Mock Data Strategy:**
Basic products for development:
```typescript
const mockProducts = [
  { productCode: 'NHA01', productName: 'Áo Dài Truyền Thống', productFamily: 'Traditional', category: 'Formal' },
  { productCode: 'NHA02A', productName: 'Áo Dài Cách Tân', productFamily: 'Modern', category: 'Casual' },
  { productCode: 'NHA03', productName: 'Áo Dài Cưới', productFamily: 'Wedding', category: 'Special' },
];
```

---

## 📁 **FILE STRUCTURE TO CREATE**

```
src/
├── types/
│   └── product.ts                            # TypeScript types
├── libs/
│   ├── validations/
│   │   └── product.ts                       # Zod validation schemas
│   ├── queries/
│   │   └── product.ts                       # Database queries
│   └── api/
│       └── product.ts                       # Client API functions
├── hooks/
│   ├── useProducts.ts                       # Data fetching hook
│   ├── useProductMutations.ts               # CRUD mutations hook
│   └── useProductFilters.ts                 # Filter state management
├── features/
│   └── product/
│       ├── ProductList.tsx                  # List component
│       ├── ProductForm.tsx                  # Create/Edit form
│       ├── ProductSkeleton.tsx              # Loading skeleton
│       ├── ProductCard.tsx                  # Individual product display
│       ├── ProductFamilyGroup.tsx           # Family grouping component
│       └── __tests__/                       # Component tests
├── app/
│   ├── api/
│   │   └── products/
│   │       ├── route.ts                     # GET /api/products, POST
│   │       ├── families/
│   │       │   └── route.ts                 # GET /api/products/families
│   │       ├── stats/
│   │       │   └── route.ts                 # GET /api/products/stats
│   │       └── [id]/
│   │           └── route.ts                 # GET, PUT, DELETE /api/products/[id]
│   └── [locale]/
│       └── (auth)/
│           └── dashboard/
│               └── products/
│                   └── page.tsx             # Main dashboard page
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **PHASE 1: Foundation Layer (Types, Validation, Database)**

#### Step 1.1: Create TypeScript Types
**File:** `src/types/product.ts`

```typescript
import type { productSchema } from '@/models/schema_new';

// Base types from schema
export type ProductDb = typeof productSchema.$inferSelect;

export type Product = Omit<ProductDb, 'createdAt' | 'updatedAt' | 'launchDate' | 'discontinueDate'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  launchDate: string | Date | null;
  discontinueDate: string | Date | null;
};

export type CreateProductInput = typeof productSchema.$inferInsert;

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Product status enum
export type ProductStatus = 'draft' | 'active' | 'discontinued' | 'archived';

// Product categories
export type ProductCategory = 'Traditional' | 'Modern' | 'Formal' | 'Casual' | 'Wedding' | 'Special' | 'Premium' | 'Standard';

// Product families
export type ProductFamily = 'Traditional' | 'Modern' | 'Wedding' | 'Evening' | 'Casual' | 'Business' | 'Special';

// Filter types
export type ProductFilters = {
  search: string;
  category?: ProductCategory;
  productFamily?: ProductFamily;
  status?: ProductStatus;
  priceRange?: {
    min: number;
    max: number;
  };
  hasVariants?: boolean;
  sortBy: 'createdAt' | 'productCode' | 'productName' | 'basePrice' | 'variantCount' | 'status';
  sortOrder: 'asc' | 'desc';
};

// List parameters
export type ProductListParams = {
  ownerId: string;
  page: number;
  limit: number;
} & Omit<ProductFilters, 'search'> & {
  search?: string;
};

// Product with calculated fields
export type ProductWithVariants = Product & {
  calculatedVariantCount: number;
  averageVariantPrice: number;
  variantPriceRange: {
    min: number;
    max: number;
  };
  hasActiveVariants: boolean;
};

// Product family grouping
export type ProductFamilyGroup = {
  family: ProductFamily;
  products: Product[];
  totalProducts: number;
  totalVariants: number;
  averagePrice: number;
  statusBreakdown: Record<ProductStatus, number>;
};

// Statistics
export type ProductStats = {
  total: number;
  byStatus: Record<ProductStatus, number>;
  byCategory: Record<ProductCategory, number>;
  byFamily: Record<ProductFamily, number>;
  totalVariants: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  topFamilies: Array<{
    family: ProductFamily;
    count: number;
    percentage: number;
  }>;
};

// API Response types
export type ProductsResponse = {
  success: true;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type ProductResponse = {
  success: true;
  data: Product;
  message?: string;
};

export type ProductStatsResponse = {
  success: true;
  data: ProductStats;
};

export type ProductFamiliesResponse = {
  success: true;
  data: ProductFamilyGroup[];
};

export type ProductErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data
export type ProductFormData = {
  productCode: string;
  productName: string;
  notes?: string;
  category: ProductCategory;
  productFamily: ProductFamily;
  variantCount?: number;
  status: ProductStatus;
  launchDate?: string | Date;
  discontinueDate?: string | Date;
  basePrice?: number;
};

// Product code patterns
export type ProductCodePattern = {
  pattern: RegExp;
  example: string;
  description: string;
};

// Quick product creation
export type QuickProductInput = {
  productFamily: ProductFamily;
  count: number;
  templateData: {
    category: ProductCategory;
    basePrice?: number;
    status?: ProductStatus;
  };
};
```

#### Step 1.2: Create Validation Schemas
**File:** `src/libs/validations/product.ts`

```typescript
import { z } from 'zod';

// Enum definitions
const ProductStatus = z.enum(['draft', 'active', 'discontinued', 'archived']);
const ProductCategory = z.enum(['Traditional', 'Modern', 'Formal', 'Casual', 'Wedding', 'Special', 'Premium', 'Standard']);
const ProductFamily = z.enum(['Traditional', 'Modern', 'Wedding', 'Evening', 'Casual', 'Business', 'Special']);

// Product code validation (NHA01, NHA02A format)
const productCodeSchema = z.string().regex(
  /^[A-Z]{3}\d{2}[A-Z]?$/,
  'Product code must follow format like NHA01, NHA02A (3 letters + 2 numbers + optional letter)'
);

// Product name validation
const productNameSchema = z.string()
  .min(3, 'Product name must be at least 3 characters')
  .max(100, 'Product name must not exceed 100 characters');

// Price validation
const basePriceSchema = z.number().min(0, 'Base price must be non-negative').optional();

// Main form schema
export const productFormSchema = z.object({
  productCode: productCodeSchema,
  productName: productNameSchema,
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  category: ProductCategory,
  
  // Enhanced fields
  productFamily: ProductFamily,
  variantCount: z.number().int().min(0, 'Variant count must be non-negative').default(0),
  status: ProductStatus.default('draft'),
  launchDate: z.string().optional().or(z.date().optional()),
  discontinueDate: z.string().optional().or(z.date().optional()),
  basePrice: basePriceSchema,
}).refine((data) => {
  // Validate launch date before discontinue date
  if (data.launchDate && data.discontinueDate) {
    return new Date(data.launchDate) <= new Date(data.discontinueDate);
  }
  return true;
}, {
  message: "Discontinue date must be after launch date",
  path: ["discontinueDate"]
}).refine((data) => {
  // Validate discontinued products have discontinue date
  if (data.status === 'discontinued' && !data.discontinueDate) {
    return false;
  }
  return true;
}, {
  message: "Discontinued products must have a discontinue date",
  path: ["discontinueDate"]
}).refine((data) => {
  // Validate active products don't have discontinue date in the past
  if (data.status === 'active' && data.discontinueDate) {
    return new Date(data.discontinueDate) > new Date();
  }
  return true;
}, {
  message: "Active products cannot have a discontinue date in the past",
  path: ["discontinueDate"]
});

// CRUD schemas
export const createProductSchema = productFormSchema;
export const updateProductSchema = productFormSchema.partial();

// List parameters schema
export const productListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category: ProductCategory.optional(),
  productFamily: ProductFamily.optional(),
  status: ProductStatus.optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  hasVariants: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'productCode', 'productName', 'basePrice', 'variantCount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Quick product creation schema
export const quickProductSchema = z.object({
  productFamily: ProductFamily,
  count: z.number().int().min(1).max(10, 'Cannot create more than 10 products at once'),
  templateData: z.object({
    category: ProductCategory,
    basePrice: basePriceSchema,
    status: ProductStatus.optional().default('draft'),
  }),
});

// Validation functions
export function validateCreateProduct(data: unknown) {
  return createProductSchema.parse(data);
}

export function validateUpdateProduct(data: unknown) {
  return updateProductSchema.parse(data);
}

export function validateProductListParams(data: unknown) {
  return productListParamsSchema.parse(data);
}

export function validateQuickProduct(data: unknown) {
  return quickProductSchema.parse(data);
}

// Helper validation functions
export function validateProductCode(code: string): {
  isValid: boolean;
  format: string;
  example: string;
  error?: string;
} {
  const pattern = /^[A-Z]{3}\d{2}[A-Z]?$/;
  
  if (pattern.test(code)) {
    return {
      isValid: true,
      format: '3 letters + 2 numbers + optional letter',
      example: 'NHA01, NHA02A',
    };
  }
  
  return {
    isValid: false,
    format: '3 letters + 2 numbers + optional letter',
    example: 'NHA01, NHA02A',
    error: 'Product code must follow format like NHA01, NHA02A',
  };
}

export function generateProductCode(
  family: ProductFamily,
  sequence: number
): string {
  // Generate product code based on family
  const familyPrefixes = {
    'Traditional': 'NHA',
    'Modern': 'NHB',
    'Wedding': 'NHC',
    'Evening': 'NHD',
    'Casual': 'NHE',
    'Business': 'NHF',
    'Special': 'NHS',
  };
  
  const prefix = familyPrefixes[family] || 'NHA';
  const seqStr = sequence.toString().padStart(2, '0');
  
  return `${prefix}${seqStr}`;
}

export function generateProductName(
  family: ProductFamily,
  category: ProductCategory,
  sequence: number
): string {
  const familyNames = {
    'Traditional': 'Áo Dài Truyền Thống',
    'Modern': 'Áo Dài Cách Tân',
    'Wedding': 'Áo Dài Cưới',
    'Evening': 'Áo Dài Dạ Tiệc',
    'Casual': 'Áo Dài Thường Ngày',
    'Business': 'Áo Dài Công Sở',
    'Special': 'Áo Dài Đặc Biệt',
  };
  
  const baseName = familyNames[family] || 'Áo Dài';
  
  if (sequence > 1) {
    return `${baseName} ${sequence}`;
  }
  
  return baseName;
}

export function canEditProduct(product: Product, currentUserId: string): boolean {
  return product.ownerId === currentUserId && product.status !== 'archived';
}

export function canDeleteProduct(product: Product, currentUserId: string): boolean {
  return product.ownerId === currentUserId && 
         product.status === 'draft' && 
         product.variantCount === 0;
}

export function canDiscontinueProduct(product: Product, currentUserId: string): boolean {
  return product.ownerId === currentUserId && 
         product.status === 'active';
}

export function getNextStatus(currentStatus: ProductStatus): ProductStatus[] {
  const statusTransitions: Record<ProductStatus, ProductStatus[]> = {
    'draft': ['active', 'archived'],
    'active': ['discontinued', 'archived'],
    'discontinued': ['archived'],
    'archived': [], // Terminal state
  };
  
  return statusTransitions[currentStatus] || [];
}

export function calculateProductHealth(product: Product): {
  score: number;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }>;
  recommendation: string;
} {
  const factors = [
    {
      name: 'Status',
      score: product.status === 'active' ? 100 : product.status === 'draft' ? 50 : 0,
      weight: 0.3,
      description: 'Product lifecycle status',
    },
    {
      name: 'Variants',
      score: Math.min(product.variantCount * 20, 100),
      weight: 0.4,
      description: 'Number of product variants',
    },
    {
      name: 'Pricing',
      score: product.basePrice ? 100 : 0,
      weight: 0.3,
      description: 'Base pricing information',
    },
  ];
  
  const totalScore = factors.reduce(
    (sum, factor) => sum + (factor.score * factor.weight),
    0
  );
  
  let recommendation = 'Product is in good health';
  if (totalScore < 50) {
    recommendation = 'Consider adding variants and pricing information';
  } else if (totalScore < 80) {
    recommendation = 'Product could benefit from more variants or better pricing';
  }
  
  return {
    score: Math.round(totalScore),
    factors,
    recommendation,
  };
}
```

#### Step 1.3: Create Database Queries
**File:** `src/libs/queries/product.ts`

```typescript
import { and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { productSchema } from '@/models/schema_new';
import type {
  CreateProductInput,
  ProductDb,
  ProductListParams,
  UpdateProductInput,
  ProductStats,
  ProductFamilyGroup,
  QuickProductInput,
} from '@/types/product';

// CREATE operations
export async function createProduct(data: CreateProductInput): Promise<ProductDb> {
  // Check for duplicate product code
  const existing = await db
    .select()
    .from(productSchema)
    .where(and(
      eq(productSchema.ownerId, data.ownerId),
      eq(productSchema.productCode, data.productCode)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Product code already exists');
  }

  const [product] = await db
    .insert(productSchema)
    .values(data)
    .returning();

  if (!product) {
    throw new Error('Failed to create product');
  }

  return product;
}

// Bulk create for product families
export async function createQuickProducts(
  data: QuickProductInput,
  ownerId: string
): Promise<ProductDb[]> {
  // Generate product data
  const products: CreateProductInput[] = [];
  
  for (let i = 1; i <= data.count; i++) {
    const productCode = generateProductCode(data.productFamily, i);
    const productName = generateProductName(data.productFamily, data.templateData.category, i);
    
    products.push({
      ownerId,
      productCode,
      productName,
      category: data.templateData.category,
      productFamily: data.productFamily,
      variantCount: 0,
      status: data.templateData.status || 'draft',
      basePrice: data.templateData.basePrice,
    });
  }

  // Check for existing product codes
  const existingCodes = await db
    .select({ productCode: productSchema.productCode })
    .from(productSchema)
    .where(eq(productSchema.ownerId, ownerId));

  const existingCodesSet = new Set(existingCodes.map(p => p.productCode));
  const newProducts = products.filter(p => !existingCodesSet.has(p.productCode));

  if (newProducts.length === 0) {
    throw new Error('All generated product codes already exist');
  }

  const createdProducts = await db
    .insert(productSchema)
    .values(newProducts)
    .returning();

  return createdProducts;
}

// READ operations
export async function getProductById(id: number, ownerId: string): Promise<ProductDb | null> {
  const [product] = await db
    .select()
    .from(productSchema)
    .where(and(
      eq(productSchema.id, id),
      eq(productSchema.ownerId, ownerId)
    ))
    .limit(1);

  return product || null;
}

export async function getProductByCode(productCode: string, ownerId: string): Promise<ProductDb | null> {
  const [product] = await db
    .select()
    .from(productSchema)
    .where(and(
      eq(productSchema.ownerId, ownerId),
      eq(productSchema.productCode, productCode)
    ))
    .limit(1);

  return product || null;
}

// List with pagination and filtering
export async function getPaginatedProducts(params: ProductListParams) {
  const { 
    ownerId, page, limit, search, category, productFamily, status, 
    priceMin, priceMax, hasVariants, sortBy, sortOrder 
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [eq(productSchema.ownerId, ownerId)];

  if (search) {
    whereConditions.push(
      or(
        ilike(productSchema.productCode, `%${search}%`),
        ilike(productSchema.productName, `%${search}%`),
        ilike(productSchema.notes, `%${search}%`)
      )
    );
  }

  if (category) {
    whereConditions.push(eq(productSchema.category, category));
  }

  if (productFamily) {
    whereConditions.push(eq(productSchema.productFamily, productFamily));
  }

  if (status) {
    whereConditions.push(eq(productSchema.status, status));
  }

  if (priceMin && productSchema.basePrice) {
    whereConditions.push(gte(productSchema.basePrice, priceMin));
  }

  if (priceMax && productSchema.basePrice) {
    whereConditions.push(lte(productSchema.basePrice, priceMax));
  }

  if (hasVariants !== undefined) {
    if (hasVariants) {
      whereConditions.push(gte(productSchema.variantCount, 1));
    } else {
      whereConditions.push(eq(productSchema.variantCount, 0));
    }
  }

  // Order by clause
  const orderColumn = productSchema[sortBy] || productSchema.createdAt;
  const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

  // Execute queries
  const [products, [{ total }]] = await Promise.all([
    db
      .select()
      .from(productSchema)
      .where(and(...whereConditions))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset),
    
    db
      .select({ total: count() })
      .from(productSchema)
      .where(and(...whereConditions))
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + products.length < total,
    },
  };
}

// Get products by family
export async function getProductFamilyGroups(ownerId: string): Promise<ProductFamilyGroup[]> {
  const products = await db
    .select()
    .from(productSchema)
    .where(eq(productSchema.ownerId, ownerId))
    .orderBy(asc(productSchema.productFamily), asc(productSchema.productCode));

  // Group by family
  const grouped = products.reduce((acc, product) => {
    const family = product.productFamily || 'Other';
    
    if (!acc[family]) {
      acc[family] = {
        family,
        products: [],
        totalProducts: 0,
        totalVariants: 0,
        averagePrice: 0,
        statusBreakdown: {
          draft: 0,
          active: 0,
          discontinued: 0,
          archived: 0,
        },
      };
    }

    acc[family].products.push(product);
    acc[family].totalProducts++;
    acc[family].totalVariants += product.variantCount || 0;
    acc[family].statusBreakdown[product.status]++;

    return acc;
  }, {} as Record<string, ProductFamilyGroup>);

  // Calculate averages
  Object.values(grouped).forEach(group => {
    const validPrices = group.products
      .map(p => p.basePrice)
      .filter((price): price is number => price !== null && price !== undefined);
    
    if (validPrices.length > 0) {
      group.averagePrice = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
    }
  });

  return Object.values(grouped);
}

// UPDATE operations
export async function updateProduct(
  id: number,
  ownerId: string,
  data: UpdateProductInput
): Promise<ProductDb> {
  // If updating product code, check for duplicates
  if (data.productCode) {
    const existing = await db
      .select()
      .from(productSchema)
      .where(and(
        eq(productSchema.ownerId, ownerId),
        eq(productSchema.productCode, data.productCode),
        // Exclude current product
        eq(productSchema.id, id)
      ))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      throw new Error('Product code already exists');
    }
  }

  const [updated] = await db
    .update(productSchema)
    .set(data)
    .where(and(
      eq(productSchema.id, id),
      eq(productSchema.ownerId, ownerId)
    ))
    .returning();

  if (!updated) {
    throw new Error('Product not found or failed to update');
  }

  return updated;
}

// Status update with validation
export async function updateProductStatus(
  id: number,
  ownerId: string,
  newStatus: string,
  additionalData?: Partial<ProductDb>
): Promise<ProductDb> {
  const current = await getProductById(id, ownerId);
  if (!current) {
    throw new Error('Product not found');
  }

  // Status transition validation
  const validTransitions = {
    'draft': ['active', 'archived'],
    'active': ['discontinued', 'archived'],
    'discontinued': ['archived'],
    'archived': [], // Terminal state
  };

  if (!validTransitions[current.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${current.status} to ${newStatus}`);
  }

  const updateData = {
    status: newStatus,
    ...additionalData,
    ...(newStatus === 'discontinued' && !current.discontinueDate ? { discontinueDate: new Date() } : {}),
  };

  return await updateProduct(id, ownerId, updateData);
}

// Increment variant count (called when ProductSub is created)
export async function incrementVariantCount(id: number, ownerId: string): Promise<ProductDb> {
  const current = await getProductById(id, ownerId);
  if (!current) {
    throw new Error('Product not found');
  }

  return await updateProduct(id, ownerId, {
    variantCount: (current.variantCount || 0) + 1,
  });
}

// Decrement variant count (called when ProductSub is deleted)
export async function decrementVariantCount(id: number, ownerId: string): Promise<ProductDb> {
  const current = await getProductById(id, ownerId);
  if (!current) {
    throw new Error('Product not found');
  }

  const newCount = Math.max((current.variantCount || 0) - 1, 0);
  
  return await updateProduct(id, ownerId, {
    variantCount: newCount,
  });
}

// DELETE operations
export async function deleteProduct(id: number, ownerId: string): Promise<void> {
  // Check if product can be deleted (no variants)
  const product = await getProductById(id, ownerId);
  if (!product) {
    throw new Error('Product not found');
  }

  if (product.variantCount && product.variantCount > 0) {
    throw new Error('Cannot delete product with existing variants');
  }

  if (product.status !== 'draft') {
    throw new Error('Only draft products can be deleted');
  }

  const result = await db
    .delete(productSchema)
    .where(and(
      eq(productSchema.id, id),
      eq(productSchema.ownerId, ownerId)
    ));

  if (result.rowCount === 0) {
    throw new Error('Product not found');
  }
}

// STATISTICS
export async function getProductStats(ownerId: string): Promise<ProductStats> {
  const [basicStats] = await db
    .select({
      total: count(),
      draft: count(eq(productSchema.status, 'draft')),
      active: count(eq(productSchema.status, 'active')),
      discontinued: count(eq(productSchema.status, 'discontinued')),
      archived: count(eq(productSchema.status, 'archived')),
    })
    .from(productSchema)
    .where(eq(productSchema.ownerId, ownerId));

  const categoryStats = await db
    .select({
      category: productSchema.category,
      count: count(),
    })
    .from(productSchema)
    .where(eq(productSchema.ownerId, ownerId))
    .groupBy(productSchema.category);

  const familyStats = await db
    .select({
      productFamily: productSchema.productFamily,
      count: count(),
    })
    .from(productSchema)
    .where(eq(productSchema.ownerId, ownerId))
    .groupBy(productSchema.productFamily);

  // Calculate top families
  const topFamilies = familyStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(f => ({
      family: f.productFamily || 'Other',
      count: f.count,
      percentage: Math.round((f.count / (basicStats?.total || 1)) * 100),
    }));

  return {
    total: basicStats?.total || 0,
    byStatus: {
      draft: basicStats?.draft || 0,
      active: basicStats?.active || 0,
      discontinued: basicStats?.discontinued || 0,
      archived: basicStats?.archived || 0,
    },
    byCategory: Object.fromEntries(categoryStats.map(c => [c.category, c.count])),
    byFamily: Object.fromEntries(familyStats.map(f => [f.productFamily || 'Other', f.count])),
    totalVariants: 0, // Will be calculated from ProductSub if table exists
    averagePrice: 0,   // Will be calculated from non-null basePrice values
    priceRange: { min: 0, max: 0 }, // Will be calculated
    topFamilies,
  };
}

// Helper functions
export async function productExists(id: number, ownerId: string): Promise<boolean> {
  const [result] = await db
    .select({ id: productSchema.id })
    .from(productSchema)
    .where(and(
      eq(productSchema.id, id),
      eq(productSchema.ownerId, ownerId)
    ))
    .limit(1);

  return !!result;
}

export async function getProductsByStatus(status: string, ownerId: string): Promise<ProductDb[]> {
  return await db
    .select()
    .from(productSchema)
    .where(and(
      eq(productSchema.ownerId, ownerId),
      eq(productSchema.status, status)
    ))
    .orderBy(asc(productSchema.productCode));
}

export async function getAvailableProductCodes(
  family: string,
  ownerId: string
): Promise<string[]> {
  const existing = await db
    .select({ productCode: productSchema.productCode })
    .from(productSchema)
    .where(and(
      eq(productSchema.ownerId, ownerId),
      eq(productSchema.productFamily, family)
    ));

  const existingCodes = existing.map(p => p.productCode);
  const suggestions: string[] = [];

  // Generate next available codes
  for (let i = 1; i <= 99; i++) {
    const code = generateProductCode(family, i);
    if (!existingCodes.includes(code)) {
      suggestions.push(code);
      if (suggestions.length >= 10) break; // Limit suggestions
    }
  }

  return suggestions;
}

// Import helper functions from validation
import { 
  generateProductCode, 
  generateProductName 
} from '@/libs/validations/product';
```

### **PHASE 2: API Layer**

#### Step 2.1: Main API Route
**File:** `src/app/api/products/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { 
  createProduct, 
  createQuickProducts,
  getPaginatedProducts 
} from '@/libs/queries/product';
import {
  validateCreateProduct,
  validateProductListParams,
  validateQuickProduct,
} from '@/libs/validations/product';

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      productFamily: searchParams.get('productFamily') || undefined,
      status: searchParams.get('status') || undefined,
      priceMin: searchParams.get('priceMin') || undefined,
      priceMax: searchParams.get('priceMax') || undefined,
      hasVariants: searchParams.get('hasVariants') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = { ...validateProductListParams(queryParams), ownerId };
    const result = await getPaginatedProducts(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const body = await request.json();

    // Check if it's a quick creation request
    if (body.count && body.productFamily) {
      const validatedData = validateQuickProduct(body);
      const products = await createQuickProducts(validatedData, ownerId);

      return NextResponse.json(
        { 
          success: true, 
          data: products, 
          message: `${products.length} products created successfully` 
        },
        { status: 201 }
      );
    } else {
      // Single product creation
      const validatedData = validateCreateProduct(body);
      const product = await createProduct({
        ...validatedData,
        ownerId,
      });

      return NextResponse.json(
        { success: true, data: product, message: 'Product created successfully' },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Step 2.2: Families Route
**File:** `src/app/api/products/families/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getProductFamilyGroups } from '@/libs/queries/product';

// GET /api/products/families
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const familyGroups = await getProductFamilyGroups(ownerId);

    return NextResponse.json({
      success: true,
      data: familyGroups,
    });
  } catch (error) {
    console.error('Error fetching product families:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### **PHASE 3: Client API & Hooks Layer**

#### Step 3.1: Client API Functions
**File:** `src/libs/api/product.ts`

```typescript
// Following exact todos pattern but with Product-specific features
export async function fetchProducts(params = {}) {
  // Implementation following fetchTodos pattern
  // Additional parameters for family, category filtering
}

export async function createProduct(data) {
  // Implementation following createTodo pattern
}

export async function createQuickProducts(data) {
  // New functionality for bulk product creation
}

export async function updateProduct(id, data) {
  // Implementation following updateTodo pattern
}

export async function deleteProduct(id) {
  // Implementation following deleteTodo pattern
}

export async function fetchProductStats() {
  // Implementation following fetchTodoStats pattern
}

export async function fetchProductFamilies() {
  // New functionality for family grouping
}
```

### **PHASE 4: UI Components Layer**

#### Step 4.1: List Component
**File:** `src/features/product/ProductList.tsx`

```typescript
// Following TodoList pattern but with:
// - Family grouping view toggle
// - Category and status filtering
// - Variant count display
// - Price information
// - Product health indicators
```

#### Step 4.2: Form Component
**File:** `src/features/product/ProductForm.tsx`

```typescript
// Following TodoForm pattern but with:
// - Product code validation and suggestions
// - Family and category selectors
// - Price input with validation
// - Date pickers for lifecycle
// - Status transition controls
```

#### Step 4.3: Family Group Component
**File:** `src/features/product/ProductFamilyGroup.tsx`

```typescript
// New component for family-based organization
// - Expandable family groups
// - Family statistics
// - Bulk operations per family
// - Quick product creation
```

### **PHASE 5: Page Integration**

#### Step 5.1: Dashboard Page
**File:** `src/app/[locale]/(auth)/dashboard/products/page.tsx`

```typescript
// Following TodosPage pattern but with:
// - Family-based organization view
// - Quick product creation modal
// - Product health overview
// - Category-based filtering
// - Lifecycle management tools
```

---

## 🧪 **TESTING STRATEGY**

### Focus Areas:
1. **Product code validation** (NHA01, NHA02A format)
2. **Product code uniqueness** per owner
3. **Status transitions** (draft → active → discontinued)
4. **Family grouping** functionality
5. **Lifecycle date validation** (launch before discontinue)
6. **Variant count integration** (increment/decrement)

---

## ✅ **ACCEPTANCE CRITERIA**

### Functional Requirements:
- [ ] Create products with unique product codes
- [ ] Validate product code format (NHA01, NHA02A)
- [ ] Organize products by family groups
- [ ] List with filtering by family, category, status
- [ ] Search by product code, name, notes
- [ ] Edit with business rule validation
- [ ] Delete draft products only (no variants)
- [ ] Status transitions (draft → active → discontinued)
- [ ] Quick product creation for families
- [ ] Lifecycle management (launch/discontinue dates)

### Technical Requirements:
- [ ] Product code uniqueness per owner
- [ ] Product code format validation
- [ ] Status transition validation
- [ ] Date range validation
- [ ] Variant count integration ready
- [ ] Family grouping performance
- [ ] Price validation

### Business Rules:
- [ ] Unique product codes per owner
- [ ] Product codes follow format rules
- [ ] Only draft products can be deleted
- [ ] Products with variants cannot be deleted
- [ ] Discontinue date after launch date
- [ ] Status transitions follow workflow

---

## 🚀 **GETTING STARTED**

1. **Start Simple**: Basic CRUD with product codes
2. **Product Code System**: Focus on validation and uniqueness
3. **Family Organization**: Build grouping features
4. **Test Validation**: Ensure all business rules work
5. **Integration Ready**: Prepare for ProductSub references

**Estimated Timeline**: 1-1.5 weeks

**Key Features**: Product code management, family organization, simple lifecycle

This plan provides the simplest and fastest implementation to build momentum before tackling more complex tables.