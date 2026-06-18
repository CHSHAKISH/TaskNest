'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, CheckSquare, Clock, Flame, Activity, Shield, TreePine, ChevronRight } from 'lucide-react'
import Navbar from '@/components/layout/navbar'

interface AdminStats {
  stats: {
    totalUsers: number
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    inProgressTasks: number
    completionRate: number
  }
  recentActivity: {
    id: string
    action: string
    entityType: string
    details: string
    createdAt: string
    user: { name: string | null; email: string }
  }[]
  users: {
    id: string
    name: string | null
    email: string
    role: string
    taskCount: number
    createdAt: string
  }[]
}

const ACTION_EMOJI: Record<string, string> = {
  CREATED_TASK: '🌰',
  UPDATED_TASK: '✏️',
  DELETED_TASK: '🍃',
  COMPLETED_TASK: '🎉',
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card"
      style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}
    >
      <div style={{
        width: '44px', height: '44px',
        borderRadius: 'var(--radius-md)',
        background: `${color}15`,
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '2px' }}>{label}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, color: 'var(--text-primary)' }}>{value}</p>
        {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</p>}
      </div>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/nest')
      return
    }

    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <motion.div style={{ fontSize: '3rem' }} animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🌰</motion.div>
          <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>🐿️ Oakley is compiling the forest report...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { stats, recentActivity, users } = data

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, rgba(45,138,45,0.05) 0%, transparent 40%), var(--background)' }}>
      <Navbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Shield size={20} color="var(--accent-primary)" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.03em' }}>
              Forest HQ
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Admin-only view of your entire productivity forest 🌳
          </p>
        </motion.div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard icon={<Users size={20} />} label="Total Squirrels" value={stats.totalUsers} sub="All registered users" color="var(--accent-primary)" />
          <StatCard icon={<TreePine size={20} />} label="Total Acorns" value={stats.totalTasks} sub="Platform-wide tasks" color="var(--accent-success)" />
          <StatCard icon={<CheckSquare size={20} />} label="Collected" value={stats.completedTasks} sub="Completed acorns" color="#22c55e" />
          <StatCard icon={<Flame size={20} />} label="In Progress" value={stats.inProgressTasks} sub="Growing right now" color="var(--accent-warning)" />
          <StatCard icon={<Clock size={20} />} label="Pending" value={stats.pendingTasks} sub="Waiting to be gathered" color="var(--priority-low)" />
          <StatCard icon={<Activity size={20} />} label="Completion Rate" value={`${stats.completionRate}%`} sub="Of all tasks done" color="#8b5cf6" />
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="surface-card"
            style={{ padding: '24px', gridColumn: 'span 1' }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--accent-primary)" />
              Live Activity Feed
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
              {recentActivity.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>🌱 No activity yet</p>
              ) : recentActivity.map((log) => (
                <div key={log.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-hover)',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                    {ACTION_EMOJI[log.action] || '📝'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {log.user.name || log.user.email} · {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="surface-card"
            style={{ padding: '24px' }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} color="var(--accent-primary)" />
              Squirrels ({users.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-hover)',
                    gap: '12px',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || 'Unnamed Squirrel'}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                      {user.email}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.7rem', padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: user.role === 'ADMIN' ? 'rgba(139,105,20,0.15)' : 'rgba(45,138,45,0.1)',
                      color: user.role === 'ADMIN' ? 'var(--accent-primary)' : 'var(--accent-success)',
                      fontWeight: 600,
                    }}>
                      {user.role}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>
                      🌰 {user.taskCount}
                    </span>
                    <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: '4px' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="surface-card"
          style={{ padding: '24px', marginTop: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
              🌳 Forest Completion Progress
            </h2>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
              {stats.completionRate}%
            </span>
          </div>
          <div style={{ height: '12px', background: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionRate}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              style={{
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(90deg, var(--accent-success), var(--accent-primary))',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>🌱 {stats.pendingTasks} pending</span>
            <span>🌿 {stats.inProgressTasks} in progress</span>
            <span>🌳 {stats.completedTasks} completed</span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
