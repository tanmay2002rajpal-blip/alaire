'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Mail,
  Plus,
  Trash2,
  Loader2,
  Save,
  Users,
  KeyRound,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  saveNotificationEmails,
  createAdminUser,
  changeAdminPassword,
  toggleAdminStatus,
  deleteAdminUser,
} from '@/lib/actions/settings'
import type { AdminUserListItem } from '@/lib/queries/settings'

interface SettingsClientProps {
  notificationEmails: string[]
  adminUsers: AdminUserListItem[]
  currentAdminId: string
}

export function SettingsClient({
  notificationEmails: initialEmails,
  adminUsers: initialAdminUsers,
  currentAdminId,
}: SettingsClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage notification preferences and admin users
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Mail className="h-4 w-4" />
            Notification Emails
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-1.5">
            <Users className="h-4 w-4" />
            Admin Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationEmailsTab initialEmails={initialEmails} />
        </TabsContent>

        <TabsContent value="admins">
          <AdminUsersTab
            initialAdminUsers={initialAdminUsers}
            currentAdminId={currentAdminId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Notification Emails Tab ────────────────────────────────────────────────

function NotificationEmailsTab({ initialEmails }: { initialEmails: string[] }) {
  const [emails, setEmails] = useState<string[]>(
    initialEmails.length > 0 ? initialEmails : ['']
  )
  const [saving, setSaving] = useState(false)

  function addEmail() {
    setEmails([...emails, ''])
  }

  function removeEmail(index: number) {
    const updated = emails.filter((_, i) => i !== index)
    setEmails(updated.length > 0 ? updated : [''])
  }

  function updateEmail(index: number, value: string) {
    const updated = [...emails]
    updated[index] = value
    setEmails(updated)
  }

  async function handleSave() {
    const nonEmpty = emails.filter((e) => e.trim().length > 0)
    if (nonEmpty.length === 0) {
      toast.error('Add at least one email address')
      return
    }

    try {
      setSaving(true)
      const result = await saveNotificationEmails(nonEmpty)
      if (result.success) {
        toast.success('Notification emails saved')
        // Clean up the list to show only saved values
        setEmails(nonEmpty.length > 0 ? nonEmpty : [''])
      } else {
        toast.error(result.error || 'Failed to save')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Emails</CardTitle>
        <CardDescription>
          Email addresses that receive order notifications and contact form alerts.
          These emails will be used instead of the default hardcoded address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {emails.map((email, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="e.g. admin@yourdomain.com"
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              disabled={saving}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeEmail(index)}
              disabled={saving || emails.length === 1}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmail}
            disabled={saving}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Email
          </Button>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Admin Users Tab ────────────────────────────────────────────────────────

function AdminUsersTab({
  initialAdminUsers,
  currentAdminId,
}: {
  initialAdminUsers: AdminUserListItem[]
  currentAdminId: string
}) {
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers)
  const [createOpen, setCreateOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null)

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
  })
  const [creating, setCreating] = useState(false)

  // Password form state
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Delete state
  const [deleting, setDeleting] = useState(false)

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleCreate() {
    try {
      setCreating(true)
      const result = await createAdminUser(createForm)
      if (result.success) {
        toast.success('Admin user created')
        setCreateOpen(false)
        setCreateForm({ name: '', email: '', password: '', role: 'staff' })
        // Optimistic update
        setAdminUsers((prev) => [
          {
            id: result.userId || '',
            name: createForm.name,
            email: createForm.email.toLowerCase(),
            role: createForm.role,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
      } else {
        toast.error(result.error || 'Failed to create admin')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setCreating(false)
    }
  }

  async function handleChangePassword() {
    if (!selectedUser) return
    try {
      setChangingPassword(true)
      const result = await changeAdminPassword({
        userId: selectedUser.id,
        newPassword,
      })
      if (result.success) {
        toast.success(`Password updated for ${selectedUser.name}`)
        setPasswordOpen(false)
        setNewPassword('')
        setSelectedUser(null)
      } else {
        toast.error(result.error || 'Failed to change password')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleToggleStatus(user: AdminUserListItem) {
    try {
      setTogglingId(user.id)
      const result = await toggleAdminStatus(user.id)
      if (result.success) {
        setAdminUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_active: !u.is_active } : u
          )
        )
        toast.success(
          `${user.name} is now ${user.is_active ? 'inactive' : 'active'}`
        )
      } else {
        toast.error(result.error || 'Failed to toggle status')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!selectedUser) return
    try {
      setDeleting(true)
      const result = await deleteAdminUser(selectedUser.id)
      if (result.success) {
        setAdminUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
        toast.success(`${selectedUser.name} has been deleted`)
        setDeleteOpen(false)
        setSelectedUser(null)
      } else {
        toast.error(result.error || 'Failed to delete admin')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription className="mt-1.5">
              Manage admin accounts that can access this dashboard
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No admin users found
                    </TableCell>
                  </TableRow>
                )}
                {adminUsers.map((user) => {
                  const isSelf = user.id === currentAdminId
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={() => handleToggleStatus(user)}
                            disabled={isSelf || togglingId === user.id}
                          />
                          <span className="text-sm text-muted-foreground">
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setNewPassword('')
                              setPasswordOpen(true)
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => {
                              setSelectedUser(user)
                              setDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Create a new admin account with access to the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                placeholder="Full name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, email: e.target.value }))
                }
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(val) =>
                  setCreateForm((f) => ({ ...f, role: val as 'admin' | 'staff' }))
                }
                disabled={creating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (full access)</SelectItem>
                  <SelectItem value="staff">Staff (limited access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for{' '}
              <span className="font-medium text-foreground">
                {selectedUser?.name}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changingPassword}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordOpen(false)}
              disabled={changingPassword}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                {selectedUser?.name}
              </span>
              ? This action cannot be undone. They will immediately lose access
              to the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
