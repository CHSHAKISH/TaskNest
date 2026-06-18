'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, Filter, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react'
import Navbar from '@/components/layout/navbar'
import TaskCard from '@/components/tasks/task-card'
import TaskFormModal from '@/components/tasks/task-form-modal'
import { useSSE } from '@/lib/hooks/use-sse'

interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  createdAt: string
  attachments?: { id: string; filename: string; url: string }[]
}

interface UserDetails {
  id: string
  name: string | null
  email: string
}

export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const userId = unwrappedParams.id

  const { data: session, status } = useSession()
  const router = useRouter()

  const [user, setUser] = useState<UserDetails | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState('Fetching acorns...')

  // Filter & Sort State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Edit Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/nest')
    }
  }, [session, status, router])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (statusFilter) p.set('status', statusFilter)
    if (priorityFilter) p.set('priority', priorityFilter)
    p.set('sortBy', sortBy)
    p.set('sortDir', sortDir)
    p.set('page', String(page))
    p.set('limit', '8')
    p.set('adminView', 'true') // Allow viewing other user's tasks
    p.set('targetUserId', userId) // Custom param just for this page

    const res = await fetch(`/api/tasks?${p.toString()}`)
    const data = await res.json()
    
    // Also fetch basic user details (we can extract this from the tasks if we want, or do a separate fetch. For now, assuming the API returns user details or we pull it from tasks)
    setTasks(data.tasks || [])
    if (data.tasks?.[0]?.user) {
      setUser(data.tasks[0].user)
    }
    setTotalPages(data.pagination?.totalPages || 1)
    setLoading(false)
  }, [search, statusFilter, priorityFilter, sortBy, sortDir, page, userId])

  useEffect(() => {
    if (status === 'authenticated') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(1)
      const timer = setTimeout(fetchTasks, 300)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, statusFilter, priorityFilter, sortBy, sortDir])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (status === 'authenticated') fetchTasks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Hook into real-time updates
  useSSE({
    onTaskCreated: fetchTasks,
    onTaskUpdated: fetchTasks,
    onTaskDeleted: fetchTasks,
  })

  // Removed unused handleComplete and handleDelete since admins can't modify user tasks


  if (status === 'loading') return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        
        <button
          onClick={() => router.push('/admin')}
          className="btn btn-ghost"
          style={{ padding: '8px 12px', fontSize: '0.85rem', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={14} /> Back to Forest HQ
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserIcon size={24} color="var(--accent-primary)" />
            {user?.name || 'User'}&apos;s Nest
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {user?.email || 'Viewing their individual acorns'}
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search acorns..."
              className="input"
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Filter size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input" style={{ paddingLeft: '30px', paddingRight: '12px', width: 'auto' }}>
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [by, dir] = e.target.value.split('-')
                setSortBy(by)
                setSortDir(dir)
              }}
              className="input"
              style={{ paddingLeft: '30px', paddingRight: '12px', width: 'auto' }}
            >
              <option value="createdAt-desc">Newest first</option>
              <option value="createdAt-asc">Oldest first</option>
              <option value="dueDate-asc">Due date ↑</option>
              <option value="dueDate-desc">Due date ↓</option>
              <option value="priority-desc">Priority (High→Low)</option>
              <option value="priority-asc">Priority (Low→High)</option>
            </select>
          </div>
        </motion.div>

        {/* Task list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
              <Loader2 size={32} color="var(--accent-primary)" />
            </motion.div>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No acorns found for this user.</p>
          </div>
        ) : (
          <>
            <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence mode="popLayout">
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    readOnly={true}
                    onComplete={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '28px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost" style={{ padding: '8px 14px', opacity: page === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={15} /> Prev
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost" style={{ padding: '8px 14px', opacity: page === totalPages ? 0.4 : 1 }}>
                  Next <ChevronRight size={15} />
                </button>
              </motion.div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {showModal && (
          <TaskFormModal
            task={editingTask}
            onClose={() => { setShowModal(false); setEditingTask(null) }}
            onSaved={() => { setShowModal(false); setEditingTask(null); fetchTasks() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
