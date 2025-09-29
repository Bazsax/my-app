import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 })
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

    // Get all transactions for debugging
    const allTransactions = await query(
      'SELECT * FROM cost_entries WHERE user_id = ? ORDER BY date DESC',
      [decoded.userId]
    )

    // Get transactions by type
    const incomeTransactions = await query(
      'SELECT * FROM cost_entries WHERE user_id = ? AND type = ? ORDER BY date DESC',
      [decoded.userId, 'income']
    )

    const expenseTransactions = await query(
      'SELECT * FROM cost_entries WHERE user_id = ? AND type = ? ORDER BY date DESC',
      [decoded.userId, 'expense']
    )

    return NextResponse.json({
      userId: decoded.userId,
      allTransactions: allTransactions || [],
      incomeTransactions: incomeTransactions || [],
      expenseTransactions: expenseTransactions || [],
      counts: {
        total: allTransactions?.length || 0,
        income: incomeTransactions?.length || 0,
        expense: expenseTransactions?.length || 0
      }
    })

  } catch (error) {
    console.error('Debug transactions error:', error)
    return NextResponse.json({ 
      message: 'Failed to debug transactions' 
    }, { status: 500 })
  }
}
