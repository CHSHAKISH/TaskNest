import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createTaskSchema } from '@/lib/validations/task'
import { logActivity } from '@/lib/activity-logger'

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

    // 4. Log the activity for the Bonus Feature!
    await logActivity(session.user.id, 'CREATED_TASK', 'TASK', task.id, `Created acorn: ${task.title}`)

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

    // Handle Query Parameters for Filtering and Pagination
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build the query "where" clause safely
    const whereClause: any = {
      userId: session.user.id, // ONLY return tasks belonging to this user
    }

    if (status) whereClause.status = status
    if (priority) whereClause.priority = priority
    if (search) {
      whereClause.title = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Fetch tasks + total count for pagination
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
