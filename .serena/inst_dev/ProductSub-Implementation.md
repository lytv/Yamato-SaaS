# ProductSub Feature Implementation Plan

## 🎯 **OVERVIEW & CONTEXT**

ProductSub represents product variants and sub-products that extend base products with specific characteristics like color, design patterns, embroidery types, and other variations. It manages the complex classification system, pricing calculations, and production factors for product variants.

**Key Characteristics:**
- Product variant management (NHA_01_CM, NHA_02_CO style codes)
- Multi-dimensional classification (category, color, design, embroidery)
- Dynamic pricing with complexity factors
- SKU generation and barcode management
- Production time factors and special process requirements
- Lifecycle management (launch, active, discontinued)

**Based on Todos Pattern:** Yamato-SaaS architecture with moderate complexity

**Medium Complexity:** More complex than Plan but simpler than ProcessExecution

---

## 🔧 **PREREQUISITES & DEPENDENCIES**

**Required Tables (Must exist first):**
- `Product` table with CRUD operations (main dependency)

**Development Dependencies:**
- Existing todos feature (as reference pattern)
- PlanDetail implementation (for pattern reference)
- Drizzle ORM setup
- Clerk authentication
- Shadcn UI components
- Next.js App Router

**Mock Data Strategy:**
If Product table isn't ready, create mock Product records:
```typescript
const mockProducts = [
  { id: 1, productCode: 'NHA01', productName: 'Áo Dài Truyền Thống', category: 'Traditional' },
  { id: 2, productCode: 'NHA02A', productName: 'Áo Dài Cách Tân', category: 'Modern' },
];
```

---

## 📁 **FILE STRUCTURE TO CREATE**

```
src/
├── types/
│   └── productSub.ts                         # TypeScript types
├── libs/
│   ├── validations/
│   │   └── productSub.ts                    # Zod validation schemas
│   ├── queries/
│   │   └── productSub.ts                    # Database queries
│   └── api/
│       └── productSub.ts                    # Client API functions
├── hooks/
│   ├── useProductSubs.ts                    # Data fetching hook
│   ├── useProductSubMutations.ts            # CRUD mutations hook
│   └── useProductSubFilters.ts              # Filter state management
├── features/
│   └── productSub/
│       ├── ProductSubList.tsx               # List component
│       ├── ProductSubForm.tsx               # Create/Edit form
│       ├── ProductSubSkeleton.tsx           # Loading skeleton
│       ├── ClassificationPicker.tsx         # Multi-dimension classification
│       ├── PricingCalculator.tsx            # Pricing computation
│       ├── SKUGenerator.tsx                 # SKU generation component
│       ├── ProductVariantCard.tsx           # Individual variant display
│       └── __tests__/                       # Component tests
├── app/
│   ├── api/
│   │   └── product-subs/
│   │       ├── route.ts                     # GET /api/product-subs, POST
│   │       ├── bulk/
│   │       │   └── route.ts                 # POST /api/product-subs/bulk
│   │       ├── generate-sku/
│   │       │   └── route.ts                 # POST /api/product-subs/generate-sku
│   │       ├── stats/
│   │       │   └── route.ts                 # GET /api/product-subs/stats
│   │       └── [id]/
│   │           └── route.ts                 # GET, PUT, DELETE /api/product-subs/[id]
│   └── [locale]/
│       └── (auth)/
│           └── dashboard/
│               └── product-subs/
│                   └── page.tsx             # Main dashboard page
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **PHASE 1: Foundation Layer (Types, Validation, Database)**

#### Step 1.1: Create TypeScript Types
**File:** `src/types/productSub.ts`

```typescript
import type { productSubSchema } from '@/models/schema_new';

// Base types from schema
export type ProductSubDb = typeof productSubSchema.$inferSelect;

export type ProductSub = Omit<ProductSubDb, 'createdAt' | 'updatedAt' | 'launchDate' | 'discontinueDate'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  launchDate: string | Date | null;
  discontinueDate: string | Date | null;
};

export type CreateProductSubInput = typeof productSubSchema.$inferInsert;

export type UpdateProductSubInput = Partial<Omit<CreateProductSubInput, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

// Classification system types
export type SubCategory = 'CM' | 'CO' | 'Traditional' | 'Modern' | 'Premium' | 'Standard';

export type ColorCode = 'MÀU' | 'BẠC' | 'TRẮNG' | 'TÍM' | 'HỒNG' | 'XANH' | 'VÀNG' | 'ĐEN';

export type DesignPattern = 'CÔNG' | 'SUIREN KIMONO' | 'LOTUS' | 'DRAGON' | 'PHOENIX' | 'BAMBOO' | 'CLASSIC';

export type EmbroideryType = 'THÊU' | 'KHÔNG THÊU' | 'PARTIAL' | 'FULL';

export type ProductSubStatus = 'active' | 'discontinued' | 'planned' | 'archived';

// Classification combination
export type ProductClassification = {
  subCategory: SubCategory;
  colorCode: ColorCode;
  designPattern: DesignPattern;
  embroideryType: EmbroideryType;
};

// Pricing calculation types
export type PricingFactors = {
  basePrice: number;
  additionalCost: number;
  complexityFactor: number;
  laborCostFactor: number;
  materialCostFactor: number;
  overheadCostFactor: number;
};

export type CalculatedPricing = {
  basePrice: number;
  additionalCosts: number;
  complexityAdjustment: number;
  laborCosts: number;
  materialCosts: number;
  overheadCosts: number;
  totalPrice: number;
  markup: number;
  finalPrice: number;
};

// Production factors
export type ProductionFactors = {
  productionTimeFactor: number;
  skillLevelRequired: number;
  complexityLevel: number;
  requiresSpecialProcess: boolean;
  specialRequirements?: string;
};

// SKU management
export type SKUData = {
  productCode: string;
  subCategory: string;
  colorCode: string;
  sequence: number;
  checksum?: string;
};

export type GeneratedSKU = {
  skuCode: string;
  barcode?: string;
  isUnique: boolean;
  pattern: string;
};

// Filter types
export type ProductSubFilters = {
  search: string;
  productId?: number;
  productCode?: string;
  subCategory?: SubCategory;
  colorCode?: ColorCode;
  designPattern?: DesignPattern;
  embroideryType?: EmbroideryType;
  status?: ProductSubStatus;
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy: 'createdAt' | 'displayOrder' | 'basePrice' | 'productSubCode' | 'status';
  sortOrder: 'asc' | 'desc';
};

// List parameters
export type ProductSubListParams = {
  ownerId: string;
  page: number;
  limit: number;
} & Omit<ProductSubFilters, 'search'> & {
  search?: string;
};

// Bulk operations
export type BulkProductSubInput = {
  productId: number;
  variants: Array<{
    classification: ProductClassification;
    additionalCost?: number;
    complexityFactor?: number;
    displayOrder?: number;
  }>;
  templateData: {
    basePrice: number;
    description?: string;
    requiresSpecialProcess?: boolean;
  };
};

// Statistics
export type ProductSubStats = {
  total: number;
  byStatus: Record<ProductSubStatus, number>;
  byCategory: Record<SubCategory, number>;
  byColor: Record<ColorCode, number>;
  byDesign: Record<DesignPattern, number>;
  byEmbroidery: Record<EmbroideryType, number>;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  totalVariants: number;
  uniqueProducts: number;
};

// API Response types
export type ProductSubsResponse = {
  success: true;
  data: ProductSub[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type ProductSubResponse = {
  success: true;
  data: ProductSub;
  message?: string;
};

export type ProductSubStatsResponse = {
  success: true;
  data: ProductSubStats;
};

export type ProductSubErrorResponse = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

// Form data
export type ProductSubFormData = {
  productId: number;
  productCode: string;
  productSubCode: string;
  productSubDetail: string;
  classification: ProductClassification;
  pricing: PricingFactors;
  production: ProductionFactors;
  displayOrder?: number;
  subSequence?: number;
  status: ProductSubStatus;
  launchDate?: string | Date;
  discontinueDate?: string | Date;
  skuCode?: string;
  barcode?: string;
  description?: string;
  note?: string;
};

// Variant grouping for display
export type ProductVariantGroup = {
  productId: number;
  productCode: string;
  productName: string;
  variants: ProductSub[];
  totalVariants: number;
  categories: SubCategory[];
  colors: ColorCode[];
  priceRange: {
    min: number;
    max: number;
  };
};
```

#### Step 1.2: Create Validation Schemas
**File:** `src/libs/validations/productSub.ts`

```typescript
import { z } from 'zod';

// Enum definitions
const SubCategory = z.enum(['CM', 'CO', 'Traditional', 'Modern', 'Premium', 'Standard']);
const ColorCode = z.enum(['MÀU', 'BẠC', 'TRẮNG', 'TÍM', 'HỒNG', 'XANH', 'VÀNG', 'ĐEN']);
const DesignPattern = z.enum(['CÔNG', 'SUIREN KIMONO', 'LOTUS', 'DRAGON', 'PHOENIX', 'BAMBOO', 'CLASSIC']);
const EmbroideryType = z.enum(['THÊU', 'KHÔNG THÊU', 'PARTIAL', 'FULL']);
const ProductSubStatus = z.enum(['active', 'discontinued', 'planned', 'archived']);

// Product sub code validation (NHA_01_CM, NHA_02_CO format)
const productSubCodeSchema = z.string().regex(
  /^[A-Z]{3}_\d{2}_[A-Z]{2,}$/,
  'Product sub code must follow format like NHA_01_CM, NHA_02_CO'
);

// Pricing validation
const pricingSchema = z.object({
  basePrice: z.number().min(0, 'Base price must be non-negative'),
  additionalCost: z.number().min(0, 'Additional cost must be non-negative').default(0),
  complexityFactor: z.number().min(0.1).max(5.0, 'Complexity factor must be between 0.1 and 5.0').default(1.0),
  laborCostFactor: z.number().min(0.1).max(5.0).default(1.0),
  materialCostFactor: z.number().min(0.1).max(5.0).default(1.0),
  overheadCostFactor: z.number().min(0.1).max(5.0).default(1.0),
});

// Production factors validation
const productionSchema = z.object({
  productionTimeFactor: z.number().min(0.1).max(10.0, 'Production time factor must be between 0.1 and 10.0').default(1.0),
  skillLevelRequired: z.number().int().min(1).max(5, 'Skill level must be between 1 and 5').default(1),
  complexityLevel: z.number().int().min(1).max(5, 'Complexity level must be between 1 and 5').default(1),
  requiresSpecialProcess: z.boolean().default(false),
  specialRequirements: z.string().optional(),
});

// Classification validation
const classificationSchema = z.object({
  subCategory: SubCategory,
  colorCode: ColorCode,
  designPattern: DesignPattern,
  embroideryType: EmbroideryType,
});

// Main form schema
export const productSubFormSchema = z.object({
  productId: z.number().int().positive('Product is required'),
  productCode: z.string().min(1, 'Product code is required'),
  
  productSubCode: productSubCodeSchema,
  productSubDetail: z.string().min(1, 'Product sub detail is required'),
  
  // Classification
  subCategory: SubCategory,
  colorCode: ColorCode,
  designPattern: DesignPattern,
  embroideryType: EmbroideryType,
  
  // Pricing
  basePrice: z.number().min(0, 'Base price must be non-negative'),
  additionalCost: z.number().min(0).default(0),
  complexityFactor: z.number().min(0.1).max(5.0).default(1.0),
  
  // Production
  productionTimeFactor: z.number().min(0.1).max(10.0).default(1.0),
  requiresSpecialProcess: z.boolean().default(false),
  specialRequirements: z.string().optional(),
  
  // Display & ordering
  displayOrder: z.number().int().min(0).optional(),
  subSequence: z.number().int().min(1).default(1),
  
  // Lifecycle
  status: ProductSubStatus.default('active'),
  launchDate: z.string().optional().or(z.date().optional()),
  discontinueDate: z.string().optional().or(z.date().optional()),
  
  // SKU
  skuCode: z.string().optional(),
  barcode: z.string().optional(),
  
  // Documentation
  description: z.string().optional(),
  note: z.string().optional(),
}).refine((data) => {
  // Validate product sub code contains product code
  return data.productSubCode.startsWith(data.productCode.replace(/A$/, ''));
}, {
  message: "Product sub code must contain the product code",
  path: ["productSubCode"]
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
  // Validate special requirements if special process required
  if (data.requiresSpecialProcess && !data.specialRequirements) {
    return false;
  }
  return true;
}, {
  message: "Special requirements must be specified when special process is required",
  path: ["specialRequirements"]
});

// CRUD schemas
export const createProductSubSchema = productSubFormSchema;
export const updateProductSubSchema = productSubFormSchema.partial();

// List parameters schema
export const productSubListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  productId: z.coerce.number().int().optional(),
  productCode: z.string().optional(),
  subCategory: SubCategory.optional(),
  colorCode: ColorCode.optional(),
  designPattern: DesignPattern.optional(),
  embroideryType: EmbroideryType.optional(),
  status: ProductSubStatus.optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['createdAt', 'displayOrder', 'basePrice', 'productSubCode', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Bulk creation schema
export const bulkProductSubSchema = z.object({
  productId: z.number().int().positive('Product ID is required'),
  variants: z.array(z.object({
    classification: classificationSchema,
    additionalCost: z.number().min(0).optional().default(0),
    complexityFactor: z.number().min(0.1).max(5.0).optional().default(1.0),
    displayOrder: z.number().int().min(0).optional(),
  })).min(1, 'At least one variant is required'),
  templateData: z.object({
    basePrice: z.number().min(0, 'Base price is required'),
    description: z.string().optional(),
    requiresSpecialProcess: z.boolean().optional().default(false),
  }),
});

// SKU generation schema
export const skuGenerationSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  subCategory: z.string().min(1, 'Sub category is required'),
  colorCode: z.string().min(1, 'Color code is required'),
  sequence: z.number().int().min(1).optional(),
  includeChecksum: z.boolean().optional().default(false),
});

// Validation functions
export function validateCreateProductSub(data: unknown) {
  return createProductSubSchema.parse(data);
}

export function validateUpdateProductSub(data: unknown) {
  return updateProductSubSchema.parse(data);
}

export function validateProductSubListParams(data: unknown) {
  return productSubListParamsSchema.parse(data);
}

export function validateBulkProductSub(data: unknown) {
  return bulkProductSubSchema.parse(data);
}

export function validateSKUGeneration(data: unknown) {
  return skuGenerationSchema.parse(data);
}

// Business logic validation helpers
export function generateProductSubCode(
  productCode: string,
  subSequence: number,
  subCategory: string
): string {
  const baseCode = productCode.replace(/A$/, ''); // Remove trailing A if exists
  const sequence = subSequence.toString().padStart(2, '0');
  return `${baseCode}_${sequence}_${subCategory}`;
}

export function generateProductSubDetail(
  colorCode: string,
  designPattern: string,
  embroideryType: string
): string {
  const parts = [designPattern];
  
  if (embroideryType !== 'KHÔNG THÊU') {
    parts.push(embroideryType);
  }
  
  parts.push(colorCode);
  
  return parts.join(' - ');
}

export function calculateTotalPrice(pricing: PricingFactors): CalculatedPricing {
  const basePrice = pricing.basePrice;
  const additionalCosts = pricing.additionalCost;
  const complexityAdjustment = basePrice * (pricing.complexityFactor - 1);
  const laborCosts = basePrice * (pricing.laborCostFactor - 1);
  const materialCosts = basePrice * (pricing.materialCostFactor - 1);
  const overheadCosts = basePrice * (pricing.overheadCostFactor - 1);
  
  const totalPrice = basePrice + additionalCosts + complexityAdjustment + laborCosts + materialCosts + overheadCosts;
  const markup = totalPrice * 0.1; // 10% markup
  const finalPrice = totalPrice + markup;
  
  return {
    basePrice,
    additionalCosts,
    complexityAdjustment,
    laborCosts,
    materialCosts,
    overheadCosts,
    totalPrice,
    markup,
    finalPrice,
  };
}

export function generateSKU(data: SKUData): GeneratedSKU {
  const { productCode, subCategory, colorCode, sequence, checksum } = data;
  
  // Basic SKU pattern: PRODUCT-CATEGORY-COLOR-SEQUENCE
  const baseCode = productCode.replace(/A$/, '');
  const categoryAbbr = subCategory.substring(0, 2).toUpperCase();
  const colorAbbr = colorCode.substring(0, 3).toUpperCase();
  const seqNum = (sequence || 1).toString().padStart(3, '0');
  
  let skuCode = `${baseCode}-${categoryAbbr}-${colorAbbr}-${seqNum}`;
  
  if (checksum) {
    // Simple checksum calculation
    const sum = skuCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const checksumDigit = (sum % 10).toString();
    skuCode += checksumDigit;
  }
  
  return {
    skuCode,
    isUnique: true, // Will be validated in database
    pattern: `${baseCode}-${categoryAbbr}-${colorAbbr}-XXX`,
  };
}

export function validateClassificationUniqueness(
  productId: number,
  classification: ProductClassification,
  ownerId: string
): boolean {
  // This will be implemented in database queries
  // Check if the combination of productId + classification already exists
  return true;
}
```

#### Step 1.3: Create Database Queries
**File:** `src/libs/queries/productSub.ts`

```typescript
import { and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { productSubSchema, productSchema } from '@/models/schema_new';
import type {
  CreateProductSubInput,
  ProductSubDb,
  ProductSubListParams,
  UpdateProductSubInput,
  BulkProductSubInput,
  ProductSubStats,
  ProductVariantGroup,
} from '@/types/productSub';

// CREATE operations
export async function createProductSub(data: CreateProductSubInput): Promise<ProductSubDb> {
  // Validate product exists
  const [product] = await db.select().from(productSchema).where(eq(productSchema.id, data.productId)).limit(1);
  if (!product) {
    throw new Error('Product not found');
  }

  // Check for duplicate product sub code
  const existing = await db
    .select()
    .from(productSubSchema)
    .where(and(
      eq(productSubSchema.ownerId, data.ownerId),
      eq(productSubSchema.productSubCode, data.productSubCode)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Product sub code already exists');
  }

  // Check for duplicate classification combination
  const duplicateClassification = await db
    .select()
    .from(productSubSchema)
    .where(and(
      eq(productSubSchema.ownerId, data.ownerId),
      eq(productSubSchema.productId, data.productId),
      eq(productSubSchema.subCategory, data.subCategory),
      eq(productSubSchema.colorCode, data.colorCode),
      eq(productSubSchema.designPattern, data.designPattern),
      eq(productSubSchema.embroideryType, data.embroideryType)
    ))
    .limit(1);

  if (duplicateClassification.length > 0) {
    throw new Error('This classification combination already exists for this product');
  }

  const [productSub] = await db
    .insert(productSubSchema)
    .values(data)
    .returning();

  if (!productSub) {
    throw new Error('Failed to create product sub');
  }

  return productSub;
}

// Bulk create for product variants
export async function createBulkProductSubs(
  data: BulkProductSubInput,
  ownerId: string
): Promise<ProductSubDb[]> {
  // Validate product exists
  const [product] = await db.select().from(productSchema).where(eq(productSchema.id, data.productId)).limit(1);
  if (!product) {
    throw new Error('Product not found');
  }

  // Prepare bulk insert data
  const insertData = data.variants.map((variant, index) => {
    const subSequence = index + 1;
    const productSubCode = generateProductSubCode(
      product.productCode,
      subSequence,
      variant.classification.subCategory
    );
    const productSubDetail = generateProductSubDetail(
      variant.classification.colorCode,
      variant.classification.designPattern,
      variant.classification.embroideryType
    );

    return {
      ownerId,
      productId: data.productId,
      productCode: product.productCode,
      productSubCode,
      productSubDetail,
      subCategory: variant.classification.subCategory,
      colorCode: variant.classification.colorCode,
      designPattern: variant.classification.designPattern,
      embroideryType: variant.classification.embroideryType,
      displayOrder: variant.displayOrder || index,
      subSequence,
      basePrice: data.templateData.basePrice,
      additionalCost: variant.additionalCost || 0,
      complexityFactor: variant.complexityFactor || 1.0,
      laborCostFactor: 1.0,
      materialCostFactor: 1.0,
      overheadCostFactor: 1.0,
      productionTimeFactor: 1.0,
      requiresSpecialProcess: data.templateData.requiresSpecialProcess || false,
      status: 'active',
      description: data.templateData.description,
    };
  });

  const productSubs = await db
    .insert(productSubSchema)
    .values(insertData)
    .returning();

  return productSubs;
}

// READ operations
export async function getProductSubById(id: number, ownerId: string): Promise<ProductSubDb | null> {
  const [productSub] = await db
    .select()
    .from(productSubSchema)
    .where(and(
      eq(productSubSchema.id, id),
      eq(productSubSchema.ownerId, ownerId)
    ))
    .limit(1);

  return productSub || null;
}

// Get product subs by product
export async function getProductSubsByProduct(productId: number, ownerId: string): Promise<ProductSubDb[]> {
  return await db
    .select()
    .from(productSubSchema)
    .where(and(
      eq(productSubSchema.ownerId, ownerId),
      eq(productSubSchema.productId, productId)
    ))
    .orderBy(asc(productSubSchema.displayOrder), asc(productSubSchema.subSequence));
}

// Complex list with filtering and joins
export async function getPaginatedProductSubs(params: ProductSubListParams) {
  const { 
    ownerId, page, limit, search, productId, productCode, subCategory, 
    colorCode, designPattern, embroideryType, status, priceMin, priceMax, 
    sortBy, sortOrder 
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [eq(productSubSchema.ownerId, ownerId)];

  if (search) {
    whereConditions.push(
      or(
        ilike(productSubSchema.productSubCode, `%${search}%`),
        ilike(productSubSchema.productSubDetail, `%${search}%`),
        ilike(productSubSchema.description, `%${search}%`)
      )
    );
  }

  if (productId) {
    whereConditions.push(eq(productSubSchema.productId, productId));
  }

  if (productCode) {
    whereConditions.push(ilike(productSubSchema.productCode, `%${productCode}%`));
  }

  if (subCategory) {
    whereConditions.push(eq(productSubSchema.subCategory, subCategory));
  }

  if (colorCode) {
    whereConditions.push(eq(productSubSchema.colorCode, colorCode));
  }

  if (designPattern) {
    whereConditions.push(eq(productSubSchema.designPattern, designPattern));
  }

  if (embroideryType) {
    whereConditions.push(eq(productSubSchema.embroideryType, embroideryType));
  }

  if (status) {
    whereConditions.push(eq(productSubSchema.status, status));
  }

  if (priceMin) {
    whereConditions.push(gte(productSubSchema.basePrice, priceMin));
  }

  if (priceMax) {
    whereConditions.push(lte(productSubSchema.basePrice, priceMax));
  }

  // Order by clause
  const orderColumn = productSubSchema[sortBy] || productSubSchema.createdAt;
  const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

  // Execute queries with JOIN to get product information
  const [productSubs, [{ total }]] = await Promise.all([
    db
      .select({
        ...productSubSchema,
        product: {
          id: productSchema.id,
          productCode: productSchema.productCode,
          productName: productSchema.productName,
          category: productSchema.category,
        },
      })
      .from(productSubSchema)
      .leftJoin(productSchema, eq(productSubSchema.productId, productSchema.id))
      .where(and(...whereConditions))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset),
    
    db
      .select({ total: count() })
      .from(productSubSchema)
      .where(and(...whereConditions))
  ]);

  return {
    productSubs,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + productSubs.length < total,
    },
  };
}

// Get variants grouped by product
export async function getProductVariantGroups(ownerId: string): Promise<ProductVariantGroup[]> {
  const productSubs = await db
    .select({
      ...productSubSchema,
      product: {
        id: productSchema.id,
        productCode: productSchema.productCode,
        productName: productSchema.productName,
      },
    })
    .from(productSubSchema)
    .leftJoin(productSchema, eq(productSubSchema.productId, productSchema.id))
    .where(eq(productSubSchema.ownerId, ownerId))
    .orderBy(asc(productSchema.productCode), asc(productSubSchema.displayOrder));

  // Group by product
  const grouped = productSubs.reduce((acc, item) => {
    const productId = item.product?.id || item.productId;
    
    if (!acc[productId]) {
      acc[productId] = {
        productId,
        productCode: item.product?.productCode || item.productCode,
        productName: item.product?.productName || 'Unknown Product',
        variants: [],
        totalVariants: 0,
        categories: [],
        colors: [],
        priceRange: { min: Infinity, max: 0 },
      };
    }

    acc[productId].variants.push(item);
    acc[productId].totalVariants++;
    
    // Track unique categories and colors
    if (!acc[productId].categories.includes(item.subCategory)) {
      acc[productId].categories.push(item.subCategory);
    }
    if (!acc[productId].colors.includes(item.colorCode)) {
      acc[productId].colors.push(item.colorCode);
    }
    
    // Update price range
    const price = item.basePrice || 0;
    acc[productId].priceRange.min = Math.min(acc[productId].priceRange.min, price);
    acc[productId].priceRange.max = Math.max(acc[productId].priceRange.max, price);

    return acc;
  }, {} as Record<number, ProductVariantGroup>);

  return Object.values(grouped);
}

// UPDATE operations
export async function updateProductSub(
  id: number,
  ownerId: string,
  data: UpdateProductSubInput
): Promise<ProductSubDb> {
  const [updated] = await db
    .update(productSubSchema)
    .set(data)
    .where(and(
      eq(productSubSchema.id, id),
      eq(productSubSchema.ownerId, ownerId)
    ))
    .returning();

  if (!updated) {
    throw new Error('Product sub not found or failed to update');
  }

  return updated;
}

// DELETE operations
export async function deleteProductSub(id: number, ownerId: string): Promise<void> {
  const result = await db
    .delete(productSubSchema)
    .where(and(
      eq(productSubSchema.id, id),
      eq(productSubSchema.ownerId, ownerId)
    ));

  if (result.rowCount === 0) {
    throw new Error('Product sub not found');
  }
}

// STATISTICS
export async function getProductSubStats(ownerId: string): Promise<ProductSubStats> {
  const [basicStats] = await db
    .select({
      total: count(),
      active: count(eq(productSubSchema.status, 'active')),
      discontinued: count(eq(productSubSchema.status, 'discontinued')),
      planned: count(eq(productSubSchema.status, 'planned')),
      archived: count(eq(productSubSchema.status, 'archived')),
    })
    .from(productSubSchema)
    .where(eq(productSubSchema.ownerId, ownerId));

  // Category statistics
  const categoryStats = await db
    .select({
      subCategory: productSubSchema.subCategory,
      count: count(),
    })
    .from(productSubSchema)
    .where(eq(productSubSchema.ownerId, ownerId))
    .groupBy(productSubSchema.subCategory);

  // Color statistics
  const colorStats = await db
    .select({
      colorCode: productSubSchema.colorCode,
      count: count(),
    })
    .from(productSubSchema)
    .where(eq(productSubSchema.ownerId, ownerId))
    .groupBy(productSubSchema.colorCode);

  // Design statistics
  const designStats = await db
    .select({
      designPattern: productSubSchema.designPattern,
      count: count(),
    })
    .from(productSubSchema)
    .where(eq(productSubSchema.ownerId, ownerId))
    .groupBy(productSubSchema.designPattern);

  // Embroidery statistics
  const embroideryStats = await db
    .select({
      embroideryType: productSubSchema.embroideryType,
      count: count(),
    })
    .from(productSubSchema)
    .where(eq(productSubSchema.ownerId, ownerId))
    .groupBy(productSubSchema.embroideryType);

  return {
    total: basicStats?.total || 0,
    byStatus: {
      active: basicStats?.active || 0,
      discontinued: basicStats?.discontinued || 0,
      planned: basicStats?.planned || 0,
      archived: basicStats?.archived || 0,
    },
    byCategory: Object.fromEntries(categoryStats.map(c => [c.subCategory, c.count])),
    byColor: Object.fromEntries(colorStats.map(c => [c.colorCode, c.count])),
    byDesign: Object.fromEntries(designStats.map(d => [d.designPattern, d.count])),
    byEmbroidery: Object.fromEntries(embroideryStats.map(e => [e.embroideryType, e.count])),
    averagePrice: 0, // Will be calculated in separate query if needed
    priceRange: { min: 0, max: 0 }, // Will be calculated in separate query
    totalVariants: basicStats?.total || 0,
    uniqueProducts: 0, // Will be calculated from distinct productId count
  };
}

// SKU management
export async function generateUniqueSKU(
  productCode: string,
  subCategory: string,
  colorCode: string,
  ownerId: string
): Promise<string> {
  let sequence = 1;
  let skuCode = '';
  let isUnique = false;

  while (!isUnique && sequence <= 999) {
    const skuData = {
      productCode,
      subCategory,
      colorCode,
      sequence,
    };
    
    const generated = generateSKU(skuData);
    skuCode = generated.skuCode;

    // Check if SKU already exists
    const existing = await db
      .select()
      .from(productSubSchema)
      .where(and(
        eq(productSubSchema.ownerId, ownerId),
        eq(productSubSchema.skuCode, skuCode)
      ))
      .limit(1);

    if (existing.length === 0) {
      isUnique = true;
    } else {
      sequence++;
    }
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique SKU after 999 attempts');
  }

  return skuCode;
}

// Helper functions
export async function productSubExists(id: number, ownerId: string): Promise<boolean> {
  const [result] = await db
    .select({ id: productSubSchema.id })
    .from(productSubSchema)
    .where(and(
      eq(productSubSchema.id, id),
      eq(productSubSchema.ownerId, ownerId)
    ))
    .limit(1);

  return !!result;
}

// Import helper functions from validation
import { 
  generateProductSubCode, 
  generateProductSubDetail, 
  generateSKU 
} from '@/libs/validations/productSub';
```

### **PHASE 2: API Layer**

#### Step 2.1: Main API Route
**File:** `src/app/api/product-subs/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { 
  createProductSub, 
  getPaginatedProductSubs 
} from '@/libs/queries/productSub';
import {
  validateCreateProductSub,
  validateProductSubListParams,
} from '@/libs/validations/productSub';

// GET /api/product-subs
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
      productId: searchParams.get('productId') || undefined,
      productCode: searchParams.get('productCode') || undefined,
      subCategory: searchParams.get('subCategory') || undefined,
      colorCode: searchParams.get('colorCode') || undefined,
      designPattern: searchParams.get('designPattern') || undefined,
      embroideryType: searchParams.get('embroideryType') || undefined,
      status: searchParams.get('status') || undefined,
      priceMin: searchParams.get('priceMin') || undefined,
      priceMax: searchParams.get('priceMax') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = { ...validateProductSubListParams(queryParams), ownerId };
    const result = await getPaginatedProductSubs(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.productSubs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching product subs:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/product-subs
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const body = await request.json();
    const validatedData = validateCreateProductSub(body);

    const productSub = await createProductSub({
      ...validatedData,
      ownerId,
    });

    return NextResponse.json(
      { success: true, data: productSub, message: 'Product sub created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product sub:', error);
    
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

#### Step 2.2: SKU Generation Route
**File:** `src/app/api/product-subs/generate-sku/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { generateUniqueSKU } from '@/libs/queries/productSub';
import { validateSKUGeneration } from '@/libs/validations/productSub';

// POST /api/product-subs/generate-sku
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = orgId || userId;
    const body = await request.json();
    const validatedData = validateSKUGeneration(body);

    const skuCode = await generateUniqueSKU(
      validatedData.productCode,
      validatedData.subCategory,
      validatedData.colorCode,
      ownerId
    );

    return NextResponse.json({
      success: true,
      data: { skuCode },
      message: 'SKU generated successfully',
    });
  } catch (error) {
    console.error('Error generating SKU:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

### **PHASE 3: Client API & Hooks Layer**

#### Step 3.1: Client API Functions
**File:** `src/libs/api/productSub.ts`

```typescript
// Following todos pattern exactly but with ProductSub-specific features
export async function fetchProductSubs(params = {}) {
  // Implementation following fetchTodos pattern
  // Additional parameters for classification filtering
}

export async function createProductSub(data) {
  // Implementation following createTodo pattern
}

export async function createBulkProductSubs(data) {
  // New functionality for bulk variant creation
}

export async function generateSKU(data) {
  // New functionality for SKU generation
}

export async function updateProductSub(id, data) {
  // Implementation following updateTodo pattern
}

export async function deleteProductSub(id) {
  // Implementation following deleteTodo pattern
}

export async function fetchProductSubStats() {
  // Implementation following fetchTodoStats pattern
}
```

### **PHASE 4: UI Components Layer**

#### Step 4.1: Classification Picker Component
**File:** `src/features/productSub/ClassificationPicker.tsx`

```typescript
// Specialized component for multi-dimension classification
// - Category selector
// - Color picker with visual indicators
// - Design pattern selector
// - Embroidery type toggle
// - Real-time validation display
```

#### Step 4.2: Pricing Calculator Component
**File:** `src/features/productSub/PricingCalculator.tsx`

```typescript
// Real-time pricing calculation component
// - Base price input
// - Factor sliders (complexity, labor, material, overhead)
// - Real-time total calculation
// - Breakdown display
// - Comparison with other variants
```

#### Step 4.3: List Component
**File:** `src/features/productSub/ProductSubList.tsx`

```typescript
// Following TodoList pattern but with:
// - Product grouping
// - Classification filters
// - Price range filtering
// - Variant comparison mode
// - Bulk operations
```

### **PHASE 5: Page Integration**

#### Step 5.1: Dashboard Page
**File:** `src/app/[locale]/(auth)/dashboard/product-subs/page.tsx`

```typescript
// Following TodosPage pattern but with:
// - Product variant overview
// - Classification-based filtering
// - Bulk variant creation
// - Pricing analysis tools
// - SKU management interface
```

---

## 🧪 **TESTING STRATEGY**

### Focus Areas:
1. **Classification validation** (category + color + design + embroidery combinations)
2. **Pricing calculations** (base + factors = total)
3. **SKU generation** (uniqueness and format)
4. **Product sub code validation** (NHA_01_CM format)
5. **Bulk variant creation** (multiple classification combinations)
6. **Production factor validation** (time factors, special processes)

---

## ✅ **ACCEPTANCE CRITERIA**

### Functional Requirements:
- [ ] Create product variants with multi-dimension classification
- [ ] Validate classification uniqueness per product
- [ ] Calculate pricing with multiple factors
- [ ] Generate unique SKU codes automatically
- [ ] List with classification-based filtering
- [ ] Search by product codes, names, descriptions
- [ ] Edit with business rule validation
- [ ] Delete variants with dependency checking
- [ ] Bulk variant creation from templates
- [ ] Production factor management

### Technical Requirements:
- [ ] Product sub code validation (NHA_01_CM format)
- [ ] Classification combination uniqueness
- [ ] Pricing calculation accuracy
- [ ] SKU generation uniqueness
- [ ] Foreign key validation (Product exists)
- [ ] Multi-dimensional filtering performance
- [ ] Bulk operations efficiency

### Business Rules:
- [ ] Unique classification per product
- [ ] SKU codes must be unique across system
- [ ] Product sub codes follow naming convention
- [ ] Pricing factors within valid ranges
- [ ] Special processes require special requirements
- [ ] Launch date before discontinue date

---

## 🚀 **GETTING STARTED**

1. **Mock Product Data**: Create basic Product records if table doesn't exist
2. **Start with Classification**: This is the core differentiator
3. **Test Uniqueness**: Ensure classification combinations work correctly
4. **Build Pricing Engine**: Focus on accurate calculations
5. **SKU Generation**: Implement uniqueness validation

**Estimated Timeline**: 2-3 weeks

**Key Features**: Classification system, pricing engine, SKU management

This plan provides a comprehensive product variant management system with sophisticated classification and pricing capabilities.