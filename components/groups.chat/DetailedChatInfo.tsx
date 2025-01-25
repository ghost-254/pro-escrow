import { ClipboardList, LogOut, X } from 'lucide-react'
import React from 'react'
import Typography from '../ui/typography'
import { Button } from '../ui/button'
import { getColorForLetter } from '../../utils/utils'
import { useDispatch } from 'react-redux'
import { toggleShowDetailedChatInfoModal } from '@/lib/slices/chat.moreinfo.reducer'

function DetailedChatInfo() {
  const dispatch = useDispatch()

  const handleCloseModal = () => {
    dispatch(toggleShowDetailedChatInfoModal())
  }

  const text: string =
    'Buying Chat Home Base, Text Factory and Screening Buying Chat Home Base, Text Factory and Screening'

  type MEMBERS = {
    name: string
    role: string
    joined: string
  }

  const members: MEMBERS[] = [
    {
      name: 'Kelvin************',
      role: 'Seller (owner)',
      joined: 'Today 12:30 PM',
    },
    {
      name: 'Alice************',
      role: 'Buyer',
      joined: 'Today 12:45 PM',
    },
  ]

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="p-[1rem] flex sticky top-0 bg-background z-[2] dark:bg-gray-900 justify-between items-center border-b">
        <Typography className="max-w-[90%] font-semibold" variant="p">
          {text}
        </Typography>
        <button
          onClick={handleCloseModal}
          title="Close"
          className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="lg:hidden w-full justify-end border-b pb-4 px-[1rem] flex flex-wrap gap-2">
        <Button title="Orders" variant={'hoverIcons'}>
          <ClipboardList className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-[1rem]">
          <Button variant="secondary" className="text-white flex-1 md:w-auto">
            Mark Delivered
          </Button>
          <Button variant="destructive" className="text-white flex-1 md:w-auto">
            Cancel
          </Button>
        </div>
      </div>

      <div className="w-full lg:px-4 px-[1rem] border-b pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center gap-2">
            <Typography variant="p" className="text-sm">
              Amount Deposited:
            </Typography>
            <Typography variant="h1" className="font-bold text-lg">
              USD 1000
            </Typography>
          </div>
          <Button
            variant="destructive"
            className="mt-2 md:mt-0 w-full md:w-auto flex items-center text-white dark:bg-red-500 hover:opacity-90"
          >
            <LogOut className="w-4 h-4" />
            Leave group
          </Button>
        </div>
      </div>

      <div className="w-full px-[1rem] md:px-4 border-b pb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-[1rem]">
          <Button
            variant="secondary"
            className="text-white cursor-default w-full md:w-auto"
          >
            00h:15m:30s
          </Button>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Typography variant="p">Created:</Typography>
            <Typography variant="span" className="font-medium">
              22-05-2025 12:00 PM
            </Typography>
            <Typography variant="span">by</Typography>
            <Typography variant="span" className="font-medium">
              Alice*******
            </Typography>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 py-2 px-[1rem] lg:px-4">
        <Typography variant="h1" className="font-bold text-lg">
          Members ({members.length})
        </Typography>
        <div className="w-full grid gap-4">
          {members.map((member, index) => (
            <div
              key={index}
              className="flex flex-col gap-[1rem] md:flex-row justify-between items-start md:items-center border-b pb-2"
            >
              <div className=" flex items-center gap-[0.5rem]">
                <div
                  style={{
                    backgroundColor: getColorForLetter(member.name[0]),
                  }}
                  className="w-8 h-8 grid place-items-center rounded-full font-semibold text-white"
                >
                  {member.name[0]}
                </div>
                <div>
                  <Typography
                    variant="p"
                    className="text-sm md:text-base truncate"
                  >
                    {member.name}
                  </Typography>
                  <Typography variant="p" className="text-xs md:text-sm">
                    {member.role}
                  </Typography>
                </div>
              </div>
              <div className="flex lg:flex-col gap-[0.5rem] text-sm md:text-base text-right">
                <Typography variant="p" className="font-medium">
                  Joined
                </Typography>
                <Typography variant="p">{member.joined}</Typography>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DetailedChatInfo
