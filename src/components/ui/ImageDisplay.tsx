'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageDisplayProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
}

export default function ImageDisplay({ src, alt, className = '', fill = false, sizes }: ImageDisplayProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  if (imageError) {
    // Fallback to regular img tag if Next.js Image fails
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} ${fill ? 'w-full h-full object-cover' : ''}`}
        onError={() => console.error('Regular img also failed:', src)}
        onLoad={() => setImageLoaded(true)}
        style={fill ? { position: 'absolute', inset: 0 } : undefined}
      />
    )
  }

  return (
    <>
      {!imageLoaded && (
        <div className={`${fill ? 'absolute inset-0' : ''} bg-gray-200 animate-pulse flex items-center justify-center`}>
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={className}
        sizes={sizes}
        onError={() => {
          console.error('Next.js Image failed, trying fallback:', src)
          setImageError(true)
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', src)
          setImageLoaded(true)
        }}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
        }}
        unoptimized={true}
      />
    </>
  )
}
