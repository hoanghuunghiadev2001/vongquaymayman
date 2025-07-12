/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  type Prize = {
    id: number;
    name: string;
    ratio: number;
  };

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [users, setUsers] = useState([]);
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
    setUsers(data);
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
      <h1 className="text-3xl font-bold mb-4 text-center">🎛️ Quản lý phần thưởng</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
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
              {prizes.map((item: any, i) => (
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

        <div>
          <h2 className="text-xl font-semibold mb-2">🧑‍💼 Danh sách người dùng</h2>
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">Tên</th>
                <th className="p-2 border">SĐT</th>
                <th className="p-2 border">Phần thưởng</th>
                <th className="p-2 border">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="text-center">
                  <td className="p-2 border">{user.name}</td>
                  <td className="p-2 border">{user.phone}</td>
                  <td className="p-2 border">{user.prize || '—'}</td>
                  <td className="p-2 border">{new Date(user.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
