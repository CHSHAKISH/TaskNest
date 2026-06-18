import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Users can only see their own activity; Admins see all
  const whereClause = session.user.role === 'ADMIN' ? {} : { userId: session.user.id }

  const logs = await prisma.activityLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  return NextResponse.json(logs)
}
