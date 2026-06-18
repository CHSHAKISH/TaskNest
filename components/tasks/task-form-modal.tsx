'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, CalendarDays, Flag, AlignLeft } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  createdAt: string
}

interface TaskFormModalProps {
  task: Task | null
  onClose: () => void
  onSaved: () => void
}

export default function TaskFormModal({ task, onClose, onSaved }: TaskFormModalProps) {
  const isEditing = !!task

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState<string>(task?.status || 'PENDING')
  const [priority, setPriority] = useState<string>(task?.priority || 'MEDIUM')
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Please give your acorn a name.'); return }
    setLoading(true)
    setError('')

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    }

    const url = isEditing ? `/api/tasks/${task.id}` : '/api/tasks'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) {
      setError('🌰 Something went wrong. Please try again.')
    } else {
      onSaved()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 61,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          pointerEvents: 'none',
        }}
      >
        <div
          className="surface-card"
          style={{
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            pointerEvents: 'auto',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
                {isEditing ? '🐿️ Fine-tuning your plan.' : '🌰 Gather a new Acorn'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                {isEditing ? 'Smart adjustments lead to better results.' : 'Add your first task and start growing your forest.'}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: '32px', height: '32px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Title */}
            <div>
              <label htmlFor="task-title" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Acorn Name *
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="input"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-desc" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><AlignLeft size={12} /> Details (optional)</span>
              </label>
              <textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any notes for Oakley..."
                rows={3}
                className="input"
                style={{ resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            {/* Priority & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="task-priority" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Flag size={12} /> Priority</span>
                </label>
                <select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="input" style={{ cursor: 'pointer' }}>
                  <option value="LOW">🔵 Low</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="HIGH">🔴 High</option>
                </select>
              </div>

              <div>
                <label htmlFor="task-status" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Status
                </label>
                <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value)} className="input" style={{ cursor: 'pointer' }}>
                  <option value="PENDING">🌱 Pending</option>
                  <option value="IN_PROGRESS">🌿 In Progress</option>
                  <option value="COMPLETED">🌳 Completed</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="task-due" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CalendarDays size={12} /> Due Date (optional)</span>
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </div>

            {/* Error */}
            {error && (
              <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className="btn btn-primary"
                style={{ flex: 2 }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : isEditing ? '🌰 Update Acorn' : '🌱 Gather Acorn'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}
