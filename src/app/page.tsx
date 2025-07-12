/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { LoadingModal } from '@/components/modalLoading';


export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      let deviceKey = localStorage.getItem('deviceKey');
      if (!deviceKey) {
        deviceKey = uuidv4();
        localStorage.setItem('deviceKey', deviceKey);
      }

      // ✅ Kiểm tra định dạng số điện thoại Việt Nam: 10–11 số bắt đầu bằng 0
      const phoneRegex = /^0\d{9,10}$/;
      if (!phoneRegex.test(phone)) {
        setErr('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng 10 hoặc 11 số bắt đầu bằng 0.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.message || 'Đã có lỗi xảy ra từ máy chủ.');
      } else if (data.allowed) {
        router.push(`/spin?phone=${phone}`);
      } else {
        setErr(data.message || 'Bạn không được phép tham gia.');
      }
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      setErr('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <LoadingModal isOpen={loading}/>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-blue-600">
          Thông Tin
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
