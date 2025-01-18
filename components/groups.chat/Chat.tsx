import React from 'react';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';

type ChatProps = {
  handleBackToChats: () => void;
};

function Chat({ handleBackToChats }: ChatProps) {
  return (
    <div className="w-full relative ">
      <div className="absolute top-0 left-0 right-0">
        <Header handleBackToChats={handleBackToChats} />
      </div>
      <div className="max-h-[100vh] overflow-y-auto">
        <Body />
      </div>
      <div className="fixed w-full lg:w-[65%] z-[2] mb-0 bottom-0 right-0">
        <Footer />
      </div>
    </div>
  );
}

export default Chat;
