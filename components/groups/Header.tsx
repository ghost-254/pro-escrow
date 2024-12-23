import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Power,
  ClipboardList,
  //  X
} from 'lucide-react'
import { useDispatch } from 'react-redux'
import { toggleShowDetailedChatInfoModal } from '@/app/GlobalRedux/stores/reducers/chat.moreinfo.reducer'
import truncate from '@/lib/truncate'
import Typography from '../ui/typography'
function Header() {
  const dispatch = useDispatch()

  const handleOpenModal = () => {
    // Dispatch action to close modal
    dispatch(toggleShowDetailedChatInfoModal())
  }

  const text: string =
    'USD 1000 -Buying Chat Home Base, Text Factory and Screening Buying Chat Home Base, Text Factory and Screening'
  return (
    <div className="w-full relative bg-background z-[2] border-b-[1px] border-[#f0f0f0] dark:border-[#202020]">
      <div
        style={{ padding: ' 0.5rem' }}
        className="w-full flex justify-between"
      >
        <div className="flex gap-[0.5rem] items-center">
          <div>
            <button
              title="Report"
              className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-[5px]"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
          <Typography
            variant="p"
            title="More"
            onClick={handleOpenModal}
            className="cursor-pointer font-medium max-w-[90%] hover:opacity-[0.77] flex items-center gap-1"
          >
            {truncate(text, 80)}
          </Typography>
        </div>

        <div>
          <div className="w-full flex gap-[0.5rem] items-center">
            <button
              title="Orders"
              className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-[5px]"
            >
              <ClipboardList className="w-4 h-4" />
            </button>
            <Button variant="secondary" className="text-white">
              {/* Release Funds */} Mark Delivered
            </Button>

            <Button
              variant="destructive"
              className="text-white dark:bg-red-500"
            >
              {/* Release Funds */} Cancel
            </Button>
            {/* <button
              title="Close"
              className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-[5px]"
            >
              <X className="w-4 h-4" />
            </button> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
