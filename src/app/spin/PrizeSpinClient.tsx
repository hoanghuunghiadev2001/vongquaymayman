"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Sparkles, Gift, Trophy, Star } from "lucide-react"
import { PrizeModal } from "@/components/modal-prizes"
import { AlreadySpunModal } from "@/components/alreadySpunModal"
import { LoadingModal } from "@/components/modalLoading"

type Prize = {
  id: number
  name: string
}

export default function PrizeSpinClient() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [highlight, setHighlight] = useState<number>(0)
  const [resultIndex, setResultIndex] = useState<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const searchParams = useSearchParams()
  const phone = searchParams.get("phone")
  const [openModalPrize, setOpenModalPrize] = useState(false)
  const [openAlreadySpunModal, setAlreadySpunModal] = useState(false)
  const [loading, setLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false)



  // Load danh sách phần thưởng
  useEffect(() => {
    fetch("/api/admin/prizes")
      .then((res) => res.json())
      .then((data: Prize[]) => {
        setPrizes(data)
      })
  }, [])

  const spin = async () => {

    if (spinning || !phone) return;

    const deviceKey = localStorage.getItem('deviceKey');
    if (!deviceKey) {
      alert('Thiếu deviceKey. Vui lòng tải lại trang và thử lại.');
      return;
    }

    setSpinning(true);
    setResultIndex(null);
    setLoading(true);

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, deviceKey }),
      });

      const data = await res.json();

      // ❌ Nếu lỗi server
      if (!res.ok) {
        alert(data.message || 'Lỗi máy chủ. Vui lòng thử lại sau.');
        setSpinning(false);
        return;
      }

      // ✅ Nếu đã quay
      if (data.alreadySpun) {
        setSpinning(false);
        setAlreadySpunModal(true);
        return;
      }

      const prizeId = data.prizeId;
      const index = prizes.findIndex((p) => p.id === prizeId);
      if (index === -1) {
        alert('Phần thưởng không tồn tại.');
        setSpinning(false);
        return;
      }

      let current = 0;
      const total = 3 * prizes.length + index;

      const spinStep = (delay: number) => {
        setHighlight(current % prizes.length);
        current++;

        if (current <= total) {
          // tăng delay dần để tạo cảm giác chậm lại
          const nextDelay = delay + 50; // mỗi vòng chậm thêm 10ms
          setTimeout(() => spinStep(nextDelay), nextDelay);
        } else {
          setResultIndex(index);
          setSpinning(false);
        }
      };

      // bắt đầu với tốc độ nhanh
      spinStep(100);

      // Lưu trạng thái đã quay
      localStorage.setItem('hasSpun', 'true');
    } catch (error) {
      console.error('Lỗi khi gọi API /spin:', error);
      alert('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
      setSpinning(false);
    } finally {
      setLoading(false);
    }
  };


  const prizeColors = [
    "from-red-500 to-red-600",
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-purple-500 to-purple-600",
    "from-yellow-500 to-yellow-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
    "from-orange-500 to-orange-600",
    "from-teal-500 to-teal-600",
  ]
  useEffect(() => {
    if (resultIndex !== null) {
      // Sau 2s mới hiện chúc mừng + confetti
      const timer = setTimeout(() => {
        setShowCongrats(true)
        setOpenModalPrize(true) // hoặc mở modal cùng lúc
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [resultIndex])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          >
            <Star className="text-yellow-400 w-2 h-2" />
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="text-yellow-400 w-10 h-10 animate-spin" />
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Quay Thưởng Siêu Hấp Dẫn
            </h1>
            <Sparkles className="text-yellow-400 w-10 h-10 animate-spin" />
          </div>
          <p className="text-xl text-gray-300 font-medium">Nhấn nút quay để nhận ngay phần thưởng!</p>
        </div>

        {/* Main Game Container */}
        <div className="relative">
          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-pink-500/30 rounded-3xl blur-xl animate-pulse" />

          <div className="w-[80vw] relative bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20">
            {/* Prize Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 mb-6">
              {prizes.map((prize, i) => (
                <div
                  key={prize.id}
                  className={`
                    flex-shrink-0 relative rounded-2xl border-2 text-center px-4 py-6 transition-all duration-200 ease-in-out transform
                    ${highlight === i
                      ? `bg-gradient-to-br ${prizeColors[i % prizeColors.length]} text-white font-extrabold scale-110 shadow-2xl ring-4 ring-yellow-400 animate-pulse`
                      : "bg-white/90 hover:bg-white text-gray-800 hover:scale-105 shadow-lg border-gray-200"
                    }
                  `}
                >
                  {/* Prize icon */}
                  <div className="mb-2">
                    <Gift className={`w-8 h-8 mx-auto ${highlight === i ? "text-white" : "text-gray-600"}`} />
                  </div>

                  {/* Prize name */}
                  <div className={`text-sm font-semibold ${highlight === i ? "text-white" : "text-gray-800"}`}>
                    {prize.name}
                  </div>

                  {/* Highlight effect */}
                  {highlight === i && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/20 to-pink-500/20 animate-ping" />
                  )}
                </div>
              ))}
            </div>

            {/* Spin Button */}
            <div className="relative">
              <button
                onClick={spin}
                disabled={spinning}
                className={`
                  w-full py-4 rounded-2xl font-bold text-xl text-white transition-all duration-300 transform relative overflow-hidden
                  ${spinning
                    ? "bg-gray-500 cursor-not-allowed scale-95"
                    : "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 hover:scale-105 shadow-2xl hover:shadow-pink-500/50"
                  }
                `}
              >
                {spinning ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Đang quay...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <Sparkles className="w-6 h-6" />🎉 QUAY NGAY
                    <Sparkles className="w-6 h-6" />
                  </span>
                )}

                {/* Button glow effect */}
                {!spinning && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-400/20 to-yellow-400/20 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {resultIndex !== null && showCongrats && (
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-6 shadow-2xl border-4 border-yellow-400 animate-bounce">
              <Trophy className="w-12 h-12 text-white mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-2">🎁 CHÚC MỪNG!</div>
              <div className="text-xl text-white font-semibold">Bạn trúng: {prizes[resultIndex]?.name}</div>
            </div>

            {/* Confetti effect */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random() * 2}s`,
                  }}
                >
                  {["🎉", "🎊", "✨", "🌟"][Math.floor(Math.random() * 4)]}
                </div>
              ))}
            </div>
          </div>
        )}
        <PrizeModal isOpen={openModalPrize} onClose={() => setOpenModalPrize(false)} prize={prizes[resultIndex ?? 0] ?? ''} />
        <AlreadySpunModal isOpen={openAlreadySpunModal} message="ádasdasd" onClose={() => setAlreadySpunModal(false)} />
        <LoadingModal isOpen={loading} />
        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-gray-300 text-lg">
            {spinning ? (
              <span className="text-yellow-400 font-semibold animate-pulse">
                ⏳ Đang xử lý... Vui lòng chờ kết quả!
              </span>
            ) : (
              "🎯 Nhấn nút quay để tham gia và nhận thưởng ngay!"
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
