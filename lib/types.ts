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
export interface ModalButtonProps {
  /**
   * Optional custom CSS class for the button.
   * e.g. "text-xs h-6 flex items-center"
   */
  buttonClass?: string

  /**
   * Optional icon size if you want smaller or larger icons.
   * e.g. 14, 16, 20, etc.
   */
  iconSize?: number
}
