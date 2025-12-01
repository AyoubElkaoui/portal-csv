import CredentialsProvider from 'next-auth/providers/credentials';
import { AuthOptions } from 'next-auth';

// Simple in-memory allowed users. Prefer setting via environment variables in production.
const USERS = [
  {
    id: 'anissa',
    name: 'Anissa',
    email: process.env.ANISSA_EMAIL || 'anissa@example.com',
    password: process.env.ANISSA_PASSWORD || 'anissa-password',
    role: 'uploader',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    email: process.env.REVIEWER_EMAIL || 'reviewer@example.com',
    password: process.env.REVIEWER_PASSWORD || 'reviewer-password',
    role: 'reviewer',
  },
];

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const user = USERS.find(u => u.email === credentials.email && u.password === credentials.password);
        if (user) {
          // Return the user object (will be included in the session)
          return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user = session.user || {};
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
};
