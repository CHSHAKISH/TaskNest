'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CalendarDays, Flag, AlignLeft, Paperclip, FileText, XCircle, Upload } from 'lucide-react'

interface Attachment {
  id: string
  filename: string
  url: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  createdAt: string
  attachments?: Attachment[]
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

  // File attachment state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>(task?.attachments || [])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max size is 5MB.')
      return
    }
    setSelectedFile(file)
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

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

    if (!res.ok) {
      setLoading(false)
      setError('🌰 Something went wrong. Please try again.')
      return
    }

    const savedTask = await res.json()

    // Upload attachment if a file was selected
    if (selectedFile && savedTask.id) {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('taskId', savedTask.id)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        setError('Task saved, but file upload failed. Please try again.')
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onSaved()
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
          overflowY: 'auto',
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
            maxHeight: '90vh',
            overflowY: 'auto',
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
                min={(() => {
                  const now = new Date()
                  const y = now.getFullYear()
                  const m = String(now.getMonth() + 1).padStart(2, '0')
                  const d = String(now.getDate()).padStart(2, '0')
                  return `${y}-${m}-${d}`
                })()}
                className="input"
              />
            </div>

            {/* File Attachment */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Paperclip size={12} /> Attachment (optional, max 5MB)</span>
              </label>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? 'var(--accent-primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragOver ? 'rgba(45,138,45,0.05)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  ref={fileInputRef}
                  id="task-attachment"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                />
                {selectedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <FileText size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent-danger)', display: 'flex' }}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={18} color="var(--text-muted)" style={{ margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Drag & drop or <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>click to browse</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Existing attachments (on edit) */}
              <AnimatePresence>
                {uploadedAttachments.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {uploadedAttachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-primary)', textDecoration: 'none', padding: '4px 6px', borderRadius: 'var(--radius-sm)', background: 'rgba(45,138,45,0.06)' }}
                      >
                        <FileText size={12} />
                        {att.filename}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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
