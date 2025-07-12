"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface LoadingModalProps {
  isOpen: boolean
}

export function LoadingModal({ isOpen }: LoadingModalProps) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAnimate(true)
    } else {
      setAnimate(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`
        bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-3xl p-8 max-w-sm w-full mx-4 text-center 
        transform transition-all duration-300 shadow-2xl border-4 border-blue-400/50 relative
        ${animate ? "scale-100 opacity-100" : "scale-75 opacity-0"}
      `}
      >
        {/* Loading icon */}
        <div className="mb-6">
          <Loader2 className="w-20 h-20 text-blue-500 mx-auto animate-spin-slow" />
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Đang xử lý...
        </h2>

        {/* Decorative sparkles */}
        <div className="absolute -top-4 -left-4 text-4xl animate-pulse">✨</div>
        <div className="absolute -top-4 -right-4 text-4xl animate-pulse" style={{ animationDelay: "0.5s" }}>
          🌟
        </div>
        <div className="absolute -bottom-4 -left-4 text-4xl animate-pulse" style={{ animationDelay: "1s" }}>
          💫
        </div>
        <div className="absolute -bottom-4 -right-4 text-4xl animate-pulse" style={{ animationDelay: "1.5s" }}>
          🎉
        </div>
      </div>
    </div>
  )
}
