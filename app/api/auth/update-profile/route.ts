import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    const { name, email, currentPassword, newPassword } = await request.json()

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

    // Get current user data
    const users = await query(
      'SELECT id, name, email, password FROM users WHERE id = ?',
      [decoded.userId]
    ) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const currentUser = users[0]

    // Check if email is being changed and if it already exists
    if (email !== currentUser.email) {
      const existingUsers = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, currentUser.id]
      ) as any[]

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { message: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // If password is being changed, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Current password is required to change password' },
          { status: 400 }
        )
      }

      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateFields = []
    const updateValues = []

    if (name !== currentUser.name) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }

    if (email !== currentUser.email) {
      updateFields.push('email = ?')
      updateValues.push(email)
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      updateFields.push('password = ?')
      updateValues.push(hashedPassword)
    }

    updateFields.push('updated_at = NOW()')
    updateValues.push(currentUser.id)

    if (updateFields.length === 1) { // Only updated_at
      return NextResponse.json(
        { message: 'No changes to update' },
        { status: 400 }
      )
    }

    // Update user in database
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
    await query(updateQuery, updateValues)

    // Fetch updated user data
    const updatedUsers = await query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [currentUser.id]
    ) as any[]

    const updatedUser = updatedUsers[0]

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
