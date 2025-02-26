/*eslint-disable*/

"use client"

import React from "react"
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
import { Skeleton } from "@/components/ui/skeleton"

interface ChatGroup {
  id: string
  name: string
  type: "Buy" | "Sell"
  price: number
  currency: string
  status: "active" | "complete"
  participants: number
  createdAt: Date
  itemDescription: string
}

export default function GroupChatIndexPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const [groups, setGroups] = React.useState<ChatGroup[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
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
            // Map any status not equal to "complete" to "active"
            status: data.status === "complete" ? "complete" : "active",
            participants: (data.participants || []).length,
            createdAt,
            itemDescription: description,
          })
        })

        // Sort groups by creation time descending (latest first)
        groupData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setGroups(groupData)
      } catch (error: any) {
        toast.error("Failed to fetch groups")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
  }, [user])

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
    type === "Buy" ? "bg-emerald-500" : "bg-red-500"

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/50"
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
                className="
                  flex flex-col space-y-2 p-4 rounded-lg
                  bg-muted/50 hover:bg-muted cursor-pointer transition-colors
                "
              >
                <div className="flex items-center justify-between">
                  <Badge className={getTypeColor(group.type)}>
                    {group.type}
                  </Badge>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>👥 {group.participants}</span>
                    <span>{group.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Typography variant="h3" className="font-medium">
                      {group.name}
                    </Typography>
                    <Typography variant="p" className="text-sm text-muted-foreground">
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
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
