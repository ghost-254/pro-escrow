'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebars/sidebar'
import { toggleTransactModal } from '@/app/global.redux/stores/reducers/transact.reducer'
import { useDispatch, useSelector } from 'react-redux'
import Transact from '../create/Transact'
import Modal from '../ui/modal'
import AddFunds from '../create/AddFunds'
import { toggleAddFundsModal } from '@/app/global.redux/stores/reducers/addfunds.reducer'
// import { RootState } from '@/app/global.redux/stores/store'

export const SidebarVisibility = ({ children }) => {
  const pathname = usePathname()
  const dispatch = useDispatch()
  const transact = useSelector((state) => state?.transact.open)
  const addfunds = useSelector((state) => state?.addFunds.open)

  const handleCloseTransactModal = () => {
    // Dispatch action to close modal
    dispatch(toggleTransactModal())
  }

  const handleCloseAddFundsModal = () => {
    // Dispatch action to close modal
    dispatch(toggleAddFundsModal())
  }

  const isSidebarVisible = pathname !== '/groups'

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Modal to show create transaction */}
        <Modal left='5%' isOpen={transact} onClose={handleCloseTransactModal}>
        <Transact />
      </Modal>

      {/* Modal to show add funds */}
      <Modal
        width={'50%'}
        left={'23%'}
        top={'10%'}
        isOpen={addfunds}
        onClose={handleCloseAddFundsModal}
      >
        <AddFunds />
      </Modal>

      {/* Sidebar Section */}
      {isSidebarVisible && (
        <div style={{ flex: 0.25, height: '100%' }}>
          <Sidebar />
        </div>
      )}

      {/* Main Content Section */}
      <div
        style={{
          flex: isSidebarVisible ? 0.75 : 1,
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  )
}
