'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Pencil, Trash2, CalendarDays, Flag, Paperclip, History } from 'lucide-react'
import TaskHistoryModal from './task-history-modal'

interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  createdAt: string
  attachments?: { id: string; filename: string; url: string }[]
  user?: { name: string | null; email: string }
}

interface TaskCardProps {
  task: Task
  index: number
  readOnly?: boolean
  onComplete: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: '✓ Collected',
}

const PRIORITY_COLORS = {
  LOW: 'var(--priority-low)',
  MEDIUM: 'var(--priority-medium)',
  HIGH: 'var(--priority-high)',
}

const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

function isOverdue(dueDate?: string) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date() 
}

export default function TaskCard({ task, index, readOnly = false, onComplete, onEdit, onDelete }: TaskCardProps) {
  const completed = task.status === 'COMPLETED'
  const overdue = !completed && isOverdue(task.dueDate)
  const [showHistory, setShowHistory] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: completed ? 0.65 : 1, y: 0 }}
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.04, layout: { duration: 0.25 } }}
      className="surface-card"
      style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
        opacity: completed ? 0.65 : 1,
      }}
    >
      {/* Complete Checkbox */}
      <motion.button
        id={`complete-${task.id}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
        onClick={() => !completed && !readOnly && onComplete(task.id)}
        aria-label={completed ? 'Task completed' : 'Mark as complete'}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: `2px solid ${completed ? 'var(--accent-success)' : 'var(--border-strong)'}`,
          background: completed ? 'var(--accent-success)' : 'transparent',
          cursor: (completed || readOnly) ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
          transition: 'all var(--transition-fast)',
        }}
      >
        {completed && <Check size={13} color="#fff" strokeWidth={3} />}
      </motion.button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            textDecoration: completed ? 'line-through' : 'none',
            lineHeight: 1.4,
          }}>
            {task.title}
          </h3>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
            <span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}>
              {STATUS_LABELS[task.status]}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: `${PRIORITY_COLORS[task.priority]}18`,
              color: PRIORITY_COLORS[task.priority],
              border: `1px solid ${PRIORITY_COLORS[task.priority]}30`,
            }}>
              <Flag size={9} />
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </div>

        {task.description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
            {task.description}
          </p>
        )}

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            {task.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '0.72rem', fontWeight: 500, color: 'var(--accent-primary)',
                  background: 'rgba(45,138,45,0.08)',
                  padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none', border: '1px solid rgba(45,138,45,0.1)'
                }}
              >
                <Paperclip size={10} />
                {att.filename}
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
          {task.dueDate && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.76rem',
              color: overdue ? 'var(--accent-danger)' : 'var(--text-muted)',
              fontWeight: overdue ? 600 : 400,
            }}>
              <CalendarDays size={12} />
              {overdue && '⚠️ '}
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {overdue && ' · Not every acorn is collected on time. 🌱'}
            </span>
          )}

          {/* Action buttons - hidden for admins in read-only view */}
          <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
            {!readOnly && (
              <>
                <motion.button
                  id={`history-${task.id}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowHistory(true)}
                  aria-label="View history"
                  className="btn btn-ghost"
                  style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}
                >
                  <History size={12} />
                  History
                </motion.button>
                {!completed && (
                  <motion.button
                    id={`edit-${task.id}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEdit(task)}
                    aria-label="Edit task"
                    className="btn btn-ghost"
                    style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}
                  >
                    <Pencil size={12} />
                    Edit
                  </motion.button>
                )}
                <motion.button
                  id={`delete-${task.id}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(task.id)}
                  aria-label="Delete task"
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}
                >
                  <Trash2 size={12} />
                  Remove
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <TaskHistoryModal
            taskId={task.id}
            taskTitle={task.title}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
