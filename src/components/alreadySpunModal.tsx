"use client"

import { useEffect, useState } from "react"
import { X, AlertCircle, Clock } from "lucide-react"

interface AlreadySpunModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

export function AlreadySpunModal({ isOpen, onClose }: AlreadySpunModalProps) {
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
        bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-3xl p-8 max-w-lg w-full mx-4 text-center 
        transform transition-all duration-500 shadow-2xl border-4 border-red-400/50 relative
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

        {/* Warning header */}
        <div className="mb-8">
          <div className="relative mb-6">
            <div className="text-8xl animate-bounce">😔</div>
            <div className="absolute -top-2 -right-2">
              <AlertCircle className="text-red-500 w-8 h-8 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Clock className="text-orange-500 w-6 h-6 animate-pulse" />
            </div>
          </div>

          <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">
            RẤT TIẾC!
          </h2>
          <p className="text-xl text-gray-600 font-medium">Bạn hoặc thiết bị này đã tham gia rồi</p>
        </div>

        {/* Message display */}
        <div className="bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 rounded-2xl p-1 mb-8">
          <div className="bg-white rounded-xl p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
            <div className="text-2xl font-bold text-gray-800 mb-2">Đã quay thưởng</div>
            <div className="text-sm text-gray-500 bg-gray-100 rounded-lg p-3">
              Mỗi số điện thoại chỉ được quay 1 lần duy nhất
            </div>
          </div>
        </div>
        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          >
            <X className="w-6 h-6" />
            Đóng
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-400">Cảm ơn bạn đã tham gia chương trình quay thưởng của chúng tôi!</div>
      </div>
    </div>
  )
}
