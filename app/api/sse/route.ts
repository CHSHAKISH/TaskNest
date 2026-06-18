import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Global store for SSE connections - maps userId to their response controllers
export const sseClients = new Map<string, ReadableStreamDefaultController>()

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Create a new SSE stream for this user
  const stream = new ReadableStream({
    start(controller) {
      // Register this client
      sseClients.set(userId, controller)

      // Send an initial heartbeat so the connection is confirmed
      const heartbeat = `data: ${JSON.stringify({ type: 'connected', message: '🐿️ Oakley is watching for real-time updates!' })}\n\n`
      controller.enqueue(new TextEncoder().encode(heartbeat))

      // Send a keepalive ping every 25 seconds to prevent connection timeouts
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': ping\n\n'))
        } catch {
          clearInterval(pingInterval)
        }
      }, 25000)

      // Clean up when connection closes
      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval)
        sseClients.delete(userId)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  // SSE requires specific headers to keep the connection alive
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

/**
 * Helper: Broadcast a task event to a specific user's SSE stream.
 * Called by task API routes whenever a task is created/updated/deleted.
 */
export function broadcastToUser(userId: string, eventType: string, payload: unknown) {
  const controller = sseClients.get(userId)
  if (controller) {
    try {
      const message = `data: ${JSON.stringify({ type: eventType, payload })}\n\n`
      controller.enqueue(new TextEncoder().encode(message))
    } catch {
      // Client disconnected; remove stale reference
      sseClients.delete(userId)
    }
  }
}
