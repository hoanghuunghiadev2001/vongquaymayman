/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const [err, setErr] = useState('');

const handleSubmit = async (e: any) => {
  e.preventDefault();

  // Regex kiểm tra định dạng số điện thoại
  const phoneRegex = /^0\d{9,10}$/;
  if (!phoneRegex.test(phone)) {
    setErr('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng 10 hoặc 11 số bắt đầu bằng 0.');
    return;
  }

  const res = await fetch('/api/check-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone }),
  });
  const data = await res.json();

  if (data.allowed) {
    router.push(`/spin?phone=${phone}`);
  } else {
    setErr(data.message);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-blue-600">
          Thông Tin Người Chơi
        </h2>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Họ và tên
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Nhập họ tên"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Nhập số điện thoại"
          />
        </div>
        {err && <p className="text-red-500 text-sm text-center italic">{err}</p>}
        
        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition duration-200"
        >
          Tiếp tục
        </button>
      </form>
    </div>
  );
}
