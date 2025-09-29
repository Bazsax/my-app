import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
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

    const { title, amount, description, category, subcategory, type, date, time, transactionType, frequency, startDate, endDate } = await request.json()

    // Validate input
    if (!title || !amount || !type) {
      return NextResponse.json(
        { message: 'Title, amount, and type are required' },
        { status: 400 }
      )
    }

    if (type !== 'expense' && type !== 'income') {
      return NextResponse.json(
        { message: 'Type must be either expense or income' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Insert transaction into database
    const result = await query(
      'INSERT INTO cost_entries (user_id, type, title, description, amount, category, subcategory, date, time, transaction_type, frequency, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [
        decoded.userId,
        type,
        title,
        description || null,
        amount,
        category || (type === 'expense' ? 'Iroda' : 'Fizetés'),
        subcategory || null,
        date || new Date().toISOString().split('T')[0],
        time || null,
        transactionType || 'one-time',
        frequency || 'monthly',
        startDate || null,
        endDate || null
      ]
    ) as any

    return NextResponse.json({
      message: `${type === 'expense' ? 'Expense' : 'Income'} added successfully`,
      transactionId: result.insertId
    })

  } catch (error) {
    console.error('Add transaction error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
