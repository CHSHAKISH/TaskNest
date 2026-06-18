'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, History, Clock } from 'lucide-react'

interface ActivityLog {
  id: string
  action: string
  details: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
  }
}

interface TaskHistoryModalProps {
  taskId: string
  taskTitle: string
  onClose: () => void
}

export default function TaskHistoryModal({ taskId, taskTitle, onClose }: TaskHistoryModalProps) {
  const [history, setHistory] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/history`)
      .then(res => res.json())
      .then(data => {
        setHistory(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [taskId])

  return (
    <>
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

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 61,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', pointerEvents: 'none',
        }}
      >
        <div
          className="surface-card"
          style={{
            width: '100%', maxWidth: '500px', padding: '24px',
            pointerEvents: 'auto', boxShadow: 'var(--shadow-lg)',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--accent-primary)" /> Acorn History
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {taskTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Timeline */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Loader2 size={24} color="var(--accent-primary)" />
                </motion.div>
              </div>
            ) : history.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '40px 0' }}>No history found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }} />
                
                {history.map((log, index) => (
                  <div key={log.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      width: '34px', height: '34px', borderRadius: '50%', background: 'var(--surface-card)', 
                      border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-primary)', flexShrink: 0
                    }}>
                      <Clock size={14} />
                    </div>
                    <div style={{ flex: 1, background: 'var(--surface-hover)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.details || log.action.replace('_', ' ')}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {log.user.name || log.user.email} • {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
