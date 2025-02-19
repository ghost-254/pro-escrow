//app/group-chat/page.tsx

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

interface ChatGroup {
  id: string
  name: string
  type: "Buy" | "Sell"
  amount: string
  status: "Pending Release" | "In Progress" | "Completed" | "Disputed"
  participants: number
  timestamp: string
  description: string
}

export default function GroupChatIndexPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const [groups, setGroups] = React.useState<ChatGroup[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    if (!user?.uid) return

    const fetchGroups = async () => {
      try {
        const groupsRef = collection(db, "groups")
        const groupsQuery = query(groupsRef, where("participants", "array-contains", user.uid))
        const querySnapshot = await getDocs(groupsQuery)

        const groupData: ChatGroup[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          groupData.push({
            id: doc.id,
            name: `Xcrow_${doc.id.slice(0, 4)}`,
            type: data.type || "Buy",
            amount: data.amount || "USD 0",
            status: data.status || "Pending Release",
            participants: (data.participants || []).length,
            timestamp: data.createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString(),
            description: data.description || "No description provided",
          })
        })

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
      group.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500 text-white"
      case "Disputed":
        return "bg-red-500 text-white"
      case "In Progress":
        return "bg-blue-500 text-white"
      default:
        return "bg-yellow-500 text-black dark:text-black"
    }
  }

  const getTypeColor = (type: "Buy" | "Sell") => {
    return type === "Buy" ? "bg-green-500" : "bg-red-500"
  }

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
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => router.push(`/group-chat/${group.id}`)}
              className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <Badge className={getTypeColor(group.type)}>{group.type}</Badge>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>👥 {group.participants}</span>
                  <span>{group.timestamp}</span>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Typography variant="h3" className="font-medium">
                    {group.name}
                  </Typography>
                  <Typography variant="p" className="text-sm text-muted-foreground line-clamp-1">
                    {group.description}
                  </Typography>
                </div>
                <Typography variant="p" className="text-sm font-medium">
                  {group.amount}
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
  )
}
