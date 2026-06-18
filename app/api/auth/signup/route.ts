import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    // 1. Validate input
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 })
    }

    // 3. Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10)

    // 4. Create the new user in the database
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
      },
    })

    // Return success without sending the password back
    return NextResponse.json(
      { message: 'User created successfully', user: { id: newUser.id, email: newUser.email } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup Error:', error)
    return NextResponse.json({ message: 'An error occurred during signup' }, { status: 500 })
  }
}
