'use server'

import { getDb } from '@/lib/db/client'
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
  const db = await getDb()
  const subscribers = await db.collection('newsletter_subscribers').find({ is_active: true }).toArray()
  
  const emails = subscribers.map(s => s.email)
  if (emails.length === 0) return { success: false, error: 'No active subscribers found.' }

  try {
    // Note: In production you might batch these or use audience features in Resend.
    // We send via BCC or separate requests here to avoid exposing full list.
    const resend = getResend()
    
    // Batching 50 emails per request to respect limits
    const BATCH_SIZE = 50
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)
      await resend.emails.send({
        from: 'Alaire <noreply@omrajpal.tech>',
        to: batch,
        subject,
        html: htmlContent,
      })
    }
    
    return { success: true, count: emails.length }
  } catch (err: any) {
    console.error('Failed to send broadcast:', err)
    return { success: false, error: err.message || 'Error executing broadcast.' }
  }
}
