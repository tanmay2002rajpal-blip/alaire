'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  MessageSquare,
  MailOpen,
  MailCheck,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  CheckCheck,
  Trash2,
  Calendar,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { updateMessageStatusAction, deleteMessageAction } from '@/lib/actions/messages'
import type { ContactMessage, MessageStats, PaginatedMessages } from '@/lib/queries/messages'

interface MessagesClientProps {
  messages: PaginatedMessages
  stats: MessageStats
  currentFilters: {
    search?: string
    status?: string
    page: number
  }
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
}: {
  title: string
  value: string
  description?: string
  icon: React.ElementType
  iconColor: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

const statusConfig = {
  unread: {
    label: 'Unread',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  read: {
    label: 'Read',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  replied: {
    label: 'Replied',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
}

export function MessagesClient({
  messages,
  stats,
  currentFilters,
}: MessagesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

  // Update URL with new filters
  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset page when filters change
    if (!updates.page) {
      params.delete('page')
    }

    startTransition(() => {
      router.push(`/messages?${params.toString()}`)
    })
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchValue || undefined })
  }

  // Handle status filter
  const handleStatusChange = (value: string) => {
    updateFilters({ status: value === 'all' ? undefined : value })
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() })
  }

  // Handle status update
  const handleUpdateStatus = async (messageId: string, status: 'unread' | 'read' | 'replied') => {
    const result = await updateMessageStatusAction(messageId, status)

    if (result.success) {
      toast.success(`Message marked as ${status}`)
      router.refresh()
    } else {
      toast.error('Failed to update message', {
        description: result.error,
      })
    }
  }

  // Handle delete
  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    const result = await deleteMessageAction(messageId)

    if (result.success) {
      toast.success('Message deleted')
      setSelectedMessage(null)
      router.refresh()
    } else {
      toast.error('Failed to delete message', {
        description: result.error,
      })
    }
  }

  // Handle row click — open message and mark as read if unread
  const handleRowClick = async (message: ContactMessage) => {
    setSelectedMessage(message)
    if (message.status === 'unread') {
      await handleUpdateStatus(message.id, 'read')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Messages
          {stats.unread > 0 && (
            <Badge variant="secondary" className="ml-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              {stats.unread} unread
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground">
          View and manage contact form submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Messages"
          value={stats.total.toLocaleString()}
          description="All contact submissions"
          icon={MessageSquare}
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Unread"
          value={stats.unread.toLocaleString()}
          description="Awaiting attention"
          icon={Mail}
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Read"
          value={stats.read.toLocaleString()}
          description="Reviewed messages"
          icon={MailOpen}
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Replied"
          value={stats.replied.toLocaleString()}
          description="Response sent"
          icon={MailCheck}
          iconColor="text-green-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or subject..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {/* Status Filter */}
        <Tabs
          value={currentFilters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
            <TabsTrigger value="replied">Replied</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2" />
                    <p>No messages found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              messages.messages.map((message) => (
                <TableRow
                  key={message.id}
                  className={cn(
                    'cursor-pointer',
                    message.status === 'unread' && 'bg-muted/50 font-medium'
                  )}
                  onClick={() => handleRowClick(message)}
                >
                  {/* Name */}
                  <TableCell>
                    <p className={cn(message.status === 'unread' && 'font-semibold')}>
                      {message.first_name} {message.last_name}
                    </p>
                  </TableCell>

                  {/* Email */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{message.email}</span>
                  </TableCell>

                  {/* Subject */}
                  <TableCell>
                    <p className={cn(
                      'max-w-[300px] truncate',
                      message.status === 'unread' && 'font-semibold'
                    )}>
                      {message.subject}
                    </p>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusConfig[message.status].className}
                    >
                      {statusConfig[message.status].label}
                    </Badge>
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatRelativeTime(message.created_at)}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          handleRowClick(message)
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Message
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {message.status !== 'unread' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateStatus(message.id, 'unread')
                          }}>
                            <Mail className="h-4 w-4 mr-2" />
                            Mark as Unread
                          </DropdownMenuItem>
                        )}
                        {message.status !== 'read' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateStatus(message.id, 'read')
                          }}>
                            <MailOpen className="h-4 w-4 mr-2" />
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        {message.status !== 'replied' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateStatus(message.id, 'replied')
                          }}>
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Mark as Replied
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(message.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {messages.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((messages.page - 1) * 25) + 1} to{' '}
            {Math.min(messages.page * 25, messages.total)} of {messages.total} messages
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={messages.page === 1 || isPending}
              onClick={() => handlePageChange(messages.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, messages.totalPages) }, (_, i) => {
                let pageNum: number
                if (messages.totalPages <= 5) {
                  pageNum = i + 1
                } else if (messages.page <= 3) {
                  pageNum = i + 1
                } else if (messages.page >= messages.totalPages - 2) {
                  pageNum = messages.totalPages - 4 + i
                } else {
                  pageNum = messages.page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === messages.page ? 'default' : 'outline'}
                    size="sm"
                    className="w-8"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isPending}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={messages.page === messages.totalPages || isPending}
              onClick={() => handlePageChange(messages.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMessage.subject}</DialogTitle>
                <DialogDescription>
                  From {selectedMessage.first_name} {selectedMessage.last_name} ({selectedMessage.email})
                  {selectedMessage.phone && ` - ${selectedMessage.phone}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={statusConfig[selectedMessage.status].className}
                  >
                    {statusConfig[selectedMessage.status].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(selectedMessage.created_at)}
                  </span>
                </div>
                <div className="rounded-md border p-4 bg-muted/30">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  {selectedMessage.status !== 'read' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleUpdateStatus(selectedMessage.id, 'read')
                        setSelectedMessage({ ...selectedMessage, status: 'read' })
                      }}
                    >
                      <MailOpen className="h-4 w-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                  {selectedMessage.status !== 'replied' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleUpdateStatus(selectedMessage.id, 'replied')
                        setSelectedMessage({ ...selectedMessage, status: 'replied' })
                      }}
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark as Replied
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Reply via Email
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 ml-auto"
                    onClick={() => handleDelete(selectedMessage.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
