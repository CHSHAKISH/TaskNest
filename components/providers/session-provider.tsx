'use client'

import { SessionProvider } from 'next-auth/react'

// In Next.js App Router, global context providers must be marked as 'use client'
// We wrap the NextAuth SessionProvider so we can use it in our root layout (which is a server component)
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
