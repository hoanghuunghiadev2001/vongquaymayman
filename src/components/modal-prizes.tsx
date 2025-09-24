"use client"

import { useEffect, useState } from "react"
import { X, Trophy, Sparkles, Star } from "lucide-react"

type Prize = {
  id: number
  name: string
}

interface PrizeModalProps {
  isOpen: boolean
  onClose: () => void
  prize: Prize
}

export function PrizeModal({ isOpen, onClose, prize }: PrizeModalProps) {
  const [showFireworks, setShowFireworks] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowFireworks(true)
      setAnimate(true)
      const timer = setTimeout(() => setShowFireworks(false), 4000)
      return () => clearTimeout(timer)
    } else {
      setAnimate(false)
      setShowFireworks(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Fireworks Effect */}
      {showFireworks && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  ["bg-yellow-400", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-red-500"][
                    Math.floor(Math.random() * 6)
                  ]
                }`}
              />
            </div>
          ))}
        </div>
      )}

      <div
        className={`
        bg-gradient-to-br from-white via-yellow-50 to-pink-50 rounded-3xl p-8 max-w-lg w-full mx-4 text-center 
        transform transition-all duration-500 shadow-2xl border-4 border-yellow-400/50 relative
        ${animate ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-12 opacity-0"}
      `}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Celebration header */}
        <div className="mb-8">
          <div className="relative mb-6">
            <div className="text-8xl animate-bounce">🎉</div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="text-yellow-500 w-8 h-8 animate-spin" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Star className="text-pink-500 w-6 h-6 animate-pulse" />
            </div>
          </div>

          <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
            CHÚC MỪNG!
          </h2>
          <p className="text-xl text-gray-600 font-medium">Bạn đã trúng thưởng!</p>
        </div>

        {/* Prize display */}
        <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-2xl p-1 mb-8 transform hover:scale-105 transition-transform">
          <div className="bg-white rounded-xl p-6">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
            <div className="text-3xl font-bold text-gray-800 mb-2">{prize.name}</div>
            <div className="text-lg text-gray-600">Phần thưởng đặc biệt dành riêng cho bạn!</div>
          </div>
        </div>

        {/* Action buttons */}

        <div className="mt-6 text-sm text-gray-500 bg-gray-100 rounded-lg p-3">
          💡 Liên hệ bộ phận để nhận thưởng.
        </div>

        {/* Floating elements */}
        <div className="absolute -top-4 -left-4 text-4xl animate-bounce">🎊</div>
        <div className="absolute -top-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: "0.5s" }}>
          🎁
        </div>
        <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce" style={{ animationDelay: "1s" }}>
          ✨
        </div>
        <div className="absolute -bottom-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: "1.5s" }}>
          🌟
        </div>
      </div>
    </div>
  )
}
