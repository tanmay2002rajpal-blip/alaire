import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedAdmin() {
  const email = 'admin@alaire.in'
  const password = 'Admin123!' // Change this!
  const name = 'Admin User'

  const passwordHash = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email,
      password_hash: passwordHash,
      name,
      role: 'admin',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating admin:', error)
    return
  }

  console.log('Admin created:', data)
}

seedAdmin()
