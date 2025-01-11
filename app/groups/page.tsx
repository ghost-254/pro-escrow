'use client'
import React from 'react'
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
  // Get the current state of modal visibility from Redux
  const open = useSelector((state: RootState) => state?.chatInfo.open)

  const dispatch = useDispatch()

  const handleCloseModal = () => {
    // Dispatch action to close modal
    dispatch(toggleShowDetailedChatInfoModal())
  }

  return (
    <div className="w-full flex relative">
      {/* Modal to show DetailedChatInfo */}
      <Modal isOpen={open} onClose={handleCloseModal}>
        <DetailedChatInfo />
      </Modal>

      {/* Left section: Folders and Chats */}
      <div
        style={{ width: '35%' }}
        className="flex flex-col h-screen border-r-[1px] border-[#e7e7e7] dark:border-[#202020]"
      >
        <div
          style={{ padding: '1rem 0.5rem' }}
          className="flex w-full items-center gap-[0.5rem]"
        >
          <Button title="Back" variant={'hoverIcons'}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-full">
            <Search />
          </div>
        </div>
        <div className="flex flex-col max-h-screen overflow-y-auto pb-[5rem]">
          {folders.map((folder) => (
            <div
              className="border-b-[1px] border-[#dddddd] dark:border-[#202020]"
              style={{
                width: '100%',
              }}
              key={folder?.folderId}
            >
              <AllChats data={folder} />
            </div>
          ))}
        </div>
      </div>

      {/* Right section: Chat View */}
      <div style={{ width: '65%' }}>
        <Chat />
      </div>
    </div>
  )
}

export default Group
