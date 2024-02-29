export async function getFilesFromDirectoryEntry(entry: FileSystemEntry | null): Promise<File[]> {
  let result: File[] = []
  if (!entry)
    return result

  if (entry?.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    result.push(file)
  } else {
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const entries: FileSystemEntry[] = await new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject)
    })
    for (const entry of entries) {
      const files = await getFilesFromDirectoryEntry(entry)
      result = result.concat(files)
    }
  }
  
  return result
}