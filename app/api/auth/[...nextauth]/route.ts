import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// This file catches all requests to /api/auth/* (like /api/auth/signin, /api/auth/session, etc.)
// NextAuth automatically handles the responses based on the configuration we provided.
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
