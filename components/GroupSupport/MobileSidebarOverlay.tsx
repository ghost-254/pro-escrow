/*eslint-disable*/

"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import type { RootState } from "@/lib/stores/store"
import Typography from "@/components/ui/typography"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "react-toastify"

interface ChatGroup {
  id: string
  name: string
  type: "Buy" | "Sell"
  price: number
  currency: string
  status: "Pending Release" | "In Progress" | "Completed" | "Disputed"
  participants: number
  createdAt: Date
  itemDescription: string
}

interface MobileSidebarOverlayProps {
  onClose: () => void
}

export default function MobileSidebarOverlay({ onClose }: MobileSidebarOverlayProps) {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!user?.uid) return

    const fetchGroups = async () => {
      try {
        const groupsRef = collection(db, "groups")
        const groupsQuery = query(groupsRef, where("participants", "array-contains", user.uid))
        const querySnapshot = await getDocs(groupsQuery)

        const groupData: ChatGroup[] = []
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data()
          const createdAt = data.createdAt ? data.createdAt.toDate() : new Date()
          // Compute amount based on currency and price.
          const amount =
            data.currency === "KES"
              ? `KES ${parseFloat(data.price).toFixed(2)}`
              : `$${parseFloat(data.price).toFixed(2)}`
          // Truncate description if longer than 50 characters.
          let description = data.itemDescription || "No description provided"
          if (description.length > 50) {
            description = description.substring(0, 50) + "..."
          }
          groupData.push({
            id: docSnap.id,
            name: `Xcrow_${docSnap.id.slice(0, 4)}`,
            type: data.type || "Buy",
            price: data.price || 0,
            currency: data.currency || "USD",
            status: data.status || "Pending Release",
            participants: (data.participants || []).length,
            createdAt,
            itemDescription: description,
          })
        })

        // Sort groups by creation time descending (latest first)
        groupData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
      group.itemDescription.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Define badge colors for status.
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500 text-white"
      case "Disputed":
        return "bg-red-500 text-white"
      case "In Progress":
        return "bg-blue-500 text-white"
      default:
        return "bg-yellow-500 text-black"
    }
  }

  // Type badge: Buyers see green "Buy", Sellers see red "Sell"
  const getTypeColor = (type: "Buy" | "Sell") =>
    type === "Buy" ? "bg-emerald-500" : "bg-red-500"

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h3" className="mb-4">
          Groups
        </Typography>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => {
                  router.push(`/group-chat/${group.id}`)
                  onClose()
                }}
                className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
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
                    <Typography variant="h3" className="font-medium">
                      {group.name}
                    </Typography>
                    <Typography variant="p" className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {group.itemDescription}
                    </Typography>
                  </div>
                  <Typography variant="p" className="text-sm font-medium">
                    {group.currency === "KES"
                      ? `KES ${group.price.toFixed(2)}`
                      : `$${group.price.toFixed(2)}`}
                  </Typography>
                </div>
                <Badge variant="secondary" className={`w-fit ${getStatusColor(group.status)}`}>
                  {group.status}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
