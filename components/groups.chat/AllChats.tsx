import React, { useState } from 'react'
// import { getColorForLetter } from "@/utils/utils";
import { error, grey, success } from '../ui/color'
import { Users, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import Typography from '../ui/typography'

type Members = {
  count: number
}

// Types for simplified Folder and Chat data
type Chat = {
  chatId: string
  title: string
  amount: number
  currency: string
  startTime: string
  endTime: string
  completionTime?: string
  status: string
  color: string
}

type Folder = {
  folderId: string
  type: string
  chats: Chat[]
  members: Members
}

// Define the type for the props that AllChats will receive
type AllChatsProps = {
  data: Folder // Use Folder type here
}

function AllChats({ data }: AllChatsProps) {
  // State to track the selected chat ID
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  // Function to handle chat click and set selected chat ID
  const handleChatClick = (chatId: string) => {
    setSelectedChatId(chatId)
  }

  return (
    <div
      className="w-full flex flex-col gap-[1rem] dark:text-gray-50 cursor-pointer"
      style={{
        color: `${grey[600]}`, // Default text color
      }}
    >
      <div className="w-full">
        {/* Map through the chats in the folder */}
        {data?.chats?.map((chat) => (
          <div
            key={chat.chatId}
            style={{
              padding: '0.3rem 1rem',
            }}
            className={cn(
              'w-full flex flex-col gap-[1rem] active:bg-gray-300 dark:active:bg-gray-800', // Removed hover effect from the base class
              {
                // Conditionally apply styles based on whether the chat is selected
                'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-white':
                  selectedChatId === chat?.chatId,
                'bg-transparent text-gray-700 dark:text-gray-200':
                  selectedChatId !== chat.chatId,
                // Apply hover effect only if the chat is not selected
                'hover:bg-gray-100 dark:hover:bg-gray-900':
                  selectedChatId !== chat.chatId,
              }
            )}
            onClick={() => handleChatClick(chat.chatId)} // Handle click to set selected chat
          >
            <div className="w-full flex justify-between">
              <div className="w-auto flex flex-col gap-[0.3rem]">
                <div className="flex items-center gap-[1rem]">
                  <div
                    style={{
                      color: data.type === 'Buy' ? success[500] : error[600],
                      fontWeight: 'bold',
                    }}
                  >
                    <Typography variant="p">{data.type}</Typography>{' '}
                    {/* Display chat type */}
                  </div>
                  <div
                    title="3 Users"
                    style={{
                      color: `${grey[400]}`,
                    }}
                    className="flex items-center "
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <Typography variant="p" className="font-bold">
                      3
                    </Typography>
                  </div>
                </div>
                <Typography variant="span" className="dark:text-[#c4c4c4]">
                  {chat.startTime} {/* Display timestamp */}
                </Typography>
              </div>
              <div className="flex items-center ">
                <div
                  style={{
                    color: chat.color,
                    // fontWeight: "bold",
                    fontSize: '0.85rem',
                  }}
                >
                  {chat.status} {/* Display countdown */}
                </div>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="w-full flex items-center gap-[0.5rem]">
              <Typography
                variant="span"
                title={chat.title}
                className="truncate cursor-default mr-auto"
              >
                {chat.title}
              </Typography>
              <Typography
                variant="p"
                className="font-bold whitespace-nowrap ml-auto"
              >
                {chat.currency} {chat.amount}{' '}
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AllChats
