'use client'
import React, { useState } from 'react'
import {
  folders,
  //  chats
} from '@/components/dummyData/DummyData'
import Search from '@/components/search/Search'
import AllChats from '@/components/groups.chat/AllChats'
import Chat from '@/components/groups.chat/Chat'
import { ArrowLeft } from 'lucide-react'
import Modal from '@/components/ui/modal'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../global.redux/stores/store'
import { toggleShowDetailedChatInfoModal } from '../global.redux/stores/reducers/chat.moreinfo.reducer'
import DetailedChatInfo from '@/components/groups.chat/DetailedChatInfo'
import { Button } from '@/components/ui/button'

function Group() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const open = useSelector((state: RootState) => state?.chatInfo.open)
  const dispatch = useDispatch()

  const handleCloseModal = () => {
    dispatch(toggleShowDetailedChatInfoModal())
  }

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId)
  }

  const handleBackToChats = () => {
    setSelectedChat(null)
  }

  return (
    <div className="w-full flex relative h-screen">
      <Modal top={'10%'} left="5%" isOpen={open} onClose={handleCloseModal}>
        <DetailedChatInfo />
      </Modal>

      <div
        className={`w-full flex flex-col border-r ${
          selectedChat ? 'hidden' : 'flex'
        } lg:flex lg:w-1/3`}
      >
        <div className="flex items-center gap-2 lg:p-4 p-[0.5rem]">
          <Button title="Back" variant={'hoverIcons'}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-full">
            <Search />
          </div>
        </div>
        <div className="flex flex-col max-h-screen overflow-y-auto pb-20">
          {folders.map((folder) => (
            <div className="border-b" key={folder?.folderId}>
              <AllChats
                data={folder}
                onSelectChat={handleChatSelect} // Pass handler to child component
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className={` flex flex-col w-full ${
          selectedChat ? 'flex' : 'hidden'
        } lg:flex lg:w-2/3`}
      >
        {/* <div className="p-4 border-b flex items-center gap-2">
          <Button onClick={handleBackToChats} title="Back to Chats">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold">Chat</span>
        </div> */}
        <Chat handleBackToChats={handleBackToChats}/>
      </div>
    </div>
  )
}

export default Group
