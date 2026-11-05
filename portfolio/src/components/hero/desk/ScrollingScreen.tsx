'use client'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { asset } from '@/lib/asset'

type Props = {
  p: MotionValue<number>
  at: readonly [number, number]
  y: readonly [string, string]
  image: { src: string; width: number; height: number }
  aspect: string
  radius: string
}

/** A device screen whose (tall, full-page) screenshot scrolls with the page. */
export function ScrollingScreen({ p, at, y, image, aspect, radius }: Props) {
  const translate = useTransform(p, [...at], [...y])
  return (
    <div className="relative overflow-hidden bg-black" style={{ aspectRatio: aspect, borderRadius: radius }}>
      <motion.img
        style={{ y: translate }}
        src={asset(image.src)}
        alt=""
        width={image.width}
        height={image.height}
        loading="lazy"
        decoding="async"
        className="block w-full"
      />
    </div>
  )
}
