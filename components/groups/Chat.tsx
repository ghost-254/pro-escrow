import React from 'react'
import Header from './Header'
import Body from './Body'
import Footer from './Footer'

function Chat() {
  return (
    <div className="w-full relative ">
      <div className="absolute top-0 left-0 right-0">
        <Header />
      </div>
      <div className='max-h-[100vh] overflow-y-auto'>
        <Body />
      </div>
      <div className="fixed w-[65%] z-[2] mb-0 bottom-0 right-0">
        <Footer />
      </div>
    </div>
  )
}

export default Chat
