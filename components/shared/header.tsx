import React from 'react'

const header = ({title, subtitle}: {title: string, subtitle?: string }) => {
  return (
    <div>
      <>
        <h2 className='h3-bold text-dark-600'>{title}</h2>
        {subtitle && <p className='p-16-regular mt-2'>{subtitle}</p>}
      </>
    </div>
  )
}

export default header