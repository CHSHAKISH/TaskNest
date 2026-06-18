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

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const connect = () => {
      if (eventSourceRef.current) return

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
          // ignore
        }
      }

      es.onerror = () => {
        es.close()
        eventSourceRef.current = null
        timeoutId = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      clearTimeout(timeoutId)
      eventSourceRef.current?.close()
      eventSourceRef.current = null
    }
  }, [])
}
