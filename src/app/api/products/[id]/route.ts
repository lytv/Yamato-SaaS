/**
 * Individual Product API Routes
 * GET /api/products/[id] - Get single product
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete product
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  deleteProduct,
  getProductById,
  updateProduct,
} from '@/libs/queries/product';
import {
  validateProductId,
  validateUpdateProduct,
} from '@/libs/validations/product';
import type {
  ProductErrorResponse,
  ProductResponse,
} from '@/types/product';

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/products/[id] - Get single product with ownership check
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ProductResponse | ProductErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization products, fallback to userId for personal products
    const ownerId = orgId || userId;

    // Validate product ID
    const { id } = validateProductId({ id: params.id });

    // Get product with ownership check
    const product = await getProductById(id, ownerId);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid product ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/products/[id] - Update product with ownership check
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ProductResponse | ProductErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization products, fallback to userId for personal products
    const ownerId = orgId || userId;

    // Validate product ID
    const { id } = validateProductId({ id: params.id });

    // Validate update data
    const body = await request.json();
    const validatedData = validateUpdateProduct(body);

    // Update product with ownership check
    const updatedProduct = await updateProduct(id, ownerId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Product not found or access denied') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'UPDATE_ERROR',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/products/[id] - Delete product with ownership check
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<{ success: true; message: string } | ProductErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization products, fallback to userId for personal products
    const ownerId = orgId || userId;

    // Validate product ID
    const { id } = validateProductId({ id: params.id });

    // Delete product with ownership check
    await deleteProduct(id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid product ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Product not found or access denied') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'DELETE_ERROR',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
