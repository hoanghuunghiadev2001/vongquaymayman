/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  type Prize = {
    id: number;
    name: string;
    ratio: number;
  };

  type User = {
    id: number;
    name: string;
    phone: string;
    prize: string | null;
    hasSpun: boolean;
    createdAt: string;
  };

  type PrizeStat = {
    name: string;
    ratio: number;
    used: number;
    remaining: number;
  };

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<{
    totalUsers: number;
    winners: number;
    percent: number;
    prizeStats: PrizeStat[];
  } | null>(null);
  const [name, setName] = useState('');
  const [ratio, setRatio] = useState('');

  const fetchPrizes = async () => {
    const res = await fetch('/api/admin/prizes');
    const data = await res.json();
    setPrizes(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users);
    setStats({
      totalUsers: data.totalUsers,
      winners: data.winners,
      percent: data.percent,
      prizeStats: data.prizeStats,
    });
  };

  const addPrize = async () => {
    const res = await fetch('/api/admin/prizes', {
      method: 'POST',
      body: JSON.stringify({ name, ratio }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      setName('');
      setRatio('');
      fetchPrizes();
    }
  };

  useEffect(() => {
    fetchPrizes();
    fetchUsers();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">🎛️ Quản lý phần thưởng & người dùng</h1>

      {/* Thống kê tổng quan */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white shadow rounded p-4 border">
            <div className="text-sm text-gray-500">Tổng số người tham gia</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
          </div>
          <div className="bg-white shadow rounded p-4 border">
            <div className="text-sm text-gray-500">Số người trúng thưởng</div>
            <div className="text-2xl font-bold text-green-600">{stats.winners}</div>
          </div>
          <div className="bg-white shadow rounded p-4 border">
            <div className="text-sm text-gray-500">% trúng thưởng</div>
            <div className="text-2xl font-bold text-purple-600">{stats.percent}%</div>
          </div>
        </div>
      )}

      {/* Giao diện phần thưởng & người dùng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Quản lý phần thưởng */}
        <div>
          <input
            className="w-full p-2 mb-2 border rounded"
            placeholder="Tên phần thưởng"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full p-2 mb-2 border rounded"
            placeholder="Tỷ lệ (%)"
            type="number"
            value={ratio}
            onChange={(e) => setRatio(e.target.value)}
          />
          <button
            onClick={addPrize}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded"
          >
            Thêm phần thưởng
          </button>

          <h2 className="text-xl font-semibold mt-6 mb-2">🎁 Danh sách phần thưởng</h2>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-200 text-center">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Tên</th>
                <th className="p-2 border">Tỷ lệ (%)</th>
                <th className="p-2 border">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map((item, i) => (
                <tr key={item.id} className="text-center">
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border">
                    <input
                      value={item.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setPrizes((prev) =>
                          prev.map((p) => (p.id === item.id ? { ...p, name: newName } : p))
                        );
                      }}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      value={item.ratio}
                      onChange={(e) => {
                        setPrizes((prev) =>
                          prev.map((p) =>
                            p.id === item.id ? { ...p, ratio: Number(e.target.value) } : p
                          )
                        );
                      }}
                      className="w-full p-1 border rounded text-right"
                    />
                  </td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={async () => {
                        await fetch('/api/admin/prizes', {
                          method: 'PUT',
                          body: JSON.stringify(item),
                          headers: { 'Content-Type': 'application/json' },
                        });
                        fetchPrizes();
                      }}
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                    >
                      💾
                    </button>
                    <button
                      onClick={async () => {
                        const confirmDelete = confirm('Xoá phần thưởng này?');
                        if (!confirmDelete) return;
                        await fetch('/api/admin/prizes', {
                          method: 'DELETE',
                          body: JSON.stringify({ id: item.id }),
                          headers: { 'Content-Type': 'application/json' },
                        });
                        fetchPrizes();
                      }}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Danh sách người dùng */}
        <div>
          <h2 className="text-xl font-semibold mb-2">🧑‍💼 Danh sách người dùng</h2>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-200 text-center">
                <th className="p-2 border">Tên</th>
                <th className="p-2 border">SĐT</th>
                <th className="p-2 border">Phần thưởng</th>
                <th className="p-2 border">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="text-center">
                  <td className="p-2 border">{user.name}</td>
                  <td className="p-2 border">{user.phone}</td>
                  <td className="p-2 border">{user.prize || '—'}</td>
                  <td className="p-2 border">{new Date(user.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Thống kê phần thưởng đã trúng */}
          {stats && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">📊 Thống kê phần thưởng đã trúng</h2>
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-200 text-center">
                    <th className="p-2 border">Tên</th>
                    <th className="p-2 border">Tỷ lệ (%)</th>
                    <th className="p-2 border">Đã trúng</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.prizeStats.map((item, i) => (
                    <tr key={i} className="text-center">
                      <td className="p-2 border">{item.name}</td>
                      <td className="p-2 border">{item.ratio}</td>
                      <td className="p-2 border text-green-700 font-semibold">{item.used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
