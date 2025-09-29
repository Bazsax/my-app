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

    // Get query parameters for date range
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    let dateFilter = ''
    let params = [decoded.userId]
    
    if (startDate && endDate) {
      dateFilter = ' AND date BETWEEN ? AND ?'
      params.push(startDate, endDate)
    } else if (startDate) {
      dateFilter = ' AND date >= ?'
      params.push(startDate)
    } else if (endDate) {
      dateFilter = ' AND date <= ?'
      params.push(endDate)
    }

    // Get income total
    const incomeResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM cost_entries 
       WHERE user_id = ? AND type = 'income'${dateFilter}`,
      params
    )

    // Get expense total
    const expenseResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM cost_entries 
       WHERE user_id = ? AND type = 'expense'${dateFilter}`,
      params
    )

    // Get previous period data for comparison (if date range is provided)
    let incomeChange = 0
    let expenseChange = 0

    if (startDate && endDate) {
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      const periodLength = endDateObj.getTime() - startDateObj.getTime()
      
      // Calculate previous period dates
      const prevEndDate = new Date(startDateObj.getTime() - 1)
      const prevStartDate = new Date(prevEndDate.getTime() - periodLength)
      
      const prevIncomeResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM cost_entries 
         WHERE user_id = ? AND type = 'income' AND date BETWEEN ? AND ?`,
        [decoded.userId, prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]
      )

      const prevExpenseResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM cost_entries 
         WHERE user_id = ? AND type = 'expense' AND date BETWEEN ? AND ?`,
        [decoded.userId, prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0]]
      )

      const currentIncome = incomeResult[0]?.total || 0
      const prevIncome = prevIncomeResult[0]?.total || 0
      const currentExpense = expenseResult[0]?.total || 0
      const prevExpense = prevExpenseResult[0]?.total || 0

      incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0
      expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0
    }

    const incomeTotal = incomeResult[0]?.total || 0
    const expenseTotal = expenseResult[0]?.total || 0
    const difference = incomeTotal - expenseTotal

    return NextResponse.json({
      income: {
        total: incomeTotal,
        change: incomeChange
      },
      expense: {
        total: expenseTotal,
        change: expenseChange
      },
      difference: {
        total: difference,
        change: incomeChange - expenseChange // Simplified change calculation
      }
    })

  } catch (error) {
    console.error('Get summary error:', error)
    return NextResponse.json({ 
      message: 'Failed to fetch summary data' 
    }, { status: 500 })
  }
}
