import { getColorForLetter } from '@/utils/utils'
import React from 'react'
import Typography from '../ui/typography'
import { Download, Eye } from 'lucide-react'
import VideoPlayer from '../ui/videoplayer'
import Image from 'next/image'

function Body() {
  const videoUrl: string = 'https://youtu.be/Uid0NaifrSM?list=RDUid0NaifrSM'
  const imageUrl =
    'https://avatars.mds.yandex.net/i?id=e0e7d8d201b683692e58e03677a27dce7311ad1f-10595607-images-thumbs&n=13'

  return (
    <div className="w-full pt-[5.5rem] pb-[9.5rem] px-[1rem] flex flex-col gap-[1rem] break-all">
      {/* Welcome Message */}
      <div className="flex flex-col text-[0.77rem]">
        <Typography
          variant="p"
          style={{ padding: '0.3rem 0.5rem' }}
          className="max-w-[70%] text-sm rounded-md bg-[#f1d9d9] dark:bg-[#ff6969] self-center dark:text-white text-[#ff4f4f]"
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

        {/* Image Preview */}
        <div className="flex gap-[0.5rem] justify-end items-start">
          <div className="relative w-[16rem] grid justify-center place-items-center h-[16rem] ml-auto dark:bg-gray-800 bg-gray-200 rounded-lg overflow-hidden rounded-tr-none">
            <Image
              className="object-cover w-[98%] h-[98%] rounded-md"
              src={imageUrl}
              alt="Preview"
              width={300}
              height={300}
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button
                title="View"
                className="text-white p-2 mr-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                title="Download"
                className="text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Image Caption */}
        <div className="flex gap-[0.5rem] justify-end items-center text-sm">
          <b>K</b>
          <span>12:03 PM</span>
        </div>

        {/* Video Preview */}
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
            <div className="relative grid justify-center w-[19rem] h-[12rem] place-items-center dark:bg-gray-800 bg-gray-200 rounded-lg overflow-hidden rounded-tl-none">
              <VideoPlayer url={videoUrl} rounded={'md'} />
            </div>
            <div className="flex items-center gap-[0.5rem] text-sm">
              <span>12:05 PM</span>
              <b>K</b>
              <span>sent a video</span>
              <div title="Download">
                <a
                  href={videoUrl} // Use the video URL for downloading
                  download="video.mp4" // Filename for download
                >
                  <Download className="w-4 h-4 cursor-pointer" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* User Joined */}
        <Typography variant="span" className="font-medium text-center">
          Olive -CS has joined the chat
        </Typography>
      </div>
    </div>
  )
}

export default Body
