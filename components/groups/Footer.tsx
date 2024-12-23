import React, { useState } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import { Input } from '../ui/input'
import Typography from '../ui/typography'
import Image from 'next/image'

const Footer: React.FC = () => {
  const [message, setMessage] = useState<string>('') // Message state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]) // State for multiple files
  const [previews, setPreviews] = useState<{ [key: string]: string | null }>({}) // Previews for images

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const newPreviews = { ...previews }
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          newPreviews[file.name] = URL.createObjectURL(file) // Generate image preview
        } else {
          newPreviews[file.name] = null // No preview for non-image files
        }
      })
      setSelectedFiles((prev) => [...prev, ...files])
      setPreviews(newPreviews)
    }
  }

  // Remove a specific file
  const removeFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== fileName))
    setPreviews((prev) => {
      const newPreviews = { ...prev }
      delete newPreviews[fileName]
      return newPreviews
    })
  }

  return (
    <div className="w-full bg-background p-4">
      {/* File Preview Section */}
      {selectedFiles?.length > 0 && (
        <div className="mb-4 overflow-y-auto max-h-[15rem] border-[1px] rounded-md p-[0.5rem] border-[#f0f0f0] dark:border-[#202020]">
          {selectedFiles.map((file, index) => (
            <div
              key={file.name}
              className={`flex items-center gap-4 py-[0.3rem] ${
                index !== selectedFiles.length - 1
                  ? 'border-b-[1px] border-[#f0f0f0] dark:border-[#202020]'
                  : ''
              }`}
            >
              {previews[file.name] ? (
                <div className="w-[3.5rem] h-[3.5rem] dark:bg-gray-800 bg-gray-200 rounded-md flex justify-center items-center">
                  <Image
                    className="w-[3.2rem] h-[3.2rem] rounded-md object-cover"
                    src={previews[file.name]!}
                    alt="File Preview"
                    width={120}
                    height={120}
                  />
                </div>
              ) : (
                <Typography
                  variant="span"
                  className="text-sm text-gray-500 break-all w-full"
                >
                  {file.name}
                </Typography>
              )}
              <button
                className="text-red-500 hover:underline flex items-center ml-auto"
                onClick={() => removeFile(file.name)}
              >
                <X className="w-4 h-4 m;-1" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input and Send Button Section */}
      <div className="w-full flex items-center gap-4">
        {/* File Input */}
        <label htmlFor="file-input">
          <Paperclip className="w-4 h-4 cursor-pointer" />
        </label>
        <input
          id="file-input"
          multiple
          type="file"
          accept="*/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Text Input */}
        <div className="w-full border-[1px] border-gray-300 dark:border-gray-700 rounded-[10px]">
          <Input
            id="message"
            className="w-full h-[2.5rem] px-3"
            placeholder={
              selectedFiles.length > 0 ? 'Add a caption' : 'Type a message'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Send Button */}
        <button
          title="Send"
          className={`flex items-center h-[2.5rem] justify-center px-[1rem] rounded-[10px] ${
            message || selectedFiles.length > 0
              ? 'bg-primary text-white cursor-pointer'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!message && selectedFiles.length === 0}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Footer
