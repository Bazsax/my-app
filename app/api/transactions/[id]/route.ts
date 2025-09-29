import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: transactionId } = await params
    const body = await request.json()

    const {
      title,
      amount,
      description,
      category,
      subcategory,
      type,
      transactionType,
      frequency,
      startDate,
      endDate,
      date,
      time
    } = body

    // Validate required fields
    if (!title || !amount) {
      return NextResponse.json({ 
        message: 'Title and amount are required' 
      }, { status: 400 })
    }

    // Check if transaction exists
    const existingTransaction = await query(
      'SELECT * FROM cost_entries WHERE id = ? AND user_id = ?',
      [transactionId, decoded.userId]
    )

    if (!existingTransaction || existingTransaction.length === 0) {
      return NextResponse.json({ 
        message: 'Transaction not found' 
      }, { status: 404 })
    }

    // Update transaction
    const updateQuery = `
      UPDATE cost_entries 
      SET title = ?, amount = ?, description = ?, category = ?, subcategory = ?,
          type = ?, transaction_type = ?, frequency = ?, start_date = ?, end_date = ?, 
          date = ?, time = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `

    const result = await query(updateQuery, [
      title,
      amount,
      description || null,
      category,
      subcategory || null,
      type,
      transactionType,
      frequency || null,
      startDate || null,
      endDate || null,
      date || new Date().toISOString().split('T')[0],
      time || null,
      transactionId,
      decoded.userId
    ]) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        message: 'Failed to update transaction' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Transaction updated successfully',
      transactionId: transactionId
    })

  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json({ 
      message: 'Failed to update transaction' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: transactionId } = await params

    // Check if transaction exists
    const existingTransaction = await query(
      'SELECT * FROM cost_entries WHERE id = ? AND user_id = ?',
      [transactionId, decoded.userId]
    )

    if (!existingTransaction || existingTransaction.length === 0) {
      return NextResponse.json({ 
        message: 'Transaction not found' 
      }, { status: 404 })
    }

    // Delete transaction
    const result = await query(
      'DELETE FROM cost_entries WHERE id = ? AND user_id = ?',
      [transactionId, decoded.userId]
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        message: 'Failed to delete transaction' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Transaction deleted successfully'
    })

  } catch (error) {
    console.error('Delete transaction error:', error)
    return NextResponse.json({ 
      message: 'Failed to delete transaction' 
    }, { status: 500 })
  }
}
