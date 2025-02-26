"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/stores/store"
import { db } from "@/lib/firebaseConfig"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  FieldValue
} from "firebase/firestore"
import { toast } from "react-toastify"
import Typography from "@/components/ui/typography"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Trash2, Check, Circle } from "lucide-react"

interface Notification {
  id: string
  userId: string
  message: string
  link?: string
  createdAt?: Timestamp | string
  read: boolean
}

export default function NotificationsPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)

  const NOTIFICATIONS_PER_PAGE = 20

  useEffect(() => {
    // No user => skip
    if (!user?.uid) {
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      try {
        const notifsRef = collection(db, "notifications")
        const notificationsQuery = query(
          notifsRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        )
        const querySnapshot = await getDocs(notificationsQuery)
        const data: Notification[] = []

        querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
          const notifData = docSnap.data() as Omit<Notification, "id">
          data.push({
            id: docSnap.id,
            ...notifData,
            read: notifData.read ?? false // default to false if missing
          })
        })

        setNotifications(data)
        setFilteredNotifications(data)
        setDisplayedNotifications(data.slice(0, NOTIFICATIONS_PER_PAGE))
      } catch {
        setError("Failed to fetch notifications. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  useEffect(() => {
    const filtered = notifications.filter((notification) =>
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredNotifications(filtered)
    setDisplayedNotifications(
      filtered.slice(0, showAll ? filtered.length : NOTIFICATIONS_PER_PAGE)
    )
  }, [searchQuery, notifications, showAll])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleShowMoreLess = () => {
    setShowAll(!showAll)
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, "notifications", id))
      setNotifications(notifications.filter((notification) => notification.id !== id))
      setDeleteDialogOpen(false)
      setNotificationToDelete(null)
      toast.success("Notification deleted.")
      // Refresh the layout so the sidebar re-checks
      router.refresh()
    } catch {
      toast.error("Error deleting notification.")
    }
  }

  async function handleMarkAsRead(id: string, read: boolean) {
    try {
      // Ensure newData is typed correctly
      const newData: { [key: string]: FieldValue | Partial<unknown> | undefined } = {
        read
      }
      if (!read) {
        // user is marking as unread
        newData.updatedAt = serverTimestamp()
      }

      await updateDoc(doc(db, "notifications", id), newData)
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, read } : notification
        )
      )
      router.refresh()
    } catch {
      toast.error("Failed to update notification.")
    }
  }

  async function handleMarkAllAsRead(read: boolean) {
    try {
      const updates = notifications.map((notification) => {
        const newData: { [key: string]: FieldValue | Partial<unknown> | undefined } = {
          read
        }
        if (!read) {
          // marking all as unread => set updatedAt if you want them to reappear on top
          newData.updatedAt = serverTimestamp()
        }
        return updateDoc(doc(db, "notifications", notification.id), newData)
      })
      await Promise.all(updates)
      setNotifications(notifications.map((notification) => ({ ...notification, read })))
      toast.success(`All notifications marked as ${read ? "read" : "unread"}.`)
      router.refresh()
    } catch {
      toast.error("Failed to update notifications.")
    }
  }

  if (!user?.uid) {
    return (
      <div className="p-4">
        <Typography variant="h2" className="mb-4">
          Notifications
        </Typography>
        <p>You must be logged in to view notifications.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4">
        <Typography variant="h2" className="mb-4">
          Notifications
        </Typography>
        <div className="space-y-2">
          {[...Array(5)].map((el, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Typography variant="h2" className="mb-4">
          Notifications
        </Typography>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMarkAllAsRead(true)}>
                Mark all read
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAllAsRead(false)}>
                Mark all unread
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow overflow-y-auto">
          <div className="space-y-2">
            {displayedNotifications.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No notifications found.
              </p>
            ) : (
              displayedNotifications.map((notification) => {
                const { id, message, link, createdAt, read } = notification
                const dateLabel = createdAt
                  ? typeof createdAt === "string"
                    ? new Date(createdAt).toLocaleString()
                    : createdAt.toDate().toLocaleString()
                  : ""

                return (
                  <div
                    key={id}
                    className={`
                      p-4 rounded-lg shadow-sm flex items-start justify-between gap-4
                      ${read ? "bg-white dark:bg-gray-800" : "bg-blue-50 dark:bg-gray-700"}
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    `}
                  >
                    <div
                      className="flex-grow cursor-pointer"
                      onClick={() => {
                        if (link) router.push(link)
                      }}
                    >
                      <Typography variant="p" className="font-medium">
                        {message}
                      </Typography>
                      <div className="text-xs text-muted-foreground mt-1">
                        {dateLabel}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkAsRead(id, !read)}
                      >
                        {read ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setNotificationToDelete(id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}

            {filteredNotifications.length > NOTIFICATIONS_PER_PAGE && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={handleShowMoreLess}>
                  Show {showAll ? "less" : "more"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                notificationToDelete && handleDelete(notificationToDelete)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
