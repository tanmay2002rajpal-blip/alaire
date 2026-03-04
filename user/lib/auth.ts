import NextAuth from "next-auth"
import { getDb } from "@/lib/db/client"
import Credentials from "next-auth/providers/credentials"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No MongoDBAdapter — Credentials providers require JWT strategy only
  // Adapters conflict with Credentials and prevent sessions from being set
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== "string" || !credentials.email.includes("@")) {
          return null
        }
        
        const email = credentials.email.toLowerCase()
        const otp = credentials.otp as string
        
        const db = await getDb()
        
        const validOtp = await db.collection("otps").findOne({
          email,
          otp,
          expires_at: { $gt: new Date() }
        })
        
        if (!validOtp) return null
        
        await db.collection("otps").deleteOne({ _id: validOtp._id })
        
        let user = await db.collection("users").findOne({ email })
        
        if (!user) {
          const now = new Date()
          const result = await db.collection("users").insertOne({
            email,
            created_at: now,
            updated_at: now,
            role: "customer"
          })
          user = { _id: result.insertedId, email, name: null, image: null } as any
        }
        
        return {
          id: user!._id.toString(),
          email: user!.email,
          name: (user as any).full_name || (user as any).name || null,
          image: (user as any).image || null,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
      }
      return session
    },
  },
})
