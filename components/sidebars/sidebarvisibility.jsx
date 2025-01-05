'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebars/sidebar'
import { toggleTransactModal } from '@/app/global.redux/stores/reducers/transact.reducer'
import { useDispatch, useSelector } from 'react-redux'
import Transact from '../create/Transact'
import Modal from '../ui/modal'
// import { RootState } from '@/app/global.redux/stores/store'

export const SidebarVisibility = ({ children }) => {
  const pathname = usePathname()
  const transact = useSelector((state) => state?.transact.open)
  const dispatch = useDispatch()
  const handleCloseTransactModal = () => {
    // Dispatch action to close modal
    dispatch(toggleTransactModal())
  }

  const isSidebarVisible = pathname !== '/groups'

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Modal to show craete transaction */}
      <Modal isOpen={transact} onClose={handleCloseTransactModal}>
        <Transact />
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
