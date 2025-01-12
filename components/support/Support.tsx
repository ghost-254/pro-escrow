'use client'

import React from 'react'
import { Button } from '../ui/button'
import { MessageCircle, Headphones } from 'lucide-react'
import Typography from '../ui/typography'

const Support: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-[1rem] pt-[2rem]">
        <div className='flex flex-col gap-[0.5rem]'>
          {/* Title */}
          <Typography variant="h2" className="dark:text-white font-bold text-center">
            Help Center
          </Typography>
          <Typography variant="p" className="font-medium text-center">
            Chat support to solve any issue that you face
          </Typography>
        </div>

        {/* Social Support Options */}
        <div className="flex flex-col items-center gap-[1rem]">
          {/* Telegram */}
          <Button
            onClick={() =>
              window.open('https://t.me/YourTelegramHandle', '_blank')
            }
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            <MessageCircle className="w-5 h-5" />
            Telegram
          </Button>

          {/* WhatsApp */}
          <Button
            onClick={() =>
              window.open('https://wa.me/YourWhatsAppNumber', '_blank')
            }
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </Button>

          {/* Live Chat */}
          <Button
            onClick={() => alert('Live Chat is coming soon!')}
            className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded"
          >
            <Headphones className="w-5 h-5" />
            Live Chat
          </Button>
        </div>
    </div>
  )
}

export default Support
