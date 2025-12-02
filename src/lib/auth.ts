import CredentialsProvider from 'next-auth/providers/credentials';
import type { AuthOptions } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        console.log('[AUTH] Attempting login for:', credentials.email);

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          console.log('[AUTH] User found:', user ? 'yes' : 'no');

          if (!user) {
            console.log('[AUTH] User not found in database');
            return null;
          }

          // Als user geen password heeft (zoals default-uploader), check environment variables
          if (!user.password) {
            console.log('[AUTH] User has no password, checking env variables');
            // Fallback voor users zonder wachtwoord in database
            const envEmail = process.env.ANISSA_EMAIL || 'anissa@example.com';
            const envPassword = process.env.ANISSA_PASSWORD || 'anissa123';
            const reviewerEmail = process.env.REVIEWER_EMAIL || 'reviewer@example.com';
            const reviewerPassword = process.env.REVIEWER_PASSWORD || 'reviewer123';

            if (
              (credentials.email === envEmail && credentials.password === envPassword) ||
              (credentials.email === reviewerEmail && credentials.password === reviewerPassword)
            ) {
              console.log('[AUTH] Env variable match successful');
              return {
                id: user.id,
                name: user.name || user.email,
                email: user.email,
                role: user.role,
              };
            }
            console.log('[AUTH] Env variable match failed');
            return null;
          }

          console.log('[AUTH] Checking hashed password');
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log('[AUTH] Password invalid');
            return null;
          }

          console.log('[AUTH] Login successful');
          return {
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error('[AUTH] Error during authorization:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
