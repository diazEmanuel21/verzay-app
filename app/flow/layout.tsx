import { Separator } from "@/components/ui/separator"
import React from 'react'

function layout({children}:{children: React.ReactNode}){
  return (
    <div className='flex flex-col w-full h-screen'>
      {children}
      <footer className="flex items-center justify-between p-2">Logo</footer>
    </div>
  )
}

export default layout;
