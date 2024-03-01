## Upload 组件

前端 react + ts，后端 nextjs

上传组件封装，支持**批量上传**，**批量拖拽上传**，**取消上传**，**进度监控**，**上传文件预览**等功能

使用 nextjs 搭建项目

`npx create-next-app@latest upload-component --typescript --tailwind`

### 如何选择多个文件

```html
<input type='file' multiple/>
```

### 如何选择文件夹

> https://developer.mozilla.org/zh-CN/docs/Web/API/DataTransferItem/webkitGetAsEntry#%E7%A4%BA%E4%BE%8B

```tsx
<input 
  type='file' 
  webkitdirectory=""
  mozdirectory=""
  odirectory=''
 />
```

使用 input 元素 onChange 事件的 `e.target.files` 属性拿到上传的文件列表

TypeScript 需要额外声明这几个属性的类型

```ts
// type.d.ts
import type { AriaAttributes } from "react";

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extends React's HTMLAttributes
    webkitdirectory?: string;
    mozdirectory?: string;
    odirectory?: string;
  }
}
```

### 如何拖拽文件和文件夹

对于拖拽上传，我们用到了 HTML5 拖拽API的`onDrop`和`onDragOver`事件

onDragOver 仅用于阻止浏览器默认事件

onDrop 事件中，通过事件参数 `e.dataTransfer?.items` 可以获取全部 DataTransferItemList 数据

遍历这个 list，通过每个 DataTransferItem 的 `item.webkitGetAsEntry()` 方法可以获取其 entry

> `FileSystemEntry` 与 `File` 对象对比：
>
> 1. `FileSystemEntry` 能表示目录和文件：`FileSystemEntry` 是一个更高级的抽象，它可以表示目录或文件。具体来说，这意味着你可以使用 `FileSystemEntry` 的子类型 `DirectoryEntry` 来遍历目录的内容、创建新目录等。而 `File` 对象则只代表单个的文件，它不能表示目录，也不能直接进行目录操作。
> 2. `FileSystemEntry` 提供更多的文件系统操作：`FileSystemEntry` 提供了许多便利的文件系统操作的方法。例如，使用 `FileSystemEntry`，你可以在用户的文件系统上创建、读取、写入或移动文件和目录。你也可以检查一个文件或目录是否存在，获取其元数据等。相比之下，`File` 对象主要用于读取文件内容和获取文件信息，它不能直接进行文件系统级别的操作。
>
> 基于以上原因，处理文件系统级别的操作时，我们往往会选择使用 `FileSystemEntry`。但是，当我们只需要处理单个文件，并对其内容进行操作时，使用 `File` 对象可能会更为简单直接。

接着就需要从 entry 对象读取到 file 数据，我们将逻辑封装为 `getFilesFromDirectoryEntry` 函数

```tsx
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
```

此函数接受 `FileSystemEntry` 参数，返回 `Promise<File[]>` 数据

根据 `entry.isFile` 判断文件类型，如果是文件，则使用 `entry.file` 异步方法获取其 File 数据；反之使用 `entry.createReader` 方法创建 `DirectoryReader`，然后递归读取目录中的所有项目，收集并返回所有找到的 File 数据。

因为 Web File API 的一些方法是异步的，所以这个函数也是异步的

### 如何实现多文件上传

放到一起作为一个请求 也可以同时发起多个请求

- 前端（FormData + axios）

```js
const formData = new FormData()
formData.append("file", file)

axios.post(
	'/api/upload', 
	formData, 
  {
  	headers: {
      'content-type': 'multipart/form-data'
    }
  }
)
```

- 后端

```tsx
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from "fs/promises";
import { NextResponse } from "next/server"
import path from "path";

export async function POST(req: Request) {
  try {
    // nextjs 内置 formData 解析方法
    const formData = await req.formData()

    const file = formData.get("file")
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No files received." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // const filename = file.name.replaceAll(" ", "_")
    const filename = `${uuidv4()}.${file.name.split('.').pop()}`
    
    await writeFile(
      path.join(process.cwd(), "public/upload/" + filename),
      buffer
    )

    const resource = {
      url: `http://localhost:3001/upload/${filename}`,
      type: file.type
    }
    return NextResponse.json({ resource, status: 201 })

  } catch (error) {
    console.log("Error occured ", error);
    return NextResponse.json({ error: "Internal Error", status: 500 })
  }
}
```

### 如何实现进度追踪

在 axios 请求的配置中，配置 onUploadProgress 方法，根据事件参数的 loaded 和 total 属性计算进度值

```js
axios.post(
	'/api/upload',
  formData,
  {
    headers: {},
    onUploadProgress: (event: any) => {
      let percentCompleted = Math.round((100 * event.loaded) / event.total)
      setPercent(percentCompleted)
    },
  }
)
```

- 进度条样式

```css
progress {
  /* reset the default appearance */
  -webkit-appearance: none;
  appearance: none;
  border: none;
  /* add border radius */
  border-radius: 20px;
  overflow: hidden;
}

progress::-webkit-progress-bar {
  /* style the background (unfilled part) of the bar and add border radius*/
  border-radius: 20px;
  background-color: #f3f4f6;
}

progress::-webkit-progress-value {
  /* style the filled part of the bar and add border radius */
  border-radius: 20px;
  background-color: #c4c8cf;
}

progress::-moz-progress-bar {
  /* style the filled part of the bar in Mozilla and add border radius */
  border-radius: 20px;
  background-color: #c4c8cf;
}
```

- Fetch 不支持进度监控

### 如何实现取消上传

- Axios - `cancelTokenSource`

将 cancelTokenSource 声明为组件的 ref

```tsx
const cancelSourceRef = useRef(axios.CancelToken.source())
```

 传入 axios 请求的配置中

```js
axios.post(
	'/api/upload',
  formData,
  {
    headers: {},
    onUploadProgress: (event: any) => {},
    cancelToken: cancelSourceRef.current.token
  }
)
```

在需要取消请求的时候，调用 cancel 方法即可

```tsx
cancelSourceRef.current.cancel('cancel upload')
```

在请求的 catch 阶段会捕获到取消终止的错误，可以在这里做一些清理工作

```js
.catch(err => {
	if (axios.isCancel(err)) {
  	console.log('Request canceled', err.message);
  	setPercent(0)
  } else {
  	console.error(err);
  }
})
```

- Fetch - `AbortController`

本项目数据请求使用的是 axios， 这里只提供 fetch 取消请求的思路

`fetch` 是原生的 JavaScript HTTP 请求 API，它本身并不支持取消请求。但是，我们可以通过 `AbortController` 接口来实现取消 `fetch` 请求的需求

```js
const controller = new AbortController();
const signal = controller.signal;

fetch('https://api.myurl.com', { signal })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => {
        if (error.name === 'AbortError') {
            console.log('Fetch cancelled');
        } else {
            console.log('Fetch error: ', error.message);
        }
    });

// 调用 controller.abort() 来取消请求
controller.abort();
```

### 上传文件大小与类型控制

拿到 File 对象后，根据 file.type 以及 file.size 对上传数据的类型及大小进行控制

```js
const MAX_FILE_SIZE = 5 * 1024 * 1024
const FILE_TYPE = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'
]
// ...
if (!FILE_TYPE.includes(file.type)) {
  alert('不支持的文件格式')
  return
}
if (file.size > MAX_FILE_SIZE) {
  alert('文件大于 5M')
  return
}
```

### 上传成功预览

上传成功后，后端会将静态资源路径 url 和文件类型 type 返回；url 用于加载预览图或下载 pdf 文件，type 用于前端判断预览组件

将 UploadDropzone 组件拆分出来，逻辑会清晰很多

```tsx
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
```

需要配置 nextjs 中的图片静态资源路径

```js
// next.config.mjs
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/upload/**',
      },
    ],
  },
};

export default nextConfig;
```

