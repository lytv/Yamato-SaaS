/**
 * Debug Products API
 * Test endpoint to check if products functionality is working
 */

import type { NextRequest } from 'next/server';

import { createProduct, getPaginatedProducts } from '@/libs/queries/product';

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    console.log('🔍 Debug Products API called');

    // Test with a dummy ownerId
    const testOwnerId = 'test-user-123';

    console.log('📊 Testing product queries with ownerId:', testOwnerId);

    let result = await getPaginatedProducts({
      page: 1,
      limit: 10,
      ownerId: testOwnerId,
    });

    // If no products exist, create some sample data
    if (result.products.length === 0) {
      console.log('📝 No products found, creating sample data...');

      const sampleProducts = [
        {
          ownerId: testOwnerId,
          productCode: 'LAPTOP-001',
          productName: 'MacBook Pro 16"',
          category: 'Electronics',
          notes: 'High-performance laptop for developers',
        },
        {
          ownerId: testOwnerId,
          productCode: 'SOFT-001',
          productName: 'Adobe Creative Suite',
          category: 'Software',
          notes: 'Professional design software package',
        },
        {
          ownerId: testOwnerId,
          productCode: 'BOOK-001',
          productName: 'Clean Code',
          category: 'Books',
          notes: 'Essential reading for software developers',
        },
      ];

      for (const productData of sampleProducts) {
        await createProduct(productData);
        console.log('✅ Created sample product:', productData.productCode);
      }

      // Fetch again after creating sample data
      result = await getPaginatedProducts({
        page: 1,
        limit: 10,
        ownerId: testOwnerId,
      });
    }

    console.log('✅ Products query successful:', {
      count: result.products.length,
      total: result.pagination.total,
    });

    return Response.json({
      success: true,
      message: 'Products API is working',
      data: {
        productsCount: result.products.length,
        totalProducts: result.pagination.total,
        products: result.products,
        pagination: result.pagination,
        testOwnerId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Debug Products API error:', error);

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(_request: NextRequest): Promise<Response> {
  try {
    console.log('🔍 Debug Products POST called');

    const testOwnerId = 'test-user-123';

    const productData = {
      ownerId: testOwnerId,
      productCode: `TEST-${Date.now()}`,
      productName: 'Test Product',
      category: 'Test Category',
      notes: 'This is a test product created via debug endpoint',
    };

    console.log('📝 Creating test product:', productData);

    const newProduct = await createProduct(productData);

    console.log('✅ Product created successfully:', newProduct);

    return Response.json({
      success: true,
      message: 'Test product created successfully',
      data: {
        product: newProduct,
        testOwnerId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Debug Products POST error:', error);

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
