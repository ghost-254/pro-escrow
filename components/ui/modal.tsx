import React, { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import 'animate.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  width?: string // Optional prop for width
  left?: string // Optional prop for width
  top?: string // Optional prop for width
  maxHeight?: string // Optional prop for height
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  width = '90%',
  left = '5rem',
  top= '5%', // Centers the modal vertically
  maxHeight = '90vh',
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed animate__animated animate__fadeIn z-[5] inset-0 bg-black bg-opacity-[0.6] dark:bg-opacity-[0.8]" />
        <Dialog.Content
          className="fixed animate__animated animate__fadeInDownBig overflow-y-auto z-[7] bg-white dark:bg-gray-900 rounded-md shadow-lg"
          style={{
            width,
            maxHeight,
            top, // Centers the modal vertically
            left, // Centers the modal horizontally
            transform: 'translate(-50%, -50%)',
          }} // Dynamically set width and height
        >
          <Dialog.DialogTitle></Dialog.DialogTitle>
          {/* Modal body will be dynamic */}
          <div>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default Modal
