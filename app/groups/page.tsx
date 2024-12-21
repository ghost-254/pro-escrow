'use client'
import {
  folders,
  //  chats
} from '@/components/dummyData/DummyData'
import AllChats from '@/components/groups.chat/AllChats'
import Chat from '@/components/groups.chat/Chat'
import Search from '@/components/search/Search'
import React from 'react'

function Group() {
  return (
    <div className="w-full flex gap-[1rem] flex-1 break-all">
      {/* Left section: Folders and Chats */}
      <div
        style={{ width: '35%' }}
        className="flex flex-col h-screen border-r-[1px] border-[#f0f0f0] dark:border-[#202020]"
      >
        <div style={{ padding: '1rem' }}>
          <Search />
        </div>
        <div className="flex flex-col">
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
      <div style={{ width: '65%' }} className="flex">
        <Chat />
      </div>
    </div>
  )
}

export default Group
