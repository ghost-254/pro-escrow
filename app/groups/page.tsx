'use client'
import {
  folders,
  //  chats
} from '@/components/dummyData/DummyData'
import AllChats from '@/components/groups.chat/AllChats'
import Chat from '@/components/groups.chat/Chat'
import Search from '@/components/search/Search'
import React from 'react'
import { ArrowLeft } from 'lucide-react'

function Group() {
  return (
    <div className="w-full flex ">
      {/* Left section: Folders and Chats */}
      <div
        style={{ width: '35%' }}
        className="flex flex-col h-screen border-r-[1px] border-[#f0f0f0] dark:border-[#202020]"
      >
        <div
          style={{ padding: '1rem 0.5rem' }}
          className="flex w-full items-center gap-[0.5rem]"
        >
          <button
            title="Back"
            className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-[5px]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-full">
            <Search />
          </div>
        </div>
        <div className="flex flex-col max-h-screen overflow-y-auto pb-[5rem]">
          {folders.map((folder) => (
            <div
              className="border-b-[1px] border-[#f0f0f0] dark:border-[#202020]"
              style={{
                // borderRadius: "5px",
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
