import React from 'react'
import { Power, ClipboardList } from 'lucide-react'
import { useDispatch } from 'react-redux'
import truncate from '@/lib/truncate'
import Typography from '../ui/typography'
import { toggleShowDetailedChatInfoModal } from '@/app/global.redux/stores/reducers/chat.moreinfo.reducer'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'

type HeaderProps = {
  handleBackToChats: () => void
}

function Header({ handleBackToChats }: HeaderProps) {
  const dispatch = useDispatch()

  const handleOpenModal = () => {
    dispatch(toggleShowDetailedChatInfoModal())
  }

  const text: string =
    'USD 1000 - Buying Chat Home Base, Text Factory and Screening Buying Chat Home Base, Text Factory and Screening'

  return (
    <div className="w-full relative bg-background z-[2] border-b">
      <div
        style={{ padding: ' 0.5rem' }}
        className="w-full flex-col lg:flex-row gap-[0.5rem] lg:gap-0 flex lg:justify-between"
      >
        <div className="flex gap-[0.5rem] items-center">
          <Button
            onClick={handleBackToChats}
            title="Back"
            variant={'hoverIcons'}
          >
            <ArrowLeft className="w-3 h-3" />
          </Button>
          <div>
            <Button title="Engage Support" variant={'hoverIcons'}>
              <Power className="w-4 h-4" />
            </Button>
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

        <div className="hidden lg:block">
          <div className="w-full flex gap-[0.5rem] items-center">
            <Button title="Orders" variant={'hoverIcons'}>
              <ClipboardList className="w-4 h-4" />
            </Button>
            <Button variant="secondary" className="text-white">
              Mark Delivered
            </Button>
            <Button
              variant="destructive"
              className="text-white dark:bg-red-500"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
