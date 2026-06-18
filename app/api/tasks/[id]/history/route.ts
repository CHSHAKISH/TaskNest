import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify task ownership or admin status
    const task = await prisma.task.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    if (task.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Fetch history
    const history = await prisma.activityLog.findMany({
      where: {
        entityType: 'TASK',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching task history:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
