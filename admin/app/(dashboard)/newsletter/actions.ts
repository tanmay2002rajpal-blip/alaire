'use server'

import { getDb } from '@/lib/db/client'
import { getSession } from '@/lib/auth/jwt'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function getSubscribers() {
  const db = await getDb()
  const subscribers = await db.collection('newsletter_subscribers').find({ is_active: true }).sort({ subscribed_at: -1 }).toArray()
  
  return subscribers.map(s => ({
    id: s._id.toString(),
    email: s.email,
    subscribed_at: s.subscribed_at
  }))
}

export async function sendNewsletterBroadcast(subject: string, htmlContent: string) {
  // Auth guard: only authenticated admins may broadcast.
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized.' }
  }

  const db = await getDb()
  const subscribers = await db.collection('newsletter_subscribers').find({ is_active: true }).toArray()

  const emails = subscribers.map(s => s.email)
  if (emails.length === 0) return { success: false, error: 'No active subscribers found.' }

  try {
    const resend = getResend()
    const fromAddress = 'Alaire <newsletter@alaire.in>'

    // Privacy: send ONE email per recipient so no subscriber sees another's
    // address. (Previously used `to: batch`, which exposed the entire list to
    // every recipient.)
    // TODO: add a real per-recipient unsubscribe link/token. For now we send a
    // generic List-Unsubscribe mailto header as a placeholder.
    let sent = 0
    let failed = 0
    for (const email of emails) {
      const { error } = await resend.emails.send({
        from: fromAddress,
        to: email,
        subject,
        html: htmlContent,
        headers: {
          'List-Unsubscribe': '<mailto:newsletter@alaire.in?subject=unsubscribe>',
        },
      })
      if (error) {
        failed++
        console.error(`Failed to send newsletter to ${email}:`, error)
      } else {
        sent++
      }
    }

    if (sent === 0) {
      return { success: false, error: 'Failed to send broadcast to any subscriber.' }
    }

    return { success: true, count: sent, failed }
  } catch (err: any) {
    console.error('Failed to send broadcast:', err)
    return { success: false, error: err.message || 'Error executing broadcast.' }
  }
}
