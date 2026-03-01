import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { clientPromise } from "@/lib/db/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB || "alaire",
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
})
