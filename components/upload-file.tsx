"use client"
import React, { useState } from 'react'
import { UploadDropzone } from './upload-drop-zone'
import { FaFilePdf } from "react-icons/fa"
import { IoIosCloseCircle } from "react-icons/io"
import Image from 'next/image'
import { AxiosResponse } from 'axios'

interface Props { }
interface FileInfo {
  url: string
  type: string
}

export const UploadFile: React.FC<Props> = () => {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)

  const handleComplete = (response: AxiosResponse) => {
    if (response.data.status === 201) {
      setFileInfo(response.data.resource)
    }
  }

  if (fileInfo?.type === 'application/pdf') {
    return (
      <div className="relative w-1/2 min-w-48 min-h-48 flex items-center p-2 mt-2 rounded-md bg-background/10">
        <FaFilePdf className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
        <a
          href={fileInfo?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
        >
          {fileInfo?.url}
        </a>
        <button onClick={() => setFileInfo(null)} className="p-1 rounded-full absolute -top-2 -right-2 shadow-sm" type="button">
          <IoIosCloseCircle className='w-10 h-10 text-rose-400'/>
        </button>
      </div>
    )
  }

  if (fileInfo?.type.startsWith('image')) {
    return (
      <div className="relative w-1/2 h-1/2 min-w-48 min-h-48">
        <Image fill src={fileInfo?.url} alt="Upload" className="rounded-md" />
        <button onClick={() => setFileInfo(null)} className="p-1 rounded-full absolute top-0 right-0 shadow-sm" type="button">
          <IoIosCloseCircle className='w-10 h-10 text-rose-400'/>
        </button>
    </div>
    )
  }

  return <UploadDropzone onComplete={handleComplete} />
}