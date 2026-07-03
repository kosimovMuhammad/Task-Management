import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Bell, CheckCheck, MessageSquare, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/features/notification/notificationSlice'
import type { Notification } from '@/types/notification'

const ICON: Record<Notification['type'], typeof Bell> = {
  issue_assigned: UserPlus,
  comment_added: MessageSquare,
  mentioned: MessageSquare,
}

const LABEL: Record<Notification['type'], string> = {
  issue_assigned: 'assigned you to an issue',
  comment_added: 'commented on an issue',
  mentioned: 'mentioned you',
}

export default function NotificationsPage() {
  const dispatch = useAppDispatch()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const items = useAppSelector((state) => state.notification.items)
  const isLoading = useAppSelector((state) => state.notification.isLoading)
  const unreadCount = useAppSelector((state) => state.notification.unreadCount)

  useEffect(() => {
    if (workspaceSlug) void dispatch(fetchNotifications({ workspaceSlug }))
  }, [workspaceSlug, dispatch])

  if (!workspaceSlug) return null

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => void dispatch(markAllNotificationsRead(workspaceSlug))}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <Bell className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {items.map((n) => {
            const Icon = ICON[n.type]
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) void dispatch(markNotificationRead({ workspaceSlug, notificationId: n.id }))
                }}
                className={`flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted ${n.is_read ? '' : 'bg-primary/5'}`}
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Icon className="size-4 text-secondary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{n.actor?.display_name ?? 'Someone'}</span> {LABEL[n.type]}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(n.created_at, 'en')}</p>
                </div>
                {!n.is_read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
