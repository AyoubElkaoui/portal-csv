import CredentialsProvider from 'next-auth/providers/credentials';
import { AuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from './storage';

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
        
        const user = await getUserByEmail(credentials.email);
        if (!user) return null;

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) return null;

        return { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        } as any;
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
