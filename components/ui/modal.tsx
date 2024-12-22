import React, { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed z-[6] inset-0 bg-black bg-opacity-[0.85]" />
        <Dialog.Content className="fixed z-[7] overflow-y-auto  inset-1/4 bg-white dark:bg-gray-900 rounded-md shadow-lg">
          {/* Modal body will be dynamic */}
          <div>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default Modal
