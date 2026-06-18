'use client'

import { useEffect, useRef, useCallback } from 'react'

type SSEEvent = {
  type: string
  payload?: unknown
  message?: string
}

type SSEHandlers = {
  onTaskCreated?: (task: unknown) => void
  onTaskUpdated?: (task: unknown) => void
  onTaskDeleted?: (data: { id: string }) => void
  onConnected?: () => void
}

/**
 * Custom hook that opens a persistent SSE connection to /api/sse
 * and fires the appropriate handlers for each event type.
 */
export function useSSE(handlers: SSEHandlers) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const handlersRef = useRef(handlers)

  // Keep handlers ref fresh without re-creating the EventSource
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  const connect = useCallback(() => {
    if (eventSourceRef.current) return // already connected

    const es = new EventSource('/api/sse')
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data)
        const h = handlersRef.current

        switch (data.type) {
          case 'connected':
            h.onConnected?.()
            break
          case 'TASK_CREATED':
            h.onTaskCreated?.(data.payload)
            break
          case 'TASK_UPDATED':
            h.onTaskUpdated?.(data.payload)
            break
          case 'TASK_DELETED':
            h.onTaskDeleted?.(data.payload as { id: string })
            break
        }
      } catch {
        // ignore malformed messages
      }
    }

    es.onerror = () => {
      // Auto-reconnect after 3 seconds on connection drop
      es.close()
      eventSourceRef.current = null
      setTimeout(connect, 3000)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
    }
  }, [connect])
}
