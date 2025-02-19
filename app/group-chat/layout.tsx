//app/group-chat/layout.tsx

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/stores/store"
import { db } from "@/lib/firebaseConfig"
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import Typography from "@/components/ui/typography"
import { ArrowLeft, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-toastify"

interface Group {
  id: string
  name: string
  type: "Buy" | "Sell"
  amount: string
  status: "Pending Release" | "In Progress" | "Completed" | "Disputed"
  participants: number
  timestamp: string
  description: string
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

  // We only want to compute once in a client environment
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check client window width
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768)
    }
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

          // Default description if deposit doc not found
          let description = "No description available"

          if (data.depositId) {
            const depositRef = doc(db, "deposits", data.depositId)
            const depositDoc = await getDoc(depositRef)
            if (depositDoc.exists()) {
              const depositData = depositDoc.data()
              description = depositData?.itemDescription || description
            }
          }

          groupData.push({
            id: grp.id,
            name: `Xcrow_${grp.id.slice(0, 4)}`,
            type: (data.type as "Buy" | "Sell") || "Buy",
            amount: data.amount || "USD 0",
            status: (data.status as Group["status"]) || "Pending Release",
            participants: (data.participants || []).length,
            timestamp: data.createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString(),
            description,
          })
        }

        setGroups(groupData)
      } catch {
        toast.error("Failed to fetch groups")
      }
    }

    fetchGroups()
  }, [user])

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500 text-white dark:bg-emerald-600"
      case "Disputed":
        return "bg-red-500 text-white"
      case "In Progress":
        return "bg-purple-500 text-white"
      default:
        return "bg-yellow-500 text-black dark:text-black"
    }
  }

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
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => router.push(`/group-chat/${group.id}`)}
                className="
                  flex flex-col space-y-2 p-4 rounded-lg
                  bg-gray-50 hover:bg-orange-50
                  dark:bg-gray-800 dark:hover:bg-gray-700
                  cursor-pointer transition-colors
                "
              >
                <div className="flex items-center justify-between">
                  <Badge className={getTypeColor(group.type)}>
                    {group.type}
                  </Badge>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>👥 {group.participants}</span>
                    <span>{group.timestamp}</span>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Typography variant="h3" className="font-medium text-gray-900 dark:text-white">
                      {group.name}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1"
                    >
                      {group.description}
                    </Typography>
                  </div>
                  <Typography
                    variant="p"
                    className="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {group.amount}
                  </Typography>
                </div>

                <Badge
                  variant="secondary"
                  className={`w-fit ${getStatusColor(group.status)}`}
                >
                  {group.status}
                </Badge>
              </div>
            ))}
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

  // Mobile: If we're not on a specific group, show just the list
  if (isMobile && !isGroupPage) {
    return <GroupsList />
  }

  // Mobile: If we are on a group, show only the group chat
  if (isMobile && isGroupPage) {
    return (
      <div className="h-screen bg-white dark:bg-gray-900">
        <div className="flex items-center p-4 border-b dark:border-gray-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/group-chat")}
            className="mr-2 text-gray-900 dark:text-white hover:bg-orange-50 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Typography variant="h2" className="text-gray-900 dark:text-white">
            Chat Details
          </Typography>
        </div>
        {children}
      </div>
    )
  }

  // Desktop layout: sidebar + main chat
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
