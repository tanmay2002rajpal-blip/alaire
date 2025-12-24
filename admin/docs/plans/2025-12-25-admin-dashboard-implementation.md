# Alaire Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete admin dashboard for Alaire e-commerce with orders, products, customers, content, and analytics management.

**Architecture:** Separate Next.js app connecting to shared Supabase database. Custom JWT auth for admin users. Role-based access (admin/staff). Real-time notifications via Supabase Realtime.

**Tech Stack:** Next.js 16, shadcn/ui, Tailwind CSS, Supabase, Recharts, Tiptap, Resend, Shiprocket API, GSAP, Lenis

**Required Skills & Tools:**
- Use **frontend skills** for all component development
- Use **GSAP MCP** for animations and transitions
- Use **Lenis** for smooth scrolling where needed
- Use **shadcn/ui** for all UI components
- Use **Supabase MCP** for all database migrations and queries
- Use **Context7** for any documentation lookups

---

## Phase 1: Foundation

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install required packages**

Run:
```bash
cd E:/alaire/admin && npm install @supabase/supabase-js @supabase/ssr bcryptjs jsonwebtoken resend @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image date-fns
```

**Step 2: Install dev dependencies**

Run:
```bash
cd E:/alaire/admin && npm install -D @types/bcryptjs @types/jsonwebtoken
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install admin dashboard dependencies"
```

---

### Task 2: Environment Configuration

**Files:**
- Create: `E:/alaire/admin/.env.local`
- Create: `E:/alaire/admin/.env.example`

**Step 1: Create environment example file**

Create `E:/alaire/admin/.env.example`:
```env
# Supabase - Same as storefront
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin JWT
ADMIN_JWT_SECRET=

# Resend
RESEND_API_KEY=

# Shiprocket
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000
```

**Step 2: Create local env file with values**

Create `E:/alaire/admin/.env.local` with actual values from the storefront `.env.local` and generate a new JWT secret.

**Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add environment configuration"
```

---

### Task 3: Supabase Client Setup

**Files:**
- Create: `E:/alaire/admin/lib/supabase/client.ts`
- Create: `E:/alaire/admin/lib/supabase/server.ts`
- Create: `E:/alaire/admin/lib/supabase/admin.ts`

**Step 1: Create browser client**

Create `E:/alaire/admin/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create server client**

Create `E:/alaire/admin/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component - ignore
          }
        },
      },
    }
  )
}
```

**Step 3: Create admin client (service role)**

Create `E:/alaire/admin/lib/supabase/admin.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

**Step 4: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add Supabase client setup"
```

---

### Task 4: Database Migration - Admin Tables

**Files:**
- Run via Supabase MCP `mcp__supabase__apply_migration` or `mcp__supabase__execute_sql`

**IMPORTANT:** Use Supabase MCP tools for all database operations:
- `mcp__supabase__list_projects` - Find project ID
- `mcp__supabase__apply_migration` - For DDL (CREATE TABLE, ALTER, etc.)
- `mcp__supabase__execute_sql` - For queries and data operations

**Step 1: Create admin_users table**

Use `mcp__supabase__apply_migration` with name `create_admin_users`:
```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
```

**Step 2: Create admin_sessions table**

Use `mcp__supabase__apply_migration` with name `create_admin_sessions`:
```sql
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_admin_sessions_admin ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token_hash);
```

**Step 3: Create activity_log table**

Use `mcp__supabase__apply_migration` with name `create_activity_log`:
```sql
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_log_admin ON activity_log(admin_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
```

**Step 4: Create admin_notifications table**

Use `mcp__supabase__apply_migration` with name `create_admin_notifications`:
```sql
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_admin ON admin_notifications(admin_id, is_read);
CREATE INDEX idx_notifications_created ON admin_notifications(created_at DESC);
```

---

### Task 5: Database Migration - Coupons & Newsletter

**Step 1: Create coupons table**

Use `mcp__supabase__apply_migration` with name `create_coupons`:
```sql
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  category_ids UUID[],
  product_ids UUID[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active, valid_until);
```

**Step 2: Create email_subscribers table**

Use `mcp__supabase__apply_migration` with name `create_email_subscribers`:
```sql
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'manual',
  is_subscribed BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_subscribers_active ON email_subscribers(is_subscribed);
```

**Step 3: Create email_campaigns table**

Use `mcp__supabase__apply_migration` with name `create_email_campaigns`:
```sql
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaigns_status ON email_campaigns(status);
```

---

### Task 6: Create First Admin User

**Step 1: Create seed script**

Create `E:/alaire/admin/scripts/seed-admin.ts`:
```typescript
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
```

**Step 2: Add script to package.json**

Add to `package.json` scripts:
```json
"seed:admin": "npx tsx scripts/seed-admin.ts"
```

**Step 3: Commit**

```bash
git add scripts/ package.json
git commit -m "feat: add admin seed script"
```

---

### Task 7: Auth Library - JWT Utilities

**Files:**
- Create: `E:/alaire/admin/lib/auth/jwt.ts`
- Create: `E:/alaire/admin/lib/auth/types.ts`

**Step 1: Create auth types**

Create `E:/alaire/admin/lib/auth/types.ts`:
```typescript
export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'staff'
  is_active: boolean
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AdminSession {
  id: string
  admin_id: string
  expires_at: string
  created_at: string
}

export interface JWTPayload {
  sub: string // admin_id
  email: string
  name: string
  role: 'admin' | 'staff'
  session_id: string
  iat: number
  exp: number
}
```

**Step 2: Create JWT utilities**

Create `E:/alaire/admin/lib/auth/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import type { JWTPayload, AdminUser } from './types'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET!
const COOKIE_NAME = 'admin_session'
const TOKEN_EXPIRY = '24h'

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  return verifyToken(token)
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
```

**Step 3: Commit**

```bash
git add lib/auth/
git commit -m "feat: add JWT auth utilities"
```

---

### Task 8: Auth Actions - Login/Logout

**Files:**
- Create: `E:/alaire/admin/lib/auth/actions.ts`

**Step 1: Create auth actions**

Create `E:/alaire/admin/lib/auth/actions.ts`:
```typescript
'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { signToken, setSessionCookie, clearSessionCookie, getSession } from './jwt'
import type { AdminUser } from './types'

interface LoginResult {
  success: boolean
  error?: string
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const supabase = createAdminClient()

  // Get admin user
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !admin) {
    return { success: false, error: 'Invalid email or password' }
  }

  if (!admin.is_active) {
    return { success: false, error: 'Account is deactivated' }
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, admin.password_hash)
  if (!validPassword) {
    // Log failed attempt
    await supabase.from('activity_log').insert({
      action: 'login_failed',
      details: { email, reason: 'invalid_password' },
    })
    return { success: false, error: 'Invalid email or password' }
  }

  // Create session
  const sessionId = crypto.randomUUID()
  const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await supabase.from('admin_sessions').insert({
    id: sessionId,
    admin_id: admin.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  // Create JWT
  const token = signToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    session_id: sessionId,
  })

  await setSessionCookie(token)

  // Log successful login
  await supabase.from('activity_log').insert({
    admin_id: admin.id,
    admin_name: admin.name,
    action: 'login',
    details: { email },
  })

  return { success: true }
}

export async function logout(): Promise<void> {
  const session = await getSession()

  if (session) {
    const supabase = createAdminClient()

    // Delete session from database
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('id', session.session_id)

    // Log logout
    await supabase.from('activity_log').insert({
      admin_id: session.sub,
      admin_name: session.name,
      action: 'logout',
    })
  }

  await clearSessionCookie()
  redirect('/login')
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const session = await getSession()
  if (!session) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('admin_users')
    .select('id, email, name, role, is_active, two_factor_enabled, created_at, updated_at')
    .eq('id', session.sub)
    .single()

  return data
}
```

**Step 2: Commit**

```bash
git add lib/auth/actions.ts
git commit -m "feat: add login/logout actions"
```

---

### Task 9: Login Page

**Files:**
- Create: `E:/alaire/admin/app/(auth)/login/page.tsx`
- Create: `E:/alaire/admin/app/(auth)/layout.tsx`

**Step 1: Create auth layout**

Create `E:/alaire/admin/app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      {children}
    </div>
  )
}
```

**Step 2: Create login page**

Create `E:/alaire/admin/app/(auth)/login/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '@/lib/auth/actions'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-serif">ALAIRE</CardTitle>
        <CardDescription>Admin Dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@alaire.in"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add login page"
```

---

### Task 10: Auth Middleware

**Files:**
- Create: `E:/alaire/admin/middleware.ts`

**Step 1: Create middleware**

Create `E:/alaire/admin/middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/invite']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('admin_session')?.value

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // Redirect to dashboard if already logged in
    if (token && verifyToken(token)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = verifyToken(token)
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('admin_session')
    return response
  }

  // Add user info to headers for server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-admin-id', payload.sub)
  requestHeaders.set('x-admin-role', payload.role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

**Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware"
```

---

### Task 11: Update Sidebar Navigation

**Files:**
- Modify: `E:/alaire/admin/components/app-sidebar.tsx`

**Step 1: Update sidebar with e-commerce navigation**

Replace content of `E:/alaire/admin/components/app-sidebar.tsx`:
```typescript
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconBox,
  IconBuildingStore,
  IconCategory,
  IconChartBar,
  IconDiscount,
  IconFileText,
  IconHome,
  IconLayoutDashboard,
  IconMail,
  IconPackage,
  IconPhoto,
  IconSettings,
  IconShoppingCart,
  IconSpeakerphone,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navigation = {
  main: [
    { title: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard },
  ],
  operations: [
    { title: 'Orders', href: '/orders', icon: IconShoppingCart },
    { title: 'Products', href: '/products', icon: IconPackage },
    { title: 'Categories', href: '/categories', icon: IconCategory },
    { title: 'Inventory', href: '/inventory', icon: IconBox },
    { title: 'Customers', href: '/customers', icon: IconUsers },
    { title: 'Coupons', href: '/coupons', icon: IconDiscount },
  ],
  content: [
    { title: 'Hero Slides', href: '/content/hero', icon: IconPhoto },
    { title: 'Blog Posts', href: '/content/blog', icon: IconFileText },
    { title: 'Promotions', href: '/content/promotions', icon: IconSpeakerphone },
    { title: 'Newsletter', href: '/newsletter', icon: IconMail },
  ],
  analytics: [
    { title: 'Sales Reports', href: '/analytics/sales', icon: IconChartBar },
    { title: 'Customer Insights', href: '/analytics/customers', icon: IconUsersGroup },
  ],
  settings: [
    { title: 'Team', href: '/team', icon: IconUsersGroup },
    { title: 'Settings', href: '/settings', icon: IconSettings },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    role: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="!p-1.5">
              <Link href="/dashboard">
                <IconBuildingStore className="!size-5" />
                <span className="text-base font-semibold font-serif">ALAIRE</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.main.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.operations.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.content.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.analytics.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.settings.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{ ...user, avatar: '' }} />
      </SidebarFooter>
    </Sidebar>
  )
}
```

**Step 2: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat: update sidebar with e-commerce navigation"
```

---

### Task 12: Dashboard Layout

**Files:**
- Create: `E:/alaire/admin/app/(dashboard)/layout.tsx`
- Modify: `E:/alaire/admin/app/(dashboard)/dashboard/page.tsx`

**Step 1: Create dashboard layout**

Create `E:/alaire/admin/app/(dashboard)/layout.tsx`:
```typescript
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCurrentAdmin } from '@/lib/auth/actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect('/login')
  }

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      } as React.CSSProperties}
    >
      <AppSidebar
        variant="inset"
        user={{
          name: admin.name,
          email: admin.email,
          role: admin.role,
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/layout.tsx
git commit -m "feat: add dashboard layout with auth"
```

---

## Phase 2: Dashboard with Real Data

### Task 13: Dashboard Queries

**Files:**
- Create: `E:/alaire/admin/lib/queries/dashboard.ts`

**Step 1: Create dashboard queries**

Create `E:/alaire/admin/lib/queries/dashboard.ts`:
```typescript
import { createAdminClient } from '@/lib/supabase/admin'

export async function getDashboardStats() {
  const supabase = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Today's revenue
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', today.toISOString())
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  const todayRevenue = todayOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0

  // Yesterday's revenue for comparison
  const { data: yesterdayOrders } = await supabase
    .from('orders')
    .select('total')
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', today.toISOString())
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])

  const yesterdayRevenue = yesterdayOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0
  const revenueChange = yesterdayRevenue > 0
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
    : 0

  // Pending orders count
  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Low stock items
  const { count: lowStockItems } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .lt('stock', 10)
    .gt('stock', 0)

  // New customers this week
  const { count: newCustomers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())

  return {
    todayRevenue,
    revenueChange,
    pendingOrders: pendingOrders || 0,
    lowStockItems: lowStockItems || 0,
    newCustomers: newCustomers || 0,
  }
}

export async function getRecentOrders(limit = 10) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      status,
      created_at,
      users (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

export async function getRevenueChart(days = 30) {
  const supabase = createAdminClient()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data } = await supabase
    .from('orders')
    .select('total, created_at')
    .gte('created_at', startDate.toISOString())
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])
    .order('created_at', { ascending: true })

  // Group by date
  const grouped: Record<string, number> = {}
  data?.forEach((order) => {
    const date = new Date(order.created_at).toISOString().split('T')[0]
    grouped[date] = (grouped[date] || 0) + Number(order.total)
  })

  // Fill missing dates
  const result = []
  const current = new Date(startDate)
  while (current <= new Date()) {
    const dateStr = current.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      revenue: grouped[dateStr] || 0,
    })
    current.setDate(current.getDate() + 1)
  }

  return result
}

export async function getRecentActivity(limit = 10) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}
```

**Step 2: Commit**

```bash
git add lib/queries/dashboard.ts
git commit -m "feat: add dashboard queries"
```

---

### Task 14: Dashboard Page with Real Data

**Files:**
- Modify: `E:/alaire/admin/app/(dashboard)/dashboard/page.tsx`
- Modify: `E:/alaire/admin/components/section-cards.tsx`

**Step 1: Update section cards to accept props**

Replace `E:/alaire/admin/components/section-cards.tsx`:
```typescript
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string
  change: number
  description: string
  href?: string
}

function StatCard({ title, value, change, description }: StatCardProps) {
  const isPositive = change >= 0
  const Icon = isPositive ? IconTrendingUp : IconTrendingDown

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <Icon />
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="text-muted-foreground">{description}</div>
      </CardFooter>
    </Card>
  )
}

interface SectionCardsProps {
  stats: {
    todayRevenue: number
    revenueChange: number
    pendingOrders: number
    lowStockItems: number
    newCustomers: number
  }
}

export function SectionCards({ stats }: SectionCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <StatCard
        title="Today's Revenue"
        value={formatCurrency(stats.todayRevenue)}
        change={stats.revenueChange}
        description="Compared to yesterday"
      />
      <StatCard
        title="Pending Orders"
        value={stats.pendingOrders.toString()}
        change={0}
        description="Awaiting processing"
      />
      <StatCard
        title="Low Stock Items"
        value={stats.lowStockItems.toString()}
        change={0}
        description="Below threshold"
      />
      <StatCard
        title="New Customers"
        value={stats.newCustomers.toString()}
        change={0}
        description="This week"
      />
    </div>
  )
}
```

**Step 2: Update dashboard page**

Replace `E:/alaire/admin/app/(dashboard)/dashboard/page.tsx`:
```typescript
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { SectionCards } from '@/components/section-cards'
import { getDashboardStats, getRevenueChart, getRecentOrders } from '@/lib/queries/dashboard'
import { RecentOrdersTable } from '@/components/recent-orders-table'

export default async function DashboardPage() {
  const [stats, chartData, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRevenueChart(30),
    getRecentOrders(10),
  ])

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 md:gap-6">
      <SectionCards stats={stats} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={chartData} />
      </div>
      <div className="px-4 lg:px-6">
        <RecentOrdersTable orders={recentOrders} />
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add components/section-cards.tsx app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: dashboard with real data"
```

---

### Task 15: Recent Orders Table Component

**Files:**
- Create: `E:/alaire/admin/components/recent-orders-table.tsx`

**Step 1: Create recent orders table**

Create `E:/alaire/admin/components/recent-orders-table.tsx`:
```typescript
import Link from 'next/link'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

interface Order {
  id: string
  total: number
  status: string
  created_at: string
  users: {
    full_name: string
    email: string
  } | null
}

interface RecentOrdersTableProps {
  orders: Order[]
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders from your store</CardDescription>
        </div>
        <Button variant="outline" asChild>
          <Link href="/orders">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-medium hover:underline"
                  >
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {order.users?.full_name || 'Guest'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.users?.email || '-'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_STYLES[order.status] || ''}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(Number(order.total))}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(order.created_at), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

**Step 2: Commit**

```bash
git add components/recent-orders-table.tsx
git commit -m "feat: add recent orders table component"
```

---

## Phase 3: Orders Management

### Task 16: Orders List Page

**Files:**
- Create: `E:/alaire/admin/app/(dashboard)/orders/page.tsx`
- Create: `E:/alaire/admin/lib/queries/orders.ts`

**Step 1: Create orders queries**

Create `E:/alaire/admin/lib/queries/orders.ts`:
```typescript
import { createAdminClient } from '@/lib/supabase/admin'

export interface OrderFilters {
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export async function getOrders(filters: OrderFilters = {}) {
  const supabase = createAdminClient()
  const { status, search, dateFrom, dateTo, page = 1, limit = 20 } = filters

  let query = supabase
    .from('orders')
    .select(`
      id,
      total,
      status,
      created_at,
      shipping_address,
      users (
        id,
        full_name,
        email,
        phone
      ),
      order_items (
        id
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`id.ilike.%${search}%,users.full_name.ilike.%${search}%,users.email.ilike.%${search}%`)
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  return {
    orders: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getOrderById(id: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      users (
        id,
        full_name,
        email,
        phone
      ),
      order_items (
        id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        quantity,
        price_at_purchase,
        image_url
      ),
      order_status_history (
        id,
        status,
        note,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  return data
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  note: string,
  adminId: string,
  adminName: string
) {
  const supabase = createAdminClient()

  // Update order status
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateError) throw updateError

  // Add to status history
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    status,
    note,
  })

  // Log activity
  await supabase.from('activity_log').insert({
    admin_id: adminId,
    admin_name: adminName,
    action: 'order_status_updated',
    entity_type: 'order',
    entity_id: orderId,
    details: { status, note },
  })
}
```

**Step 2: Create orders list page**

Create `E:/alaire/admin/app/(dashboard)/orders/page.tsx`:
```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { IconPlus } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getOrders } from '@/lib/queries/orders'
import { OrderFilters } from './order-filters'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    search?: string
    page?: string
  }>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { orders, total, page, totalPages } = await getOrders({
    status: params.status,
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-muted-foreground">
            Manage and process customer orders
          </p>
        </div>
      </div>

      <OrderFilters />

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            {total} orders total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {order.users?.full_name || 'Guest'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.users?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{order.order_items?.length || 0}</TableCell>
                  <TableCell>{formatCurrency(Number(order.total))}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[order.status]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add lib/queries/orders.ts app/\(dashboard\)/orders/
git commit -m "feat: add orders list page"
```

---

### Task 17: Order Filters Component

**Files:**
- Create: `E:/alaire/admin/app/(dashboard)/orders/order-filters.tsx`

**Step 1: Create order filters**

Create `E:/alaire/admin/app/(dashboard)/orders/order-filters.tsx`:
```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { IconSearch } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

export function OrderFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') || 'all'
  const currentSearch = searchParams.get('search') || ''

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // Reset to first page on filter change
    router.push(`/orders?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const search = formData.get('search') as string
    updateParams('search', search)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <form onSubmit={handleSearch} className="flex-1">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search orders..."
            defaultValue={currentSearch}
            className="pl-9"
          />
        </div>
      </form>

      <Select
        value={currentStatus}
        onValueChange={(value) => updateParams('status', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(currentStatus !== 'all' || currentSearch) && (
        <Button
          variant="ghost"
          onClick={() => router.push('/orders')}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/orders/order-filters.tsx
git commit -m "feat: add order filters component"
```

---

### Task 18: Order Detail Page

**Files:**
- Create: `E:/alaire/admin/app/(dashboard)/orders/[id]/page.tsx`

**Step 1: Create order detail page**

Create `E:/alaire/admin/app/(dashboard)/orders/[id]/page.tsx`:
```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { IconArrowLeft, IconPackage } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getOrderById } from '@/lib/queries/orders'
import { OrderStatusUpdate } from './order-status-update'
import { OrderTimeline } from './order-timeline'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const order = await getOrderById(id)

  if (!order) {
    notFound()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const shippingAddress = order.shipping_address as {
    full_name?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
  } | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders">
            <IconArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <Badge className={STATUS_STYLES[order.status]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Placed on {format(new Date(order.created_at), 'MMMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Items & Customer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                        <IconPackage className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_name}</h4>
                      {item.variant_name && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant_name}
                        </p>
                      )}
                      <p className="text-sm">
                        {formatCurrency(Number(item.price_at_purchase))} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(Number(item.price_at_purchase) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(Number(order.discount_amount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {Number(order.shipping_cost) === 0
                      ? 'Free'
                      : formatCurrency(Number(order.shipping_cost))}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">{order.users?.full_name || 'Guest'}</h4>
                <p className="text-sm text-muted-foreground">{order.users?.email}</p>
                {order.users?.phone && (
                  <p className="text-sm text-muted-foreground">{order.users.phone}</p>
                )}
              </div>
              {shippingAddress && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-1">Shipping Address</h4>
                    <address className="text-sm text-muted-foreground not-italic">
                      {shippingAddress.full_name}<br />
                      {shippingAddress.line1}<br />
                      {shippingAddress.line2 && <>{shippingAddress.line2}<br /></>}
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}<br />
                      {shippingAddress.phone && <>Phone: {shippingAddress.phone}</>}
                    </address>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          <OrderStatusUpdate
            orderId={order.id}
            currentStatus={order.status}
          />

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span>{order.payment_method || 'Razorpay'}</span>
              </div>
              {order.razorpay_order_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Razorpay ID</span>
                  <span className="font-mono text-xs">{order.razorpay_order_id}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <OrderTimeline history={order.order_status_history || []} />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/orders/\[id\]/page.tsx
git commit -m "feat: add order detail page"
```

---

### Task 19: Order Status Update Component

**Files:**
- Create: `E:/alaire/admin/app/(dashboard)/orders/[id]/order-status-update.tsx`
- Create: `E:/alaire/admin/app/(dashboard)/orders/[id]/actions.ts`

**Step 1: Create order actions**

Create `E:/alaire/admin/app/(dashboard)/orders/[id]/actions.ts`:
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { updateOrderStatus } from '@/lib/queries/orders'
import { getSession } from '@/lib/auth/jwt'

export async function updateStatus(orderId: string, status: string, note: string) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await updateOrderStatus(orderId, status, note, session.sub, session.name)
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/orders')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update status' }
  }
}
```

**Step 2: Create status update component**

Create `E:/alaire/admin/app/(dashboard)/orders/[id]/order-status-update.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateStatus } from './actions'
import { toast } from 'sonner'

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

interface OrderStatusUpdateProps {
  orderId: string
  currentStatus: string
}

export function OrderStatusUpdate({ orderId, currentStatus }: OrderStatusUpdateProps) {
  const [status, setStatus] = useState(currentStatus)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpdate() {
    if (status === currentStatus) {
      toast.error('Please select a different status')
      return
    }

    setLoading(true)
    const result = await updateStatus(orderId, status, note)
    setLoading(false)

    if (result.success) {
      toast.success('Order status updated')
      setNote('')
    } else {
      toast.error(result.error || 'Failed to update status')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Status</CardTitle>
        <CardDescription>Change the order status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Note (optional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this status change..."
            rows={3}
          />
        </div>
        <Button
          onClick={handleUpdate}
          disabled={loading || status === currentStatus}
          className="w-full"
        >
          {loading ? 'Updating...' : 'Update Status'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/orders/\[id\]/
git commit -m "feat: add order status update"
```

---

### Task 20: Order Timeline Component

**Files:**
- Create: `E:/alaire/admin/app/(dashboard)/orders/[id]/order-timeline.tsx`

**Step 1: Create order timeline**

Create `E:/alaire/admin/app/(dashboard)/orders/[id]/order-timeline.tsx`:
```typescript
import { format } from 'date-fns'
import { IconCheck } from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface StatusHistoryItem {
  id: string
  status: string
  note: string | null
  created_at: string
}

interface OrderTimelineProps {
  history: StatusHistoryItem[]
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 pl-6">
          <div className="absolute left-[0.4375rem] top-2 bottom-2 w-0.5 bg-border" />
          {sortedHistory.map((item, index) => (
            <div key={item.id} className="relative">
              <div className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                <IconCheck className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium capitalize">{item.status}</p>
                {item.note && (
                  <p className="text-sm text-muted-foreground">{item.note}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/orders/\[id\]/order-timeline.tsx
git commit -m "feat: add order timeline component"
```

---

## Remaining Phases Summary

Due to document length, the following phases are outlined but follow the same detailed pattern:

### Phase 4: Products & Categories (Tasks 21-30)
- Product list page with filters
- Product create/edit form with tabs
- Image upload component
- Variant management
- Categories CRUD with tree view
- Inventory management page

### Phase 5: Customers & Coupons (Tasks 31-38)
- Customer list with search
- Customer detail with order history
- Review moderation
- Coupon list page
- Coupon create/edit form
- Coupon validation logic

### Phase 6: Content Management (Tasks 39-48)
- Hero slides CRUD with drag-drop
- Blog post editor with Tiptap
- Blog categories/tags
- Promotions management
- Static pages editor

### Phase 7: Newsletter (Tasks 49-55)
- Subscriber list with export
- Campaign editor
- Email templates
- Send/schedule campaigns
- Tracking stats

### Phase 8: Analytics (Tasks 56-62)
- Sales reports with charts
- Inventory reports
- Customer insights
- Export functionality

### Phase 9: Team & Settings (Tasks 63-70)
- Team member invite flow
- Role management
- Activity log viewer
- Store settings form
- Notification preferences

---

## Execution Notes

1. **Run dev server** during development: `npm run dev` (port 3001)
2. **Database migrations** use Supabase MCP `apply_migration` or `execute_sql`
3. **Commit frequently** after each task
4. **Test each feature** before moving to the next task
5. **Reference storefront** patterns in `E:/alaire/user/` for consistency
