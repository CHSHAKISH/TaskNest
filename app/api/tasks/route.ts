import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createTaskSchema } from '@/lib/validations/task'
import { logActivity } from '@/lib/activity-logger'
import { broadcastToUser } from '@/app/api/sse/route'

export async function POST(req: Request) {
  try {
    // 1. Verify User is Logged In
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // 2. Validate input using Zod
    const result = createTaskSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ message: 'Invalid data', errors: result.error.errors }, { status: 400 })
    }

    const { title, description, status, priority, dueDate, projectId } = result.data

    // 3. Create the Task in PostgreSQL
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        userId: session.user.id,
      },
    })

    // 4. Log the activity and broadcast the real-time update
    await logActivity(session.user.id, 'CREATED_TASK', 'TASK', task.id, `Created acorn: ${task.title}`)
    broadcastToUser(session.user.id, 'TASK_CREATED', task)

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Task Creation Error:', error)
    return NextResponse.json({ message: 'Failed to create task' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Handle Query Parameters for Filtering, Pagination, and Sorting
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'createdAt'   // createdAt | dueDate | priority
    const sortDir = searchParams.get('sortDir') || 'desc'       // asc | desc
    const adminView = searchParams.get('adminView') === 'true' && session.user.role === 'ADMIN'

    // Build the query "where" clause safely
    const whereClause: any = adminView
      ? {}  // Admin sees all tasks
      : { userId: session.user.id }  // Users only see their own

    if (status) whereClause.status = status
    if (priority) whereClause.priority = priority
    if (search) {
      whereClause.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Build the sort/order clause
    let orderBy: any = { createdAt: sortDir }
    if (sortBy === 'dueDate') orderBy = { dueDate: sortDir }
    if (sortBy === 'priority') {
      // Map enum priority to a custom sort via raw field ordering
      orderBy = [
        { priority: sortDir === 'desc' ? 'desc' : 'asc' },
        { createdAt: 'desc' },
      ]
    }

    // Fetch tasks + total count for pagination
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          attachments: true,
          user: adminView ? { select: { name: true, email: true } } : false,
        },
      }),
      prisma.task.count({ where: whereClause }),
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Task Fetch Error:', error)
    return NextResponse.json({ message: 'Failed to fetch tasks' }, { status: 500 })
  }
}
