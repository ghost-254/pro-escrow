import React, { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { Input } from '../ui/input'

const Footer: React.FC = () => {
  const [message, setMessage] = useState<string>('') // Added TypeScript type annotation for state

  return (
    <div className="w-full bg-background" style={{ padding: '1rem' }}>
      <div className="w-full flex items-center gap-[0.6rem]">
        <div className="w-full h-[2.5rem] flex items-center gap-[0.5rem]">
          <Paperclip className="w-4 h-4 cursor-pointer" />
          <div
            style={{ borderRadius: '10px' }}
            className="w-[100%] border-[1px] border-[#f0f0f0] dark:border-[#202020]"
          >
            <Input
              className="w-full h-[2.5rem]"
              autoComplete='off'
              autoCorrect='on'
              id="message"
              placeholder="Type a message"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <div>
          <button
            title="Send"
            className={`flex items-center h-[2.5rem] justify-center px-[1rem] rounded-[10px] 
              ${
                message.length > 0
                  ? 'bg-primary text-white' // Primary blue when input is not empty
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-500' // Neutral when empty
              }
            `}
            disabled={message?.length === 0} // Disable the button when input is empty
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Footer
