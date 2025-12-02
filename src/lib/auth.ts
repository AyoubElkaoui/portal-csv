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
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            return null;
          }

          // Als user geen password heeft (zoals default-uploader), check environment variables
          if (!user.password) {
            // Fallback voor users zonder wachtwoord in database
            const envEmail = process.env.ANISSA_EMAIL || 'anissa@example.com';
            const envPassword = process.env.ANISSA_PASSWORD || 'anissa123';
            const reviewerEmail = process.env.REVIEWER_EMAIL || 'reviewer@example.com';
            const reviewerPassword = process.env.REVIEWER_PASSWORD || 'reviewer123';

            if (
              (credentials.email === envEmail && credentials.password === envPassword) ||
              (credentials.email === reviewerEmail && credentials.password === reviewerPassword)
            ) {
              return {
                id: user.id,
                name: user.name || user.email,
                email: user.email,
                role: user.role,
              };
            }
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
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
