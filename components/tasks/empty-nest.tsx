'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react'

const EMPTY_MESSAGES = [
  { emoji: '🐿️', text: 'Your nest is empty. Time to gather some acorns.', sub: 'Add your first task and start growing your forest.' },
  { emoji: '🌰', text: 'A fresh nest means endless possibilities.', sub: 'Big goals start with small actions.' },
  { emoji: '🌱', text: 'Every forest starts somewhere.', sub: 'Plant your first acorn today.' },
]

interface EmptyNestProps {
  onGatherAcorn: () => void
}

export default function EmptyNest({ onGatherAcorn }: EmptyNestProps) {
  const [msg, setMsg] = useState(EMPTY_MESSAGES[0])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMsg(EMPTY_MESSAGES[Math.floor(Math.random() * EMPTY_MESSAGES.length)])
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ textAlign: 'center', padding: '80px 24px' }}
    >
      {/* Animated mascot */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: '5rem', marginBottom: '20px', display: 'block', lineHeight: 1 }}
      >
        {msg.emoji}
      </motion.div>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '1.4rem',
        color: 'var(--text-primary)',
        marginBottom: '8px',
        letterSpacing: '-0.02em',
      }}>
        {msg.text}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
        {msg.sub}
      </p>

      {/* Animated tree growth */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '32px' }}>
        {['🌱', '🌿', '🌳'].map((plant, i) => (
          <motion.span
            key={plant}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            style={{ fontSize: '1.5rem' }}
          >
            {plant}
          </motion.span>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onGatherAcorn}
        id="empty-state-gather-btn"
        className="btn btn-primary btn-glow"
        style={{ padding: '13px 28px', fontSize: '0.95rem' }}
      >
        <Plus size={17} />
        Gather First Acorn
      </motion.button>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '20px' }}>
        🌰 Every achievement starts with a single task.
      </p>
    </motion.div>
  )
}
