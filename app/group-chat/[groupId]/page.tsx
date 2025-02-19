/* eslint-disable */

"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  onSnapshot,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

import type { RootState } from "@/lib/stores/store"
import { db, storage } from "@/lib/firebaseConfig"

import {
  Paperclip,
  Send,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

import XcrowInfo from "@/components/GroupSupport/xcrowinfo"
import EngageSupport from "@/components/GroupSupport/EngageSupport"
import CompleteTransaction from "@/components/GroupSupport/CompleteTransaction"
import CancelTransaction from "@/components/GroupSupport/CancelTransaction"
import DisputeTransaction from "@/components/GroupSupport/DisputeTransaction"
import CompletionPopup from "@/components/GroupSupport/CompletionPopup"
import RejectionPopup from "@/components/GroupSupport/RejectionPopup"
import CancelPopup from "@/components/GroupSupport/CancelPopup"
import CancelRejectionPopup from "@/components/GroupSupport/CancelRejectionPopup"

import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Message {
  id?: string
  senderId: string
  senderName: string
  content: string
  imageURL?: string | null
  timestamp?: Timestamp
}

interface TypingStatus {
  userId: string
  displayName: string
  isTyping: boolean
}

export default function GroupChatPage() {
  const router = useRouter()
  const { groupId } = useParams() as { groupId: string }
  const user = useSelector((state: RootState) => state.auth.user)

  // Chat messages
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Group doc fields
  const [participantsCount, setParticipantsCount] = useState(1)
  const [creatorName, setCreatorName] = useState("")
  const [itemDescription, setItemDescription] = useState("")
  const [price, setPrice] = useState(0)
  const [escrowFee, setEscrowFee] = useState(0)
  const [escrowFeeResp, setEscrowFeeResp] = useState("")
  const [transactionType, setTransactionType] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [status, setStatus] = useState("active")

  // ---------- Completion watchers ----------
  const [buyerComplete, setBuyerComplete] = useState(false)
  const [sellerComplete, setSellerComplete] = useState(false)
  const [initiator, setInitiator] = useState<"buyer" | "seller" | null>(null)
  const [rejection, setRejection] = useState<any>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [popupMsg, setPopupMsg] = useState("")
  const [showRejectionPopup, setShowRejectionPopup] = useState(false)

  // ---------- Cancel watchers ----------
  const [buyerCancel, setBuyerCancel] = useState(false)
  const [sellerCancel, setSellerCancel] = useState(false)
  const [cancelInitiator, setCancelInitiator] = useState<"buyer" | "seller" | null>(null)
  const [cancelRejection, setCancelRejection] = useState<any>(null)
  const [showCancelPopup, setShowCancelPopup] = useState(false)
  const [cancelPopupMsg, setCancelPopupMsg] = useState("")
  const [showCancelRejectionPopup, setShowCancelRejectionPopup] = useState(false)

  // Typing
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([])
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [buyerUid, setBuyerUid] = useState<string>("")
  const [sellerUid, setSellerUid] = useState<string>("")

  // -- Listen to group doc
  useEffect(() => {
    if (!groupId || !user) {
      router.push("/")
      return
    }
    const groupRef = doc(db, "groups", groupId)
    const unsubGroup = onSnapshot(groupRef, async (snap) => {
      if (!snap.exists()) {
        toast.error("Group not found.")
        router.push("/")
        return
      }
      const data = snap.data() || {}
      setStatus(data.status || "active")

      const participants = data.participants || []
      setParticipantsCount(participants.length)

      // Identify buyer = participants[0], seller = participants[1]
      if (participants.length > 0) {
        let buyer = ""
        let seller = ""

        if (typeof participants[0] === "string") {
          buyer = participants[0]
        } else if (participants[0] && typeof participants[0] === "object") {
          buyer = participants[0].uid
        }
        if (participants[1]) {
          if (typeof participants[1] === "string") {
            seller = participants[1]
          } else if (participants[1] && typeof participants[1] === "object") {
            seller = participants[1].uid
          }
        }
        setBuyerUid(buyer)
        setSellerUid(seller)

        // For display
        if (buyer) {
          const creatorSnap = await getDoc(doc(db, "users", buyer))
          if (creatorSnap.exists()) {
            const cData = creatorSnap.data()
            const firstName = cData.firstName || "Unknown"
            const lastName = cData.lastName || ""
            setCreatorName(`${firstName} ${lastName}`.trim())
          } else {
            setCreatorName(buyer)
          }
        }
      }

      setItemDescription(data.itemDescription || "")
      setPrice(data.price || 0)
      setEscrowFee(data.escrowFee || 0)
      setEscrowFeeResp(data.escrowFeeResponsibility || "")
      setTransactionType(data.transactionType || "")
      setCurrency(data.currency || "USD")

      // Extract transactionStatus
      const ts = data.transactionStatus || {}
      setBuyerComplete(!!ts.buyerComplete)
      setSellerComplete(!!ts.sellerComplete)
      setInitiator(ts.initiator || null)
      setRejection(ts.rejection || null)

      // Cancel fields
      setBuyerCancel(!!ts.buyerCancel)
      setSellerCancel(!!ts.sellerCancel)
      setCancelInitiator(ts.cancelInitiator || null)
      setCancelRejection(ts.cancelRejection || null)
    })

    // Listen to messages
    const msgsRef = collection(db, "groups", groupId, "messages")
    const msgsQuery = query(msgsRef, orderBy("timestamp", "asc"))
    const unsubMsgs = onSnapshot(msgsQuery, (snapshot) => {
      const msgs: Message[] = []
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as Message)
      })
      setMessages(msgs)
    })

    return () => {
      unsubGroup()
      unsubMsgs()
    }
  }, [groupId, user, router])

  // Listen to typing
  useEffect(() => {
    const typingRef = collection(db, "groups", groupId, "typing")
    const unsubTyping = onSnapshot(typingRef, (snap) => {
      const statuses: TypingStatus[] = []
      snap.forEach((docSnap) => {
        const { userId, displayName, isTyping } = docSnap.data() as TypingStatus
        statuses.push({ userId, displayName, isTyping })
      })
      setTypingUsers(statuses)
    })
    return () => {
      unsubTyping()
    }
  }, [groupId])

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Set isTyping doc
  useEffect(() => {
    if (!user?.uid) return
    const userTypingRef = doc(db, "groups", groupId, "typing", user.uid)
    const isTyping = newMessage.trim().length > 0
    setDoc(userTypingRef, {
      userId: user.uid,
      displayName: user.displayName || user.uid,
      isTyping,
    }).catch(() => {
      // no-op
    })
  }, [newMessage, user?.uid, user?.displayName, groupId])

  const isBuyer = user?.uid === buyerUid
  const isSeller = user?.uid === sellerUid

  /**
   * Final step to pay the seller from the buyer's frozen amount.
   * Called after both sides confirm. We do this only once.
   */
  const finalizePayout = async (groupRef: any, groupData: any) => {
    try {
      // If for some reason it's already complete, skip
      if (groupData.status === "complete") {
        return
      }
      // We expect groupData.frozenKesBalance or .frozenUsdBalance
      const frozenKes = groupData.frozenKesBalance || 0
      const frozenUsd = groupData.frozenUsdBalance || 0

      const fee = groupData.escrowFee || 0

      // The actual total frozen => sum of whichever currency
      let totalFrozen = 0
      let currencyKeyForSeller: "userKesBalance" | "userUsdBalance" = "userUsdBalance"
      let currencyKeyForBuyerFrozen: "frozenUserKesBalance" | "frozenUserUsdBalance" =
        "frozenUserUsdBalance"

      if (groupData.currency === "KES") {
        totalFrozen = frozenKes
        currencyKeyForSeller = "userKesBalance"
        currencyKeyForBuyerFrozen = "frozenUserKesBalance"
      } else {
        totalFrozen = frozenUsd
        currencyKeyForSeller = "userUsdBalance"
        currencyKeyForBuyerFrozen = "frozenUserUsdBalance"
      }

      // The seller gets totalFrozen - fee
      const sellerAmount = totalFrozen - fee
      if (sellerAmount < 0) {
        // If fees are higher than the total, something is off
        throw new Error("Escrow fee is higher than the frozen amount.")
      }

      // 1) Deduct from the buyer's frozen
      const buyerDocRef = doc(db, "users", buyerUid)
      const buyerSnap = await getDoc(buyerDocRef)
      if (!buyerSnap.exists()) {
        throw new Error("Buyer document not found.")
      }
      const buyerData = buyerSnap.data() || {}
      const currentBuyerFrozen = buyerData[currencyKeyForBuyerFrozen] || 0
      let newBuyerFrozen = currentBuyerFrozen - totalFrozen
      if (newBuyerFrozen < 0) {
        newBuyerFrozen = 0 // Avoid negative
      }

      // 2) Add to the seller's normal balance
      const sellerDocRef = doc(db, "users", sellerUid)
      const sellerSnap = await getDoc(sellerDocRef)
      if (!sellerSnap.exists()) {
        throw new Error("Seller document not found.")
      }
      const sellerData = sellerSnap.data() || {}
      const currentSellerBalance = sellerData[currencyKeyForSeller] || 0
      const newSellerBalance = currentSellerBalance + sellerAmount

      // 3) Update buyer doc & seller doc
      await updateDoc(buyerDocRef, {
        [currencyKeyForBuyerFrozen]: newBuyerFrozen,
      })
      await updateDoc(sellerDocRef, {
        [currencyKeyForSeller]: newSellerBalance,
      })

      // 4) Optionally, record platform's share if you track revenue
      // E.g. totalFrozen - sellerAmount = fee, which is your escrow revenue.

      toast.success(
        `Seller credited with ${sellerAmount.toFixed(2)} ${groupData.currency}. Escrow fee: ${fee}`
      )
    } catch (err: any) {
      toast.error("Failed to finalize payout: " + err.message)
    }
  }

  // --------------------- COMPLETION watchers ---------------------
  useEffect(() => {
    if (status === "complete") {
      setShowPopup(false)
      setShowRejectionPopup(false)
      return
    }
    // If there's a rejection => show RejectionPopup to initiator
    if (rejection) {
      if ((initiator === "buyer" && isBuyer) || (initiator === "seller" && isSeller)) {
        setShowRejectionPopup(true)
      } else {
        setShowRejectionPopup(false)
      }
    } else {
      setShowRejectionPopup(false)
    }

    // Show completion popup if exactly one side is true, no rejection,
    // and I'm the "other" side
    if (!rejection && status !== "complete") {
      if (buyerComplete && !sellerComplete && isSeller) {
        setPopupMsg("Buyer marked the order as completed. Do you agree?")
        setShowPopup(true)
      } else if (sellerComplete && !buyerComplete && isBuyer) {
        setPopupMsg("Seller marked the order as completed. Do you agree?")
        setShowPopup(true)
      } else {
        setShowPopup(false)
      }
    }
  }, [status, buyerComplete, sellerComplete, rejection, initiator, isBuyer, isSeller])

  /**
   * Called if user chooses "Agree" on the final completion popup
   * -> both sides become true, we finalize payout, set status to "complete."
   */
  const handleAgree = async () => {
    try {
      const groupRef = doc(db, "groups", groupId)
      const snap = await getDoc(groupRef)
      if (!snap.exists()) return

      const data = snap.data() || {}
      const ts = data.transactionStatus || {}

      // Both sides
      ts.buyerComplete = true
      ts.sellerComplete = true
      ts.initiator = null
      ts.rejection = null

      // First, finalize payout
      await finalizePayout(groupRef, {
        ...data,
        buyerUid,
        sellerUid,
      })

      // Then mark the doc as complete
      await updateDoc(groupRef, {
        transactionStatus: ts,
        status: "complete",
      })

      toast.success("Transaction is now COMPLETE.")
      setShowPopup(false)
    } catch (error: any) {
      toast.error("Failed to complete transaction. " + error.message)
    }
  }

  const handleDisagree = async () => {
    if (!user?.uid) return
    try {
      const groupRef = doc(db, "groups", groupId)
      const snap = await getDoc(groupRef)
      if (!snap.exists()) return

      const data = snap.data() || {}
      const ts = data.transactionStatus || {}

      // revert both sides
      ts.buyerComplete = false
      ts.sellerComplete = false

      if (isBuyer) {
        ts.rejection = { by: "buyer", time: new Date().toISOString() }
      } else if (isSeller) {
        ts.rejection = { by: "seller", time: new Date().toISOString() }
      }

      await updateDoc(groupRef, { transactionStatus: ts })
      toast.info("You have disagreed. The request is removed.")
      setShowPopup(false)
    } catch (error: any) {
      toast.error("Failed to disagree. " + error.message)
    }
  }

  const handleCloseRejectionPopup = async () => {
    try {
      const groupRef = doc(db, "groups", groupId)
      const snap = await getDoc(groupRef)
      if (!snap.exists()) return

      const data = snap.data() || {}
      const ts = data.transactionStatus || {}
      ts.rejection = null

      await updateDoc(groupRef, { transactionStatus: ts })
    } catch (err: any) {
      toast.error("Error clearing rejection: " + err.message)
    } finally {
      setShowRejectionPopup(false)
    }
  }

  // --------------------- CANCEL watchers ---------------------
  useEffect(() => {
    if (status === "cancelled" || status === "complete") {
      setShowCancelPopup(false)
      setShowCancelRejectionPopup(false)
      return
    }

    // If there's a cancelRejection => show CancelRejectionPopup to the cancelInitiator
    if (cancelRejection) {
      if ((cancelInitiator === "buyer" && isBuyer) || (cancelInitiator === "seller" && isSeller)) {
        setShowCancelRejectionPopup(true)
      } else {
        setShowCancelRejectionPopup(false)
      }
    } else {
      setShowCancelRejectionPopup(false)
    }

    // Show the "CancelPopup" if exactly one side is true, no cancelRejection, and I'm the other side
    if (!cancelRejection) {
      if (buyerCancel && !sellerCancel && isSeller) {
        setCancelPopupMsg("Buyer wants to CANCEL the transaction. Do you agree?")
        setShowCancelPopup(true)
      } else if (sellerCancel && !buyerCancel && isBuyer) {
        setCancelPopupMsg("Seller wants to CANCEL the transaction. Do you agree?")
        setShowCancelPopup(true)
      } else {
        setShowCancelPopup(false)
      }
    }
  }, [
    status,
    buyerCancel,
    sellerCancel,
    cancelInitiator,
    cancelRejection,
    isBuyer,
    isSeller,
  ])

  // If user *agrees* to cancel
  const handleAgreeCancel = async () => {
    try {
      const groupRef = doc(db, "groups", groupId)
      const snap = await getDoc(groupRef)
      if (!snap.exists()) return

      const data = snap.data() || {}
      const ts = data.transactionStatus || {}

      // Both sides = true => status="cancelled"
      ts.buyerCancel = true
      ts.sellerCancel = true
      ts.cancelInitiator = null
      ts.cancelRejection = null

      await updateDoc(groupRef, {
        transactionStatus: ts,
        status: "cancelled",
      })
      toast.success("Transaction is now CANCELLED.")
      setShowCancelPopup(false)
    } catch (err: any) {
      toast.error("Failed to set transaction to cancelled. " + err.message)
    }
  }

  // If user *disagrees* to cancel
  const handleDisagreeCancel = async () => {
    try {
      const groupRef = doc(db, "groups", groupId)
      const snap = await getDoc(groupRef)
      if (!snap.exists()) return

      const data = snap.data() || {}
      const ts = data.transactionStatus || {}

      // Revert or clear out the request
      ts.buyerCancel = false
      ts.sellerCancel = false

      if (isBuyer) {
        ts.cancelRejection = { by: "buyer", time: new Date().toISOString() }
      } else if (isSeller) {
        ts.cancelRejection = { by: "seller", time: new Date().toISOString() }
      }

      await updateDoc(groupRef, {
        transactionStatus: ts,
      })

      toast.info("You have disagreed. Cancel request is removed.")
      setShowCancelPopup(false)
    } catch (err: any) {
      toast.error("Failed to disagree with cancellation. " + err.message)
    }
  }

  // The initiator sees CancelRejectionPopup. Once they close => remove `cancelRejection`
  const handleCloseCancelRejectionPopup = async () => {
    try {
      const groupRef = doc(db, "groups", groupId)
      const snap = await getDoc(groupRef)
      if (!snap.exists()) return

      const data = snap.data() || {}
      const ts = data.transactionStatus || {}
      ts.cancelRejection = null

      await updateDoc(groupRef, { transactionStatus: ts })
    } catch (err: any) {
      toast.error("Error clearing cancelRejection: " + err.message)
    } finally {
      setShowCancelRejectionPopup(false)
    }
  }

  // --------------------- Chat input / messaging ---------------------
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !imageFile) || !user) return
    setIsSending(true)
    try {
      let imageURL: string | null = null
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
        imageURL, // null if no file
        timestamp: serverTimestamp(),
      })
      setNewMessage("")
      setImageFile(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (error: any) {
      toast.error("Failed to send message. " + (error.message || ""))
    } finally {
      setIsSending(false)
    }
  }

  const toggleHeader = () => {
    setIsHeaderVisible(!isHeaderVisible)
  }

  const otherTypingUsers = typingUsers.filter(
    (typingUser) => typingUser.userId !== user?.uid && typingUser.isTyping
  )

  // --------------------- RENDER ---------------------
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Desktop header */}
      <header className="bg-gray-100 dark:bg-gray-900 border-b dark:border-gray-800 p-4 hidden lg:block">
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-2 flex flex-col items-center space-y-1">
            <Badge className="bg-green-600 text-white text-xs flex items-center justify-center h-6">
              Payment Confirmed
            </Badge>
            <EngageSupport buttonClass="text-xs h-6 flex items-center p-1" iconSize={16} />
          </Card>

          <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {status === "complete" ? (
              <Badge className="bg-green-600 text-white text-xs flex items-center justify-center h-6">
                Transaction Completed
              </Badge>
            ) : (
              <CompleteTransaction
                groupId={groupId}
                buttonClass="p-1 text-xs h-6 flex items-center justify-center"
                iconSize={16}
              />
            )}

            {status === "cancelled" ? (
              <Badge className="bg-red-600 text-white text-xs flex items-center justify-center h-6">
                Transaction Cancelled
              </Badge>
            ) : (
              <CancelTransaction
                groupId={groupId}
                buttonClass="p-1 text-xs h-6 flex items-center justify-center"
                iconSize={16}
              />
            )}

            <DisputeTransaction
              buttonClass="p-1 text-xs h-6 flex items-center justify-center"
              iconSize={16}
            />
            <XcrowInfo
              itemDescription={itemDescription}
              price={price}
              escrowFee={escrowFee}
              escrowFeeResponsibility={escrowFeeResp}
              transactionType={transactionType}
              currency={currency}
              buttonClass="text-xs h-6 flex items-center justify-center"
              iconSize={16}
            />
          </div>
        </div>
      </header>

      {/* COMPLETION POPUPS */}
      <CompletionPopup
        open={showPopup}
        message={popupMsg}
        onAgree={handleAgree}
        onDisagree={handleDisagree}
        onClose={(val) => {
          if (!val) setShowPopup(false)
        }}
      />
      <RejectionPopup
        open={showRejectionPopup}
        message={
          rejection?.by === "seller"
            ? "Seller Rejected your Completion Request. Please chat it out."
            : "Buyer Rejected your Completion Request. Please chat it out."
        }
        onClose={handleCloseRejectionPopup}
      />

      {/* CANCEL POPUPS */}
      <CancelPopup
        open={showCancelPopup}
        message={cancelPopupMsg}
        onAgree={handleAgreeCancel}
        onDisagree={handleDisagreeCancel}
        onClose={(val) => {
          if (!val) setShowCancelPopup(false)
        }}
      />
      <CancelRejectionPopup
        open={showCancelRejectionPopup}
        message={
          cancelRejection?.by === "seller"
            ? "Seller Rejected your Cancel Request. Please chat it out."
            : "Buyer Rejected your Cancel Request. Please chat it out."
        }
        onClose={handleCloseCancelRejectionPopup}
      />

      {/* Mobile header */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <Button
          variant="ghost"
          onClick={toggleHeader}
          className="w-full flex justify-between items-center p-2 text-xs"
        >
          <span>Chat Details</span>
          {isHeaderVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {isHeaderVisible && (
          <div className="p-2 space-y-2">
            <div className="flex items-center space-x-2 justify-center">
              <Badge className="bg-green-600 text-white text-xs flex items-center justify-center h-6">
                Payment Confirmed
              </Badge>
              <EngageSupport buttonClass="text-xs h-6 flex items-center" iconSize={14} />
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {status === "complete" ? (
                <Badge className="bg-green-600 text-white text-xs flex items-center justify-center h-6">
                  Transaction Completed
                </Badge>
              ) : (
                <CompleteTransaction
                  groupId={groupId}
                  buttonClass="text-xs h-6 flex items-center justify-center"
                  iconSize={14}
                />
              )}

              {status === "cancelled" ? (
                <Badge className="bg-red-600 text-white text-xs flex items-center justify-center h-6">
                  Transaction Cancelled
                </Badge>
              ) : (
                <CancelTransaction
                  groupId={groupId}
                  buttonClass="text-xs h-6 flex items-center justify-center"
                  iconSize={14}
                />
              )}

              <DisputeTransaction
                buttonClass="text-xs h-6 flex items-center justify-center"
                iconSize={14}
              />
              <XcrowInfo
                itemDescription={itemDescription}
                price={price}
                escrowFee={escrowFee}
                escrowFeeResponsibility={escrowFeeResp}
                transactionType={transactionType}
                currency={currency}
                buttonClass="text-xs h-6 flex items-center justify-center"
                iconSize={14}
              />
            </div>
          </div>
        )}
      </div>

      {/* Chat messages area */}
      <ScrollArea className="flex-grow p-4">
        <div className="mb-4 text-center space-x-2">
          <Badge variant="secondary" className="bg-gray-800 text-white text-xs">
            Group created by {creatorName || "Unknown"}
          </Badge>
          <Badge variant="outline" className="text-gray-400 border-gray-700 text-xs">
            {participantsCount} participant{participantsCount > 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex ${
                  msg.senderId === user?.uid ? "flex-row-reverse" : "flex-row"
                } items-end space-x-2`}
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage
                    src={`https://api.dicebear.com/6.x/initials/svg?seed=${msg.senderName}`}
                  />
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
                          src={msg.imageURL}
                          alt="Attachment"
                          width={250}
                          height={200}
                          className="rounded-lg mb-2 cursor-pointer w-full h-auto"
                        />
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-gray-900 text-white">
                        <DialogHeader>
                          <DialogTitle>Attached Image</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Sent by {msg.senderName}
                          </DialogDescription>
                        </DialogHeader>
                        <Image
                          src={msg.imageURL}
                          alt="Enlarged"
                          width={800}
                          height={600}
                          className="rounded-lg"
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  <p className="text-xs break-words whitespace-pre-wrap">{msg.content}</p>
                  {msg.timestamp && (
                    <p className="text-[10px] opacity-70 mt-1">
                      {msg.timestamp.toDate().toLocaleString()}
                    </p>
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
          min-width: 80px;
          padding: 6px 8px;
          border-radius: 10px;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }
      `}</style>

      {/* Chat input footer */}
      <footer className="p-2 border-t dark:border-gray-800 bg-white dark:bg-gray-900">
        {otherTypingUsers.map((typingUser) => (
          <div key={typingUser.userId} className="mb-2 flex items-center space-x-2">
            <div className="flex items-center px-2 py-1 bg-gray-800 rounded-full">
              <span className="text-xs font-medium text-gray-300 mr-1">
                {typingUser.displayName}
              </span>
              <TypingBubble />
            </div>
          </div>
        ))}

        <div className="flex flex-col space-y-2">
          {imagePreview && (
            <div className="relative inline-block">
              <Image
                src={imagePreview}
                alt="Preview"
                width={80}
                height={80}
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
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setImageFile(file)
                  setImagePreview(URL.createObjectURL(file))
                }
              }}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="h-8 text-xs text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-800 flex items-center"
            >
              <Paperclip className="w-3 h-3 mr-1" />
            </Button>
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow resize-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
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
              className="bg-emerald-500 hover:bg-orange-500 text-white h-8 text-xs flex items-center"
            >
              <Send className="w-3 h-3 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** Small UI for "someone is typing" bubbles. */
function TypingBubble() {
  return (
    <div className="flex items-center space-x-[2px]">
      <div className="bg-gray-400 w-1.5 h-1.5 rounded-full animate-bounce" />
      <div className="bg-gray-400 w-1.5 h-1.5 rounded-full animate-bounce animation-delay-200" />
      <div className="bg-gray-400 w-1.5 h-1.5 rounded-full animate-bounce animation-delay-400" />
    </div>
  )
}
