'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebars/sidebar'
import { toggleTransactModal } from '@/app/global.redux/stores/reducers/transact.reducer'
import { useDispatch, useSelector } from 'react-redux'
import Transact from '../create/Transact'
import Modal from '../ui/modal'
import AddFunds from '../create/AddFunds'
import { toggleAddFundsModal } from '@/app/global.redux/stores/reducers/addfunds.reducer'

export const SidebarVisibility = ({ children }) => {
  const pathname = usePathname()
  const dispatch = useDispatch()
  const transact = useSelector((state) => state?.transact.open)
  const addfunds = useSelector((state) => state?.addFunds.open)

  const handleCloseTransactModal = () => {
    dispatch(toggleTransactModal())
  }

  const handleCloseAddFundsModal = () => {
    dispatch(toggleAddFundsModal())
  }

  const isSidebarVisible = pathname !== '/groups'

  return (
    <div className="h-full w-full flex">
      {/* Modal to show create transaction */}
      <Modal left="5%" isOpen={transact} onClose={handleCloseTransactModal}>
        <Transact />
      </Modal>

      {/* Modal to show add funds */}
      <Modal
        width="50%"
        left="23%"
        top="10%"
        isOpen={addfunds}
        onClose={handleCloseAddFundsModal}
      >
        <AddFunds />
      </Modal>

      {/* Sidebar Section */}
      {isSidebarVisible && (
        <div
          className="hidden lg:block bg-gray-100 h-full"
          style={{
            width: '25%', // Sidebar takes 25% width on larger screens
          }}
        >
          <Sidebar />
        </div>
      )}

      {/* Main Content Section */}
      <div
        className="h-full"
        style={{
          width: isSidebarVisible ? '75%' : '100%', // Sidebar takes 75% if visible, otherwise full width
          flexGrow: 1,
        }}
      >
        {children}
      </div>
    </div>
  )
}
