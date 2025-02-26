/*eslint-disable*/

"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import { db } from "@/lib/firebaseConfig"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import Typography from "@/components/ui/typography"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-toastify"
import { Skeleton } from "@/components/ui/skeleton"

// Updated Group interface with only two statuses.
interface Group {
  id: string
  name: string
  type: "Buy" | "Sell"
  amount: string
  status: "active" | "complete"
  participants: number
  createdAt: Date
  itemDescription: string
}

export default function GroupChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useSelector((state: RootState) => state.auth.user)

  const [groups, setGroups] = useState<Group[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Auto-detect mobile vs desktop using resize events.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (!user?.uid) return

    const fetchGroups = async () => {
      try {
        const groupsRef = collection(db, "groups")
        const qy = query(groupsRef, where("participants", "array-contains", user.uid))
        const querySnapshot = await getDocs(qy)

        const groupData: Group[] = []
        for (const grp of querySnapshot.docs) {
          const data = grp.data()
          // Compute amount based on group's currency and price.
          const amount =
            data.currency === "KES"
              ? `KES ${parseFloat(data.price).toFixed(2)}`
              : `$${parseFloat(data.price).toFixed(2)}`
          // Truncate description if over 50 characters.
          let description: string = data.itemDescription || "No description provided"
          if (description.length > 50) {
            description = description.substring(0, 50) + "..."
          }
          const createdAt = data.createdAt ? data.createdAt.toDate() : new Date()
          groupData.push({
            id: grp.id,
            name: `Xcrow_${grp.id.slice(0, 4)}`,
            type: (data.type as "Buy" | "Sell") || "Buy",
            amount,
            // Map any status not equal to "complete" to "active"
            status: data.status === "complete" ? "complete" : "active",
            participants: (data.participants || []).length,
            createdAt,
            itemDescription: description,
          })
        }

        // Sort groups by creation time (latest first)
        groupData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        // If a group is selected (pathname includes its id), move it to the top.
        const selectedGroupId = pathname.split("/")[2] // expecting /group-chat/{groupId}
        if (selectedGroupId) {
          const selectedIndex = groupData.findIndex((grp) => grp.id === selectedGroupId)
          if (selectedIndex > -1) {
            const [selectedGroup] = groupData.splice(selectedIndex, 1)
            groupData.unshift(selectedGroup)
          }
        }

        setGroups(groupData)
      } catch {
        toast.error("Failed to fetch groups")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
  }, [user, pathname])

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.itemDescription.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Updated badge color function for two statuses.
  const getStatusColor = (status: string) => {
    if (status === "active") {
      return "bg-orange-500 text-white"
    } else {
      return "bg-yellow-500 text-white"
    }
  }

  // Type badge: Buyers see green "Buy", Sellers see red "Sell"
  const getTypeColor = (type: "Buy" | "Sell") =>
    type === "Buy" ? "bg-emerald-500 dark:bg-emerald-600" : "bg-red-500"

  function GroupsList() {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="p-4 border-b dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {isLoading ? (
              // Display 3 skeleton items while loading.
              [1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))
            ) : (
              filteredGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => router.push(`/group-chat/${group.id}`)}
                  className={`flex flex-col space-y-2 p-4 rounded-lg cursor-pointer transition-colors ${
                    pathname.includes(group.id)
                      ? "bg-orange-100 dark:bg-orange-800"
                      : "bg-gray-50 hover:bg-orange-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge className={getTypeColor(group.type)}>{group.type}</Badge>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>👥 {group.participants}</span>
                      <span>{group.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Typography variant="h3" className="font-medium text-gray-900 dark:text-white">
                        {group.name}
                      </Typography>
                      <Typography variant="p" className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {group.itemDescription}
                      </Typography>
                    </div>
                    <Typography variant="p" className="text-sm font-medium text-gray-900 dark:text-white">
                      {group.amount}
                    </Typography>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={`w-fit ${getStatusColor(group.status)}`}>
                      {group.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t dark:border-gray-800">
          <Button
            onClick={() => router.push("/create-group")}
            className="w-full bg-emerald-500 hover:bg-orange-500 text-white"
          >
            Create New Group
          </Button>
        </div>
      </div>
    )
  }

  const isGroupPage = pathname !== "/group-chat"

  if (isMobile && !isGroupPage) {
    return <GroupsList />
  }

  if (isMobile && isGroupPage) {
    return <div className="h-screen bg-white dark:bg-gray-900">{children}</div>
  }

  // Desktop layout: sidebar + main chat.
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <div className="w-[400px] border-r dark:border-gray-800">
        <GroupsList />
      </div>
      <div className="flex-1">
        {isGroupPage ? (
          children
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  )
}
