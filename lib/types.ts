// lib/types.ts

export interface Group {
    id: string
    name: string
    photoURL: string
    lastMessage: string
    lastMessageTimestamp: string
  }
  
  export interface Message {
    id: string
    senderId: string
    senderName: string
    content: string
    timestamp: string
  }