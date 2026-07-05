import NextAuth from "next-auth"
import { createHash } from "crypto"
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
        
        const email = credentials.email.toLowerCase().trim()
        const otp = credentials.otp as string
        const hashedOtp = createHash("sha256").update(otp).digest("hex")

        const db = await getDb()

        // Look up the OTP record for this email (regardless of the submitted code)
        const otpDoc = await db.collection("otps").findOne({ email })

        // No OTP on file, or it has expired
        if (!otpDoc || (otpDoc.expires_at && otpDoc.expires_at < new Date())) {
          return null
        }

        // Wrong code — count the failed attempt and lock out after too many tries
        if (otpDoc.otp !== hashedOtp) {
          const MAX_OTP_ATTEMPTS = 5
          const attempts = (otpDoc.attempts || 0) + 1
          if (attempts >= MAX_OTP_ATTEMPTS) {
            // Too many failures — invalidate the OTP entirely
            await db.collection("otps").deleteOne({ _id: otpDoc._id })
          } else {
            await db.collection("otps").updateOne(
              { _id: otpDoc._id },
              { $set: { attempts } }
            )
          }
          return null
        }

        // Correct code — consume the OTP so it cannot be reused
        await db.collection("otps").deleteOne({ _id: otpDoc._id })

        let user = await db.collection("users").findOne({ email })

        // Deactivated users cannot log in
        if (user && (user as any).is_active === false) {
          return null
        }

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
