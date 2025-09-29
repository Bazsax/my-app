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
    
    console.log(`Chart API: Received dates - startDate: ${startDate}, endDate: ${endDate}`)

    // Default to last 90 days if no date range provided
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
    } else {
      // Default to last 90 days
      const defaultStartDate = new Date()
      defaultStartDate.setDate(defaultStartDate.getDate() - 90)
      dateFilter = ' AND date >= ?'
      params.push(defaultStartDate.toISOString().split('T')[0])
    }

    // Get daily aggregated data
    console.log(`Chart API: Fetching data for userId: ${decoded.userId}`)
    console.log(`Chart API: Date filter: ${dateFilter}`)
    console.log(`Chart API: Params:`, params)
    console.log(`Chart API: Token decoded:`, decoded)

    const chartData = await query(
      `SELECT 
        date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
       FROM cost_entries 
       WHERE user_id = ?${dateFilter}
       GROUP BY date 
       ORDER BY date ASC`,
      params
    )

    console.log("Chart API: Raw query result:", chartData)

    // Fill in missing dates with 0 values
    const result = []
    const chartDataArray = chartData as any[]
    if (chartDataArray && chartDataArray.length > 0) {
      const dataMap = new Map()
      
      // Create a map of existing data
      chartDataArray.forEach((item: any) => {
        // Convert date to YYYY-MM-DD format for consistent comparison
        // Handle timezone issues by using the date as stored in the database
        const dateStr = item.date instanceof Date 
          ? item.date.toISOString().split('T')[0]
          : new Date(item.date).toISOString().split('T')[0]
        
        // Also check if this data should be mapped to the requested date range
        // If the stored date is one day earlier due to timezone, map it to the requested date
        const requestedStart = startDate ? new Date(startDate) : null
        const requestedEnd = endDate ? new Date(endDate) : null
        const storedDate = new Date(dateStr)
        
        let finalDateStr = dateStr
        if (requestedStart && requestedEnd && requestedStart.getTime() === requestedEnd.getTime()) {
          // Single day selection - check if stored date is one day earlier
          const dayBefore = new Date(requestedStart)
          dayBefore.setDate(dayBefore.getDate() - 1)
          if (storedDate.getTime() === dayBefore.getTime()) {
            finalDateStr = requestedStart.toISOString().split('T')[0]
            console.log(`Chart API: Mapping timezone-adjusted date ${dateStr} to ${finalDateStr}`)
          }
        }
        
        dataMap.set(finalDateStr, {
          income: parseFloat(item.income) || 0,
          expenses: parseFloat(item.expenses) || 0
        })
        console.log(`Chart API: Mapped data for date ${finalDateStr}: income=${item.income}, expenses=${item.expenses}`)
      })

      // Determine date range
      const start = startDate ? new Date(startDate) : new Date(chartDataArray[0].date)
      const end = endDate ? new Date(endDate) : new Date()
      
      // Fill in all dates in range
      const currentDate = new Date(start)
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const existingData = dataMap.get(dateStr)
        
        // Use existing data if available, otherwise use 0
        const finalData = existingData
        
        result.push({
          date: dateStr,
          income: finalData ? finalData.income : 0,
          expenses: finalData ? finalData.expenses : 0
        })
        
        console.log(`Chart API: Added data point for ${dateStr}: income=${finalData ? finalData.income : 0}, expenses=${finalData ? finalData.expenses : 0}`)
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else if (startDate && endDate) {
      // Handle case where no data exists but date range is provided
      // This ensures single day selections show at least one data point
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      console.log(`Chart API: No data found, creating zero-filled data for range ${startDate} to ${endDate}`)
      
      const currentDate = new Date(start)
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0]
        
        result.push({
          date: dateStr,
          income: 0,
          expenses: 0
        })
        
        console.log(`Chart API: Added zero data point for ${dateStr}`)
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    console.log("Chart API: Final result:", result)

    return NextResponse.json({ 
      chartData: result,
      count: result.length
    })

  } catch (error) {
    console.error('Get chart data error:', error)
    return NextResponse.json({ 
      message: 'Failed to fetch chart data' 
    }, { status: 500 })
  }
}
