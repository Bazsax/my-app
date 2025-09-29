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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch transactions from cost_entries table
    let sql = 'SELECT * FROM cost_entries WHERE user_id = ?'
    let params = [decoded.userId]

    // Filter by type if provided
    if (type && (type === 'income' || type === 'expense')) {
      sql += ' AND type = ?'
      params.push(type)
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      sql += ' AND date BETWEEN ? AND ?'
      params.push(startDate, endDate)
    } else if (startDate) {
      sql += ' AND date >= ?'
      params.push(startDate)
    } else if (endDate) {
      sql += ' AND date <= ?'
      params.push(endDate)
    }

    sql += ' ORDER BY date DESC'

    const transactions = await query(sql, params)

    return NextResponse.json({ 
      transactions: transactions || [],
      count: transactions?.length || 0
    })

  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ 
      message: 'Failed to fetch transactions' 
    }, { status: 500 })
  }
}
