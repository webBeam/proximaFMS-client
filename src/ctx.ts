import type { ReactNode } from 'react'
import type { Role, State } from './data'

export type Field = { name:string; label:string; type?:string; options?:string[] }
export type Modal = { title:string; detail:string; body?:ReactNode; wide?:boolean; bare?:boolean; submit?:string; fields?:Field[]; run?:(data:FormData)=>void|Promise<void> }
export type Ctx = {
  state:State; setState:(update:(state:State)=>State)=>void
  role:Role; page:string; seed:string
  navigate:(page:string)=>void
  open:(modal:Modal)=>void
  close:()=>void
  confirm:(title:string,detail:string,submit:string,run:()=>void)=>void
  notify:(message:string)=>void
  celebrate:()=>void
}

export const value = (form:FormData,key:string) => String(form.get(key) ?? '').trim()
export async function photo(form:FormData,key:string): Promise<string|undefined> {
  const file = form.get(key)
  if (!(file instanceof File) || !file.size) return
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 750000) throw new Error('Choose a JPG, PNG or WebP image under 750 KB.')
  return new Promise((resolve,reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('The selected image could not be read.'))
    reader.readAsDataURL(file)
  })
}
