import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import clientPromise from '../../../lib/mongodb';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'E-Mail & Passwort',
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const email = String(credentials.email).toLowerCase().trim();

          const client = await clientPromise;
          const db = client.db('training');
          const user = await db.collection('users').findOne({ email });
          if (!user || !user.passwordHash) {
            console.warn('[auth] no user / no password hash for', email);
            return null;
          }

          const valid = await bcrypt.compare(String(credentials.password), user.passwordHash);
          if (!valid) {
            console.warn('[auth] wrong password for', email);
            return null;
          }

          return { id: user._id.toString(), email: user.email, name: user.name || user.email };
        } catch (err) {
          console.error('[auth] authorize failed:', err);
          throw new Error(`Auth-Serverfehler: ${err?.message || 'unbekannt'}`);
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  logger: {
    error(code, metadata) { console.error('[next-auth][error]', code, metadata); },
    warn(code) { console.warn('[next-auth][warn]', code); },
    debug(code, metadata) { console.log('[next-auth][debug]', code, metadata); },
  },
};

export default NextAuth(authOptions);
