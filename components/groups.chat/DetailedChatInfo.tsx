import { LogOut, X } from 'lucide-react'
import React from 'react'
import Typography from '../ui/typography'
import { Button } from '../ui/button'
import { getColorForLetter } from '@/utils/utils'
import { useDispatch } from 'react-redux'
import { toggleShowDetailedChatInfoModal } from '@/app/global.redux/stores/reducers/chat.moreinfo.reducer'

function DetailedChatInfo() {
  const dispatch = useDispatch()

  const handleCloseModal = () => {
    // Dispatch action to close modal
    dispatch(toggleShowDetailedChatInfoModal())
  }
  const text: string =
    'Buying Chat Home Base, Text Factory and Screening Buying Chat Home Base, Text Factory and Screening'

  type MEMBERS = {
    name: string
    role: string
    joined: string
  }

  // Define a list of members
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
    <div className="w-full flex flex-col gap-[0.5rem]">
      <div
        style={{ padding: '0.5rem 1rem' }}
        className="w-full flex sticky top-0 bg-background z-[2] dark:bg-gray-900 justify-between items-center border-b-[1px] border-[#ccc] dark:border-[#202020]"
      >
        <Typography className="max-w-[90%] font-semibold" variant="h2">
          {text}
        </Typography>
        <button
          onClick={handleCloseModal}
          title="Close"
          className="flex items-center justify-center p-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 rounded-[5px]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="w-full px-[1rem] border-b-[1px] pb-[0.7rem] border-[#ccc] dark:border-[#202020]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.5rem]">
            <Typography variant="p">Amount Deposited:</Typography>
            <Typography variant="h1" className="font-bold">
              USD 1000
            </Typography>
          </div>
          <Button
            variant="destructive"
            className="flex items-center text-white dark:bg-red-500 cursor-pointer hover:opacity-[0.87]"
          >
            <LogOut className="w-4 h-4" />
            Leave group
          </Button>
        </div>
      </div>

      <div className="w-full px-[0.5rem] border-b-[1px] pb-[0.7rem] border-[#ccc] dark:border-[#202020]">
        <div className="flex items-center gap-[0.5rem]">
          {/* show red if exceeded time for release */}
          <Button variant="secondary" className="text-white cursor-default">
            00h:15m:30s
          </Button>
          <div className="flex items-center gap-[0.5rem]">
            <Typography variant="p">Created:</Typography>
            <Typography variant="span" className='font-medium'>22-05-2025 12:00 PM</Typography>
            <Typography variant="span">by</Typography>
            <Typography variant="span" className='font-medium'>Alice*******</Typography>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[1rem] py-[0.5rem] px-[1rem]">
        <Typography variant="h1" className="font-bold">
          Members({members.length})
        </Typography>
        <div className="flex flex-col gap-[1rem]">
          {members.map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b-[1px] border-[#dddddd] dark:border-[#202020] pb-[0.5rem]"
            >
              <div className="flex items-center gap-[0.5rem]">
                <div
                  style={{ backgroundColor: getColorForLetter(member.name[0]) }}
                  className="w-[2rem] h-[2rem] grid place-items-center justify-center rounded-full font-semibold text-white"
                >
                  {member.name[0]}
                </div>
                <div>
                  <Typography variant="p">{member.name}</Typography>
                  <Typography variant="p">{member.role}</Typography>
                </div>
              </div>
              <div className="text-end">
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
