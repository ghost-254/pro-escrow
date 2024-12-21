import { getColorForLetter } from '@/utils/utils'
import React from 'react'

function Body() {
  return (
    <div className="w-full pt-[5.5rem] pb-[9.5rem] px-[1rem] flex flex-col gap-[1rem]">
      {/* Welcome Message */}
      <div className="flex flex-col text-[0.77rem]">
        <p
          style={{ padding: '0.3rem 0.5rem' }}
          className="max-w-[70%] rounded-md bg-[#f1d9d9] dark:bg-[#ff6969] self-center dark:text-white text-[#ff4f4f]"
        >
          This chat is monitored to ensure secure communication while
          maintaining anonymity for all parties.
        </p>
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
            <p className="relative dark:text-gray-400 text-gray-800 text-start dark:bg-gray-800 bg-gray-200 mr-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tl-none">
              Hello, I'm K. How can I assist you?
            </p>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:00 PM</span>
              <b>K</b>
            </div>
          </div>
        </div>

        {/* Message 2 */}
        <div className="flex gap-[0.5rem] justify-end items-start">
          <div className="flex flex-col gap-[0.3rem] text-end">
            <p className="relative dark:text-white text-gray-800 text-start bg-purple-300 dark:bg-purple-500 ml-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tr-none">
              Hi K, this is You. I need help with my transaction.
            </p>
            <div className="flex items-center gap-[0.5rem] justify-end text-sm">
              <b>You</b>
              <span>12:02 PM</span>
            </div>
          </div>
        </div>

        {/* Message 3 */}
        <div className="flex gap-[0.5rem] items-start">
          <div>
            <div
              style={{ backgroundColor: getColorForLetter('Recipient') }}
              className="w-[2rem] h-[2rem] grid place-items-center justify-center rounded-full font-semibold text-white"
            >
              R
            </div>
          </div>
          <div className="flex flex-col gap-[0.3rem]">
            <p className="relative dark:text-gray-400 text-gray-800 text-start dark:bg-gray-800 bg-gray-200 mr-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tl-none">
              Hello, I'm the Recipient. How can I help you both?
            </p>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:05 PM</span>
              <b>Recipient</b>
            </div>
          </div>
        </div>

        {/* Message 4 */}
        <div className="flex gap-[0.5rem] justify-end items-start">
          <div className="flex flex-col gap-[0.3rem] text-end">
            <p className="relative dark:text-white text-gray-800 text-start bg-purple-300 dark:bg-purple-500 ml-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tr-none">
              I am wondering about the current status of my transaction.
            </p>
            <div className="flex items-center gap-[0.5rem] justify-end text-sm">
              <b>You</b>
              <span>12:06 PM</span>
            </div>
          </div>
        </div>

        {/* Message 5 */}
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
            <p className="relative dark:text-gray-400 text-gray-800 text-start dark:bg-gray-800 bg-gray-200 mr-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tl-none">
              Your transaction is under review, and we are ensuring everything is in order.
            </p>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:08 PM</span>
              <b>K</b>
            </div>
          </div>
        </div>

        {/* Message 6 */}
        <div className="flex gap-[0.5rem] justify-end items-start">
          <div className="flex flex-col gap-[0.3rem] text-end">
            <p className="relative dark:text-white text-gray-800 text-start bg-purple-300 dark:bg-purple-500 ml-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tr-none">
              Thanks for the update! I am happy to wait for the review.
            </p>
            <div className="flex items-center gap-[0.5rem] justify-end text-sm">
              <b>You</b>
              <span>12:10 PM</span>
            </div>
          </div>
        </div>

        {/* Message 7 */}
        <div className="flex gap-[0.5rem] items-start">
          <div>
            <div
              style={{ backgroundColor: getColorForLetter('Recipient') }}
              className="w-[2rem] h-[2rem] grid place-items-center justify-center rounded-full font-semibold text-white"
            >
              R
            </div>
          </div>
          <div className="flex flex-col gap-[0.3rem]">
            <p className="relative dark:text-gray-400 text-gray-800 text-start dark:bg-gray-800 bg-gray-200 mr-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tl-none">
              Let us know if you need any further assistance in the meantime.
            </p>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:12 PM</span>
              <b>Recipient</b>
            </div>
          </div>
        </div>

        {/* Message 8 */}
        <div className="flex gap-[0.5rem] justify-end items-start">
          <div className="flex flex-col gap-[0.3rem] text-end">
            <p className="relative dark:text-white text-gray-800 text-start bg-purple-300 dark:bg-purple-500 ml-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tr-none">
              Sure, I will reach out if I need anything else.
            </p>
            <div className="flex items-center gap-[0.5rem] justify-end text-sm">
              <b>You</b>
              <span>12:15 PM</span>
            </div>
          </div>
        </div>

        {/* Message 9 */}
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
            <p className="relative dark:text-gray-400 text-gray-800 text-start dark:bg-gray-800 bg-gray-200 mr-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tl-none">
              Great! We'll be in touch if anything else is needed for the transaction.
            </p>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:18 PM</span>
              <b>K</b>
            </div>
          </div>
        </div>

        {/* Message 10 */}
        <div className="flex gap-[0.5rem] justify-end items-start">
          <div className="flex flex-col gap-[0.3rem] text-end">
            <p className="relative dark:text-white text-gray-800 text-start bg-purple-300 dark:bg-purple-500 ml-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tr-none">
              Thanks for the confirmation, K!
            </p>
            <div className="flex items-center gap-[0.5rem] justify-end text-sm">
              <b>You</b>
              <span>12:20 PM</span>
            </div>
          </div>
        </div>

        {/* Message 11 */}
        <div className="flex gap-[0.5rem] items-start">
          <div>
            <div
              style={{ backgroundColor: getColorForLetter('Recipient') }}
              className="w-[2rem] h-[2rem] grid place-items-center justify-center rounded-full font-semibold text-white"
            >
              R
            </div>
          </div>
          <div className="flex flex-col gap-[0.3rem]">
            <p className="relative dark:text-gray-400 text-gray-800 text-start dark:bg-gray-800 bg-gray-200 mr-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tl-none">
              If you need anything else, feel free to ask.
            </p>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:23 PM</span>
              <b>Recipient</b>
            </div>
          </div>
        </div>

        {/* Message 12 */}
        <div className="flex gap-[0.5rem] justify-end items-start">
          <div className="flex flex-col gap-[0.3rem] text-end">
            <p className="relative dark:text-white text-gray-800 text-start bg-purple-300 dark:bg-purple-500 ml-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tr-none">
              Will do! Appreciate the support.
            </p>
            <div className="flex items-center gap-[0.5rem] justify-end text-sm">
              <b>You</b>
              <span>12:25 PM</span>
            </div>
          </div>
        </div>

        {/* Message 13 */}
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
            <p className="relative dark:text-gray-400 text-gray-800 text-start dark:bg-gray-800 bg-gray-200 mr-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tl-none">
              You're welcome! Let me know if anything changes.
            </p>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:28 PM</span>
              <b>K</b>
            </div>
          </div>
        </div>

        {/* Message 14 */}
        <div className="flex gap-[0.5rem] justify-end items-start">
          <div className="flex flex-col gap-[0.3rem] text-end">
            <p className="relative dark:text-white text-gray-800 text-start bg-purple-300 dark:bg-purple-500 ml-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tr-none">
              I will! Have a good day ahead.
            </p>
            <div className="flex items-center gap-[0.5rem] justify-end text-sm">
              <b>You</b>
              <span>12:30 PM</span>
            </div>
          </div>
        </div>

        {/* Message 15 */}
        <div className="flex gap-[0.5rem] items-start">
          <div>
            <div
              style={{ backgroundColor: getColorForLetter('Recipient') }}
              className="w-[2rem] h-[2rem] grid place-items-center justify-center rounded-full font-semibold text-white"
            >
              R
            </div>
          </div>
          <div className="flex flex-col gap-[0.3rem]">
            <p className="relative dark:text-gray-400 text-gray-800 text-start dark:bg-gray-800 bg-gray-200 mr-auto min-w-[20%] max-w-[70%] px-[1rem] py-[0.5rem] rounded-lg rounded-tl-none">
              You too! Take care.
            </p>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:35 PM</span>
              <b>Recipient</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Body
