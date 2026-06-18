import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  // Only Admins can access this endpoint
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 })
  }

  // Fetch platform-wide stats in one parallel swoop
  const [
    totalUsers,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    recentActivity,
    usersWithTaskCounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.task.count(),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count({ where: { status: 'PENDING' } }),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      include: {
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({
    stats: {
      totalUsers,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    recentActivity,
    users: usersWithTaskCounts.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      taskCount: u._count.tasks,
      createdAt: u.createdAt,
    })),
  })
}
