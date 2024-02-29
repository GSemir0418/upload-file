"use client"
import { getFilesFromDirectoryEntry } from '@/utils/get-files-from-directory-entry'
import { upload } from '@/utils/upload'
import axios, { AxiosResponse } from 'axios'
import React, { DragEventHandler, useRef, useState } from 'react'
import { FaCloudUploadAlt } from 'react-icons/fa'

interface Props {
  onComplete: (response: AxiosResponse) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const FILE_TYPE = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'
]

export const UploadDropzone: React.FC<Props> = ({ onComplete }) => {
  const [percent, setPercent] = useState(0)

  const cancelSourceRef = useRef(axios.CancelToken.source())

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()

    if (percent === 0) {
      const items = e.dataTransfer?.items

      if (items?.length) {
        for (const item of items) {
          const entry = item.webkitGetAsEntry()

          getFilesFromDirectoryEntry(entry).then((files) => {
            const file = files[0]
            uploadFile(file) 
          })
        }
      }
    }
  }

  const handleDragOver: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
  } 

  const handleFileChange:React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files?.[0]
      uploadFile(file)
    }
  }

  const handleClick = () => {
    if (percent === 0) {
      fileInputRef.current?.click()
    }
  }

  const uploadFile = (file: File) => {
    if (!FILE_TYPE.includes(file.type)) {
      alert('不支持的文件格式')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('文件大于 5M')
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    
    upload({
      onUploadProgress: (event: any) => {
        let percentCompleted = Math.round((100 * event.loaded) / event.total)
        setPercent(percentCompleted)
      },
      formData,
      cancelSource: cancelSourceRef.current
    })
      .then(response => {
        onComplete(response)
      })
      .catch(err => {
        if (axios.isCancel(err)) {
          console.log('Request canceled', err.message);
          setPercent(0)
        } else {
          console.error(err);
        }
      })
      .finally(() => setTimeout(() => setPercent(0), 1500))
  }

  const handleAbort = () => {
    cancelSourceRef.current.cancel('cancel upload')
  }

  return (
    <div
      className='bg-zinc-100 h-1/2 w-1/2 min-w-48 min-h-48 border-solid border-2 flex flex-col justify-center items-center cursor-pointer p-4'
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <p className='w-full flex text-xl justify-center items-center mb-4'>
        <FaCloudUploadAlt className='w-14 text-zinc-800'/>拖拽上传
      </p>
      {
        percent > 0 ? (
          <div className='flex w-full'>
            <progress value={percent} max='100' className='flex-1'>{percent}%</progress>
            <span className='ml-auto text-rose-700' onClick={handleAbort}>
              X
            </span>
          </div>
        ) : (
          <>
            <p className='text-zinc-400 text-sm'>
              将目录或文件拖拽到此进行扫描
            </p>
            <p className='text-zinc-400 text-sm'>
              支持 .jpg .jpeg .webp .png .pdf
            </p>
            <p className='text-zinc-400 text-sm'>
              每个文件的最大尺寸: 5M
            </p>
          </>  
        )
      }
      <input
        className='hidden'
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
      />
    </div>
  )
}