import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, { databaseName: 'training' }),
  providers: [
    EmailProvider({
      from: 'training@breitseite.io',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await resend.emails.send({
          from: 'Training App <training@breitseite.io>',
          to: email,
          subject: '🏋️ Login zu deiner Training App',
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #0c0a14; color: #f0eeff; padding: 40px; border-radius: 16px;">
              <h1 style="font-size: 24px; margin-bottom: 8px;">💪 Training App</h1>
              <p style="color: #6b6890; margin-bottom: 32px;">Klick den Button um dich anzumelden.</p>
              <a href="${url}" style="display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px;">
                Jetzt anmelden →
              </a>
              <p style="color: #444; font-size: 12px; margin-top: 24px;">Link ist 24 Stunden gültig. Falls du das nicht angefragt hast, ignoriere diese E-Mail.</p>
            </div>
          `,
        });
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub;
      return session;
    },
  },
};

export default NextAuth(authOptions);
