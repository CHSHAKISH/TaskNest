'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Loader2 } from 'lucide-react'
import Navbar from '@/components/layout/navbar'
import TaskCard from '@/components/tasks/task-card'
import TaskFormModal from '@/components/tasks/task-form-modal'
import EmptyNest from '@/components/tasks/empty-nest'
import { useSSE } from '@/lib/hooks/use-sse'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  createdAt: string
}

const LOADING_MESSAGES = [
  '🐿️ Gathering your acorns...',
  '🌰 Sorting today\'s priorities...',
  '🌳 Growing your productivity forest...',
  '🐿️ Finding the next best task...',
]

export default function NestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMsg] = useState(() => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)])
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)

    const res = await fetch(`/api/tasks?${params.toString()}`)
    const data = await res.json()
    setTasks(data.tasks || [])
    setLoading(false)
  }, [search, statusFilter, priorityFilter])

  useEffect(() => {
    if (status === 'authenticated') {
      const timer = setTimeout(fetchTasks, 300) // Debounce search
      return () => clearTimeout(timer)
    }
  }, [status, fetchTasks])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // SSE: Real-time task updates from the server
  useSSE({
    onTaskCreated: (task) => {
      setTasks(prev => {
        if (prev.some(t => t.id === (task as Task).id)) return prev
        return [task as Task, ...prev]
      })
    },
    onTaskUpdated: (task) => {
      setTasks(prev => prev.map(t => t.id === (task as Task).id ? task as Task : t))
    },
    onTaskDeleted: ({ id }) => {
      setTasks(prev => prev.filter(t => t.id !== id))
    },
  })

  // OPTIMISTIC UI: Complete a task instantly
  const handleComplete = async (taskId: string) => {
    const originalTasks = [...tasks]

    // Optimistically update UI first
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' as const } : t))

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })

    if (!res.ok) {
      // Rollback on failure
      setTasks(originalTasks)
      showToast('🌰 Progress paused, not lost. Please try again.', 'error')
    } else {
      showToast('🎉 Acorn collected! Your forest just got bigger.')
    }
  }

  // OPTIMISTIC UI: Delete a task instantly
  const handleDelete = async (taskId: string) => {
    const originalTasks = [...tasks]

    // Optimistically remove from UI first
    setTasks(prev => prev.filter(t => t.id !== taskId))

    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })

    if (!res.ok) {
      // Rollback on failure
      setTasks(originalTasks)
      showToast('Failed to remove task. 🐿️ Let\'s try again.', 'error')
    } else {
      showToast('🍃 Clearing some space in the nest.')
    }
  }

  const handleTaskSaved = () => {
    setShowModal(false)
    setEditingTask(null)
    fetchTasks()
    showToast('🌰 Acorn added to your nest.')
  }

  if (status === 'loading') return null

  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top left, rgba(45, 138, 45, 0.05) 0%, transparent 40%), radial-gradient(ellipse at bottom right, rgba(139, 105, 20, 0.05) 0%, transparent 40%), var(--background)' }}>
      <Navbar />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>
                Your Nest 🌰
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {session?.user?.name ? `Welcome back, ${session.user.name}!` : 'Welcome back!'}{' '}
                {completedCount > 0 && `🏆 ${completedCount} acorn${completedCount > 1 ? 's' : ''} collected today.`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {session?.user?.role === 'ADMIN' && (
                <Link href="/admin" style={{ textDecoration: 'none' }}>
                  <motion.span
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.82rem', padding: '9px 16px' }}
                  >
                    🌳 Forest HQ
                  </motion.span>
                </Link>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setEditingTask(null); setShowModal(true) }}
                className="btn btn-primary btn-glow"
                style={{ gap: '8px', padding: '12px 20px' }}
              >
                <Plus size={16} />
                Gather Acorn
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="task-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search acorns..."
              className="input"
              style={{ paddingLeft: '38px' }}
            />
          </div>

          {/* Status filter */}
          <div style={{ position: 'relative' }}>
            <Filter size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
              style={{ paddingLeft: '30px', paddingRight: '12px', width: 'auto', cursor: 'pointer' }}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Priority filter */}
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input"
            style={{ paddingLeft: '12px', paddingRight: '12px', width: 'auto', cursor: 'pointer' }}
          >
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </motion.div>

        {/* Task list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
              <Loader2 size={32} color="var(--accent-primary)" />
            </motion.div>
            <p style={{ color: 'var(--text-muted)', marginTop: '16px', fontSize: '0.9rem' }}>{loadingMsg}</p>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyNest onGatherAcorn={() => setShowModal(true)} />
        ) : (
          <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence mode="popLayout">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onComplete={handleComplete}
                  onEdit={(t) => { setEditingTask(t); setShowModal(true) }}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Task Form Modal */}
      <AnimatePresence>
        {showModal && (
          <TaskFormModal
            task={editingTask}
            onClose={() => { setShowModal(false); setEditingTask(null) }}
            onSaved={handleTaskSaved}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              bottom: '32px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: toast.type === 'success' ? 'var(--accent-primary)' : '#dc2626',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              whiteSpace: 'nowrap',
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
