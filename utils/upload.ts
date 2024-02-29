import axios, { CancelTokenSource } from "axios"

interface UploadConfig {
  onUploadProgress: (event: any) => void
  formData: FormData
  cancelSource: CancelTokenSource
}

export async function upload(cfg: UploadConfig) {
  const { onUploadProgress, formData, cancelSource } = cfg
  const axiosCfg = {
    headers: {
      'content-type': 'multipart/form-data'
    },
    onUploadProgress,
    cancelToken: cancelSource.token
  }

  return axios.post('/api/upload', formData, axiosCfg)
}