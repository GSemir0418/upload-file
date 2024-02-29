"use client"
import { getFilesFromDirectoryEntry } from '@/utils/get-files-from-directory-entry'
import React, { DragEventHandler, useRef } from 'react'
import { FaCloudUploadAlt } from "react-icons/fa";

interface Props {}
export const UploadFiles: React.FC<Props> = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onDrop: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    const items = e.dataTransfer?.items
    if (items?.length) {
      for (const item of items) {
        const entry = item.webkitGetAsEntry()
        getFilesFromDirectoryEntry(entry).then((files) => {
          console.log(files)
        })
      }
    }
  }

  const onDragOver: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
  } 

  const handleFileChange:React.ChangeEventHandler<HTMLInputElement> = (e) => {
    console.log(e.target.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className='h-1/2 w-1/2 min-w-80 min-h-72 border-solid border-2 flex flex-col justify-center items-center cursor-pointer p-4'
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={handleClick}
    >
      <p className='w-full flex text-xl justify-center items-center mb-4'>
        <FaCloudUploadAlt className='w-14 text-zinc-800'/>拖拽 / 批量上传
      </p>
      <p className='text-zinc-400 text-sm'>
        将目录或多个文件拖拽到此进行扫描
      </p>
      <p className='text-zinc-400 text-sm'>
        支持 .jpg .jpeg .bmp .webp .gif .png
      </p>
      <p className='text-zinc-400 text-sm'>
        每个文件的最大尺寸: 1M
      </p>
      <input
        className='hidden'
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        webkitdirectory=""
        mozdirectory=""
        odirectory=''
        multiple
      />
    </div>
  )
}