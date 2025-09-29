import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify the token and get user info
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'income' or 'expense'

    if (!type || (type !== 'income' && type !== 'expense')) {
      return NextResponse.json(
        { message: 'Type must be either income or expense' },
        { status: 400 }
      )
    }

    // Get custom categories for the user
    const customCategories = await query(
      'SELECT name FROM custom_categories WHERE user_id = ? AND type = ? ORDER BY name',
      [decoded.userId, type]
    ) as any[]

    // Get custom subcategories for the user
    const customSubcategories = await query(
      'SELECT category_name, subcategory_name FROM custom_subcategories WHERE user_id = ? AND type = ? ORDER BY category_name, subcategory_name',
      [decoded.userId, type]
    ) as any[]

    return NextResponse.json({
      customCategories: customCategories.map(cat => cat.name),
      customSubcategories: customSubcategories
    })

  } catch (error) {
    console.error('Error fetching custom categories:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify the token and get user info
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const { name, type, subcategoryName, categoryName } = await request.json()

    if (!name || !type || (type !== 'income' && type !== 'expense')) {
      return NextResponse.json(
        { message: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Add custom category
    await query(
      'INSERT INTO custom_categories (user_id, name, type) VALUES (?, ?, ?)',
      [decoded.userId, name, type]
    )

    // If subcategory is provided, add it too
    if (subcategoryName && categoryName) {
      await query(
        'INSERT INTO custom_subcategories (user_id, category_name, subcategory_name, type) VALUES (?, ?, ?, ?)',
        [decoded.userId, categoryName, subcategoryName, type]
      )
    }

    return NextResponse.json({
      message: 'Custom category added successfully'
    })

  } catch (error) {
    console.error('Error adding custom category:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
