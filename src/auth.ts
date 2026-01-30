import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Simple in-memory users for demo (in production, use a database)
const users = [
  { id: '1', name: 'Diego', email: 'diego@jarvis.local', password: 'jarvis123' },
  { id: '2', name: 'Jarvis', email: 'jarvis@jarvis.local', password: 'jarvis123' },
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'diego@jarvis.local' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const user = users.find(
          (u) => u.email === credentials?.email && u.password === credentials?.password
        )
        if (user) {
          return { id: user.id, name: user.name, email: user.email }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
})
