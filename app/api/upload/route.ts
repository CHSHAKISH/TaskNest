import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const taskId = formData.get('taskId') as string | null

    if (!file || !taskId) {
      return NextResponse.json({ message: 'File and taskId are required' }, { status: 400 })
    }

    // Verify the task belongs to this user
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ message: 'File too large. Max size is 5MB.' }, { status: 400 })
    }

    // Sanitize filename and make it unique
    const ext = path.extname(file.name)
    const baseName = path.basename(file.name, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const uniqueName = `${baseName}_${Date.now()}${ext}`

    // Save to public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, uniqueName)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Save to database
    const attachment = await prisma.taskAttachment.create({
      data: {
        filename: file.name,
        url: `/uploads/${uniqueName}`,
        taskId,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: 'Failed to upload file' }, { status: 500 })
  }
}
