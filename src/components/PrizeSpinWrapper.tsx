// app/spin/PrizeSpinWrapper.tsx
'use client'

import PrizeSpinClient from '@/app/spin/PrizeSpinClient'
import { Suspense } from 'react'

export default function PrizeSpinWrapper() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-10">Đang tải vòng quay...</div>}>
      <PrizeSpinClient />
    </Suspense>
  )
}