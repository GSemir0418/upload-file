import axios from "axios"

interface UploadConfig {
  onUploadProgress: (event: any) => void
  formData: FormData
}

export async function upload(cfg: UploadConfig) {
  const { onUploadProgress, formData } = cfg
  const axiosCfg = {
    headers: {
      'content-type': 'multipart/form-data'
    },
    onUploadProgress,
  }

  return axios.post('/api/upload', formData, axiosCfg)
}