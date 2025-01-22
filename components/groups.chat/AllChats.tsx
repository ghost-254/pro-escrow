/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
// import { getColorForLetter } from "@/utils/utils";
import { error, grey, success } from '../ui/color'
import { Users, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import Typography from '../ui/typography'
import { useDispatch } from 'react-redux'
import { toggleShowDetailedChatInfoModal } from '@/lib/slices/chat.moreinfo.reducer'

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

function AllChats({
  data,
  onSelectChat,
}: AllChatsProps & { onSelectChat: (chatId: string) => void }) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const dispatch = useDispatch()

  const handleChatClick = (chatId: string) => {
    setSelectedChatId(chatId)
    onSelectChat(chatId) // Invoke the handler when a chat is selected
  }

  const handleOpenModal = () => {
    dispatch(toggleShowDetailedChatInfoModal())
  }

  return (
    <div
      className="w-full flex flex-col gap-[1rem] dark:text-gray-50 cursor-pointer"
      style={{ color: `${grey[600]}` }}
    >
      <div className="w-full">
        {data?.chats?.map((chat) => (
          <div
            key={chat.chatId}
            style={{ padding: '0.3rem 1rem' }}
            className={cn(
              'w-full flex flex-col gap-[1rem] active:bg-gray-300 dark:active:bg-gray-800',
              {
                'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-white':
                  selectedChatId === chat?.chatId,
                'bg-transparent text-gray-700 dark:text-gray-200':
                  selectedChatId !== chat.chatId,
                'hover:bg-gray-100 dark:hover:bg-gray-900':
                  selectedChatId !== chat.chatId,
              }
            )}
            onClick={() => handleChatClick(chat.chatId)}
          >
            <div className="w-full flex justify-between">
              <div className="w-auto flex flex-col gap-[0.3rem]">
                <div className="flex items-center gap-[1rem]">
                  <Typography
                    style={{
                      color: data.type === 'Buy' ? success[500] : error[600],
                      fontWeight: 'bold',
                    }}
                    variant="p"
                  >
                    {data.type}
                  </Typography>
                  <div
                    title="View"
                    style={{ color: `${grey[400]}` }}
                    className="flex items-center hover:opacity-[0.6]"
                    onClick={handleOpenModal}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <Typography variant="p" className="font-bold">
                      {data.members.count}
                    </Typography>
                  </div>
                </div>
                <Typography variant="span" className="dark:text-[#c4c4c4]">
                  {chat.startTime}
                </Typography>
              </div>
              <div className="flex items-center">
                <div style={{ color: chat.color, fontSize: '0.85rem' }}>
                  {chat.status}
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
                {chat.currency} {chat.amount}
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AllChats
