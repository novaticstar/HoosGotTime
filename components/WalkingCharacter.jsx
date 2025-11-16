"use client"
import React, { useEffect, useState, useRef } from 'react'

export default function WalkingCharacter({ isThinking }) {
  const [position, setPosition] = useState(0) // 0 to 100 percentage
  const [direction, setDirection] = useState('right')
  const [isWalking, setIsWalking] = useState(true)
  const animationRef = useRef(null)

  useEffect(() => {
    if (isThinking) {
      setIsWalking(false)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    setIsWalking(true)
    let currentPos = position
    let currentDir = direction

    const animate = () => {
      const speed = 0.1 // Even slower speed
      
      if (currentDir === 'right') {
        currentPos += speed
        if (currentPos >= 95) {
          currentPos = 95
          currentDir = 'left'
          setDirection('left')
        }
      } else {
        currentPos -= speed
        if (currentPos <= 5) {
          currentPos = 5
          currentDir = 'right'
          setDirection('right')
        }
      }
      
      setPosition(currentPos)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isThinking])

  return (
    <div 
      className="walking-character"
      style={{
        left: `${position}%`,
        transform: direction === 'left' ? 'translateX(-50%) scaleX(-1)' : 'translateX(-50%) scaleX(1)'
      }}
    >
      <div className="character-body">
        {isThinking ? (
          <div className="thinking-bubble">
            <div className="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : null}
        <div className="character-sprite">
          🏇
        </div>
        {isWalking && <div className="walking-animation" />}
      </div>
    </div>
  )
}
