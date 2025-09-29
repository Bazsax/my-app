import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

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

    const { categoryName, subcategoryName, type } = await request.json()

    if (!categoryName || !subcategoryName || !type || (type !== 'income' && type !== 'expense')) {
      return NextResponse.json(
        { message: 'Category name, subcategory name, and type are required' },
        { status: 400 }
      )
    }

    // Add custom subcategory
    await query(
      'INSERT INTO custom_subcategories (user_id, category_name, subcategory_name, type) VALUES (?, ?, ?, ?)',
      [decoded.userId, categoryName, subcategoryName, type]
    )

    return NextResponse.json({
      message: 'Custom subcategory added successfully'
    })

  } catch (error) {
    console.error('Error adding custom subcategory:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
