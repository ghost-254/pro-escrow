import { getColorForLetter } from '@/utils/utils'
import React from 'react'
import Typography from '../ui/typography'

function Body() {
  return (
    <div className="w-full pt-[5.5rem] pb-[9.5rem] px-[1rem] flex flex-col gap-[1rem]">
      {/* Welcome Message */}
      <div className="flex flex-col text-[0.77rem]">
        <Typography
          variant="p"
          style={{ padding: '0.3rem 0.5rem' }}
          className="max-w-[70%] rounded-md bg-[#f1d9d9] dark:bg-[#ff6969] self-center dark:text-white text-[#ff4f4f]"
        >
          This chat is monitored to ensure secure communication while
          maintaining anonymity for all parties.
        </Typography>
      </div>

      {/* Chat Messages */}
      <div className="flex flex-col gap-[0.5rem]">
        {/* Message 1 */}
        <div className="flex gap-[0.5rem] items-start">
          <div>
            <div
              style={{ backgroundColor: getColorForLetter('K') }}
              className="w-[2rem] h-[2rem] grid place-items-center justify-center rounded-full font-semibold text-white"
            >
              K
            </div>
          </div>
          <div className="flex flex-col gap-[0.3rem]">
            <Typography
              variant="p"
              className="relative dark:text-gray-400 text-gray-800 text-start dark:bg-gray-800 bg-gray-200 mr-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tl-none"
            >
              Hello, I'm K. How can I assist you?
            </Typography>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:00 PM</span>
              <b>K</b>
              <span>seen</span>
            </div>
          </div>
        </div>

        {/* Message 2 */}
        <div className="flex gap-[0.5rem] justify-end items-start">
          <div className="flex flex-col gap-[0.3rem] text-end">
            <Typography
              variant="p"
              className="relative dark:text-white text-gray-800 text-start bg-purple-300 dark:bg-purple-600 ml-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tr-none"
            >
              Hi K, this is You. I need help with my transaction.
            </Typography>
            <div className="flex items-center gap-[0.5rem] justify-end text-sm">
              <b>You</b>
              <Typography variant="span">12:02 PM</Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Body
