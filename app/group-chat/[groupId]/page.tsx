"use client"

import type React from "react"
import { useState, useRef, useEffect, type JSX } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
  type Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useSelector } from "react-redux"
import Image from "next/image"
import { Paperclip, Send, X, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { db, storage } from "@/lib/firebaseConfig"
import type { RootState } from "@/lib/stores/store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import XcrowInfo from "@/components/xcrowinfo"
import { toast } from "react-toastify"
import { Card } from "@/components/ui/card"

// A named no‑op cleanup function to satisfy the linter
function noop(): void {
  // no cleanup needed
}

interface Message {
  id?: string
  senderId: string
  senderName: string
  content: string
  imageURL?: string
  timestamp?: Timestamp
}

interface TypingStatus {
  userId: string
  displayName: string
  isTyping: boolean
}

export default function GroupChatPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params?.groupId as string

  const user = useSelector((state: RootState) => state.auth.user)

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSending, setIsSending] = useState<boolean>(false)

  // Group creator and participant info
  const [creatorName, setCreatorName] = useState<string>("")
  const [participantsCount, setParticipantsCount] = useState<number>(1)

  // Deposit document info
  const [depositId, setDepositId] = useState<string>("")
  const [itemDescription, setItemDescription] = useState<string>("")
  const [depositStatus, setDepositStatus] = useState<string>("pending")
  const [price, setPrice] = useState<number>(0)
  const [escrowFee, setEscrowFee] = useState<number>(0)
  const [responsibility, setResponsibility] = useState<string>("")
  const [transactionType, setTransactionType] = useState<string>("")

  // Typing statuses
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([])
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If groupId or user is missing, navigate away
    if (!groupId || !user) {
      router.push("/")
      return noop
    }

    const fetchGroupDetails = async () => {
      const groupRef = doc(db, "groups", groupId)
      const groupSnap = await getDoc(groupRef)
      if (groupSnap.exists()) {
        const data = groupSnap.data()
        const { participants, depositId } = data

        if (depositId) {
          setDepositId(depositId)
        }
        if (Array.isArray(participants) && participants.length > 0) {
          setParticipantsCount(participants.length)
          const creatorUid = participants[0]
          const creatorRef = doc(db, "users", creatorUid)
          const creatorSnap = await getDoc(creatorRef)
          if (creatorSnap.exists()) {
            const cData = creatorSnap.data()
            const firstName = cData.firstName || "First"
            const lastName = cData.lastName || "Last"
            setCreatorName(`${firstName} ${lastName}`)
          } else {
            setCreatorName(creatorUid)
          }
        }
      }
    }
    fetchGroupDetails()

    const messagesRef = collection(db, "groups", groupId, "messages")
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"))
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = []
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as Message)
      })
      setMessages(msgs)
    })

    // Return cleanup function
    return () => {
      unsubscribe()
    }
  }, [groupId, user, router])

  useEffect(() => {
    if (!depositId) {
      return noop
    }
    const depositRef = doc(db, "deposits", depositId)
    const unsubscribe = onSnapshot(depositRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setDepositStatus(data.status || "pending")
        setItemDescription(data.itemDescription || "")
        setPrice(data.price || 0)
        setEscrowFee(data.escrowFee || 0)
        setResponsibility(data.escrowFeeResponsibility || "")
        setTransactionType(data.transactionType || "")
      }
    })
    return () => {
      unsubscribe()
    }
  }, [depositId])

  useEffect(() => {
    const typingColRef = collection(db, "groups", groupId, "typing")
    const unsubscribe = onSnapshot(typingColRef, (snapshot) => {
      const statuses: TypingStatus[] = []
      snapshot.forEach((docSnap) => {
        const { userId, displayName, isTyping } = docSnap.data() as TypingStatus
        statuses.push({ userId, displayName, isTyping })
      })
      setTypingUsers(statuses)
    })
    return () => {
      unsubscribe()
    }
  }, [groupId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (!user?.uid) {
      return noop
    }
    const handleTyping = async () => {
      const userTypingRef = doc(db, "groups", groupId, "typing", user.uid)
      const isTyping = newMessage.trim().length > 0
      try {
        await setDoc(
          userTypingRef,
          {
            userId: user.uid,
            displayName: user.displayName || user.uid,
            isTyping,
          },
          { merge: true },
        )
      } catch {
        toast.error("Failed to update typing status")
      }
    }
    handleTyping()
    return noop
  }, [newMessage, user?.uid, user?.displayName, groupId])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !imageFile) || !user) return
    setIsSending(true)
    try {
      let imageURL = null
      if (imageFile) {
        const storageRef = ref(storage, `groups/${groupId}/${Date.now()}_${imageFile.name}`)
        const snapshot = await uploadBytes(storageRef, imageFile)
        imageURL = await getDownloadURL(snapshot.ref)
      }

      const messagesRef = collection(db, "groups", groupId, "messages")
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: user.displayName || "Anonymous",
        content: newMessage.trim(),
        imageURL,
        timestamp: serverTimestamp(),
      })

      setNewMessage("")
      setImageFile(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch {
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const canRetryPayment = (): boolean => {
    return user?.uid !== undefined && depositStatus !== "paid" && transactionType === "buying"
  }

  const handleRetryPayment = (): void => {
    if (!depositId) return
    router.push(`/create-group/deposit/atlos-checkout/${depositId}`)
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-600 text-white"
      case "failed":
      case "canceled":
        return "bg-red-600 text-white"
      case "pending":
      default:
        return "bg-yellow-500 text-black dark:text-black"
    }
  }

  const otherTypingUsers = typingUsers.filter((typingUser) => typingUser.userId !== user?.uid && typingUser.isTyping)

  const toggleHeader = (): void => {
    setIsHeaderVisible(!isHeaderVisible)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-4 hidden lg:block">
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 flex flex-col justify-between">
            <Badge
              variant="outline"
              className={`${getStatusColor(depositStatus)} text-center text-sm mb-2 flex items-center justify-center h-8`}
            >
              {depositStatus === "paid"
                ? "Payment Completed"
                : depositStatus === "failed" || depositStatus === "canceled"
                  ? "Payment Failed"
                  : "Payment Pending"}
            </Badge>
            {canRetryPayment() && (
              <Button
                onClick={handleRetryPayment}
                className="bg-emerald-500 hover:bg-orange-500 text-white text-sm mt-2"
              >
                Retry Payment
              </Button>
            )}
          </Card>
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <Button variant="outline" className="text-sm h-10">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
            <Button variant="outline" className="text-destructive text-sm h-10">
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" className="text-sm h-10">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Dispute
            </Button>
            <XcrowInfo
              depositStatus={depositStatus}
              depositId={depositId}
              itemDescription={itemDescription}
              price={price}
              escrowFee={escrowFee}
              responsibility={responsibility}
              transactionType={transactionType}
            />
          </div>
        </div>
      </header>

      {/* Dropdown header for mobile */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <Button variant="ghost" onClick={toggleHeader} className="w-full flex justify-between items-center p-4">
          <span>Chat Details</span>
          {isHeaderVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
        {isHeaderVisible && (
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <Badge className={`${getStatusColor(depositStatus)} text-xs md:text-sm`}>
                {depositStatus === "paid"
                  ? "Payment Completed"
                  : depositStatus === "failed" || depositStatus === "canceled"
                    ? "Payment Failed"
                    : "Payment Pending"}
              </Badge>

              {canRetryPayment() && (
                <Button
                  onClick={handleRetryPayment}
                  className="bg-emerald-500 hover:bg-orange-500 text-white text-xs md:text-sm h-8"
                >
                  Retry Payment
                </Button>
              )}

              <Button variant="outline" className="text-xs md:text-sm h-8">
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </Button>

              <Button variant="outline" className="text-destructive text-xs md:text-sm h-8">
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </Button>

              <Button variant="outline" className="text-xs md:text-sm h-8">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Dispute
              </Button>

              <XcrowInfo
                depositStatus={depositStatus}
                depositId={depositId}
                itemDescription={itemDescription}
                price={price}
                escrowFee={escrowFee}
                responsibility={responsibility}
                transactionType={transactionType}
              />
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-grow p-4">
        <div className="mb-4 space-x-2 text-center">
          <Badge variant="secondary" className="bg-gray-800 text-white">
            Group created by {creatorName || "Unknown User"}
          </Badge>
          <Badge variant="outline" className="text-gray-400 border-gray-700">
            {participantsCount} participant{participantsCount > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex ${msg.senderId === user?.uid ? "flex-row-reverse" : "flex-row"} items-end space-x-2`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${msg.senderName}`} />
                  <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
                </Avatar>
                <div
                  className={`message-box ${
                    msg.senderId === user?.uid
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  {msg.imageURL && (
                    <Dialog>
                      <DialogTrigger>
                        <Image
                          src={msg.imageURL || "/placeholder.svg"}
                          alt="Attachment"
                          width={300}
                          height={200}
                          className="rounded-lg mb-2 cursor-pointer w-full h-auto"
                        />
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-gray-900 text-white">
                        <DialogHeader>
                          <DialogTitle>Attached Image</DialogTitle>
                          <DialogDescription className="text-gray-400">Sent by {msg.senderName}</DialogDescription>
                        </DialogHeader>
                        <Image
                          src={msg.imageURL || "/placeholder.svg"}
                          alt="Enlarged"
                          width={800}
                          height={600}
                          className="rounded-lg"
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                  {msg.timestamp && (
                    <p className="text-xs opacity-70 mt-1">{msg.timestamp.toDate().toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <style jsx global>{`
        .message-box {
          max-width: 65%;
          width: fit-content;
          min-width: 100px;
          padding: 8px 12px;
          border-radius: 12px;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }
      `}</style>
      <footer className="border-t dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        {otherTypingUsers.length > 0 && (
          <div className="mb-2 flex items-center space-x-2">
            {otherTypingUsers.map((typingUser) => (
              <div key={typingUser.userId} className="flex items-center px-2 py-1 bg-gray-800 rounded-full">
                <span className="text-sm font-medium text-gray-300 mr-1">{typingUser.displayName}</span>
                <TypingBubble />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col space-y-2">
          {imagePreview && (
            <div className="relative inline-block">
              <Image
                src={imagePreview || "/placeholder.svg"}
                alt="Preview"
                width={100}
                height={100}
                className="rounded-lg"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 rounded-full"
                onClick={() => {
                  setImageFile(null)
                  setImagePreview(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex space-x-2">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-800"
            >
              <Paperclip className="w-4 h-4 mr-2" />
            </Button>
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow resize-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending}
              className="bg-emerald-500 hover:bg-orange-500 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TypingBubble(): JSX.Element {
  return (
    <div className="flex items-center space-x-1">
      <div className="bg-gray-400 w-1.5 h-1.5 rounded-full animate-bounce" />
      <div className="bg-gray-400 w-1.5 h-1.5 rounded-full animate-bounce animation-delay-200" />
      <div className="bg-gray-400 w-1.5 h-1.5 rounded-full animate-bounce animation-delay-400" />
    </div>
  )
}
