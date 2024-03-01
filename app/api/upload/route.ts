import { v4 as uuidv4 } from 'uuid'
import { writeFile } from "fs/promises"
import { NextResponse } from "next/server"
import path from "path"

export async function POST(req: Request) {
  try {
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