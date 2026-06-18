import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateTaskSchema } from '@/lib/validations/task'
import { logActivity } from '@/lib/activity-logger'
import { broadcastToUser } from '@/app/api/sse/route'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const task = await prisma.task.findUnique({
      where: { id },
      include: { attachments: true },
    })

    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const existingTask = await prisma.task.findUnique({ where: { id } })
    if (!existingTask || existingTask.userId !== session.user.id) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const body = await req.json()
    const result = updateTaskSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ message: 'Invalid data', errors: result.error.errors }, { status: 400 })
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...result.data,
        dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
      },
    })

    // Generate detailed change log
    const changes: string[] = []
    if (existingTask.title !== updatedTask.title) changes.push('Updated title')
    if (existingTask.status !== updatedTask.status) changes.push(`Status: ${existingTask.status} → ${updatedTask.status}`)
    if (existingTask.priority !== updatedTask.priority) changes.push(`Priority: ${existingTask.priority} → ${updatedTask.priority}`)
    
    let details = changes.length > 0 ? changes.join(' | ') : 'Updated acorn details'
    if (result.data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      details = '🎉 Completed acorn'
    }

    // Log Activity and broadcast real-time
    await logActivity(session.user.id, 'UPDATED_TASK', 'TASK', updatedTask.id, details)
    broadcastToUser(session.user.id, 'TASK_UPDATED', updatedTask)

    return NextResponse.json(updatedTask)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const existingTask = await prisma.task.findUnique({ where: { id } })
    if (!existingTask || existingTask.userId !== session.user.id) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id },
    })

    // Log Activity and broadcast real-time
    await logActivity(session.user.id, 'DELETED_TASK', 'TASK', existingTask.id, `Removed acorn: ${existingTask.title}`)
    broadcastToUser(session.user.id, 'TASK_DELETED', { id })

    return NextResponse.json({ message: 'Task deleted' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete task' }, { status: 500 })
  }
}
