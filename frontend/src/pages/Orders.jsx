// src/pages/Orders.jsx
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { fetchMyOrders, cancelOrder } from '../services/orders';
import { extractError } from '../services/api';
import { Link } from 'react-router-dom';

const fmtVND = (n) => (Number(n || 0)).toLocaleString('vi-VN') + '₫';

function StatusBadge({ status }) {
  const cls =
    status === 'completed' ? 'bg-green-100 text-green-700' :
    status === 'shipping'  ? 'bg-blue-100 text-blue-700' :
    status === 'confirmed' ? 'bg-sky-100 text-sky-700' :
    status === 'pending'   ? 'bg-amber-100 text-amber-700' :
    status === 'canceled'  ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';
  const text =
    status === 'completed' ? 'Hoàn tất' :
    status === 'shipping'  ? 'Đang giao' :
    status === 'confirmed' ? 'Đã xác nhận' :
    status === 'pending'   ? 'Chờ xử lý' :
    status === 'canceled'  ? 'Đã hủy' : status;
  return <span className={`px-2 py-1 rounded text-xs font-medium ${cls}`}>{text}</span>;
}

export default function Orders() {
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const totalPages = useMemo(() => {
    const { total, limit } = pageInfo;
    if (!total || !limit) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [pageInfo]);

  async function load(p = 1) {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetchMyOrders({ page: p, limit: 10 });
      setItems(res.items || []);
      setPageInfo(res.pagination || { page: p, limit: 10, total: 0 });
    } catch (e) {
      setErr(extractError(e));
      setItems([]);
      setPageInfo({ page: 1, limit: 10, total: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  async function onCancel(id) {
    if (!window.confirm('Hủy đơn này? Hàng sẽ được hoàn tồn kho.')) return;
    try {
      await cancelOrder(id);
      // refresh danh sách
      load(pageInfo.page);
    } catch (e) {
      const er = extractError(e);
      alert(er.message || 'Không thể hủy đơn.');
    }
  }

  // Check if error is authentication related
  const isAuthError = err && (err.status === 401 || err.status === 403 || err.message?.toLowerCase().includes('unauthorized'));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Đơn hàng của tôi</h1>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      ) : isAuthError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 font-semibold mb-2">Unauthorized</div>
          <div className="text-sm text-gray-600 mb-4">
            Bạn cần đăng nhập để xem đơn hàng của mình.
          </div>
          <Link 
            to="/login" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      ) : err ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 font-semibold mb-1">Lỗi</div>
          <div className="text-sm text-gray-700">{err.message || 'Có lỗi xảy ra khi tải danh sách đơn hàng.'}</div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-sm text-neutral-600 mb-4">
            Bạn chưa có đơn hàng nào.
          </div>
          <Link className="inline-block text-blue-600 hover:underline font-medium" to="/collection">
            Mua sắm ngay →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Mã đơn</th>
                <th className="text-left p-3">Ngày đặt</th>
                <th className="text-right p-3">Tổng tiền</th>
                <th className="text-left p-3">Trạng thái</th>
                <th className="text-right p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o._id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{o.code || o._id.slice(-8)}</div>
                  </td>
                  <td className="p-3">
                    {o.createdAt ? dayjs(o.createdAt).format('HH:mm DD/MM/YYYY') : '—'}
                  </td>
                  <td className="p-3 text-right font-medium">{fmtVND(o.total)}</td>
                  <td className="p-3"><StatusBadge status={o.status} /></td>
                  <td className="p-3 text-right space-x-2">
                    <Link
                      to={`/order-success?id=${o._id}&code=${encodeURIComponent(o.code || '')}`}
                      className="px-3 py-1.5 border rounded hover:bg-gray-50"
                      title="Xem chi tiết"
                    >
                      Xem
                    </Link>
                    {['pending'].includes(o.status) && (
                      <button
                        onClick={() => onCancel(o._id)}
                        className="px-3 py-1.5 border rounded text-red-600 hover:bg-red-50"
                        title="Hủy đơn"
                      >
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Phân trang */}
      {items.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            className="px-3 py-2 border rounded disabled:opacity-50"
            onClick={() => load(Math.max(1, (pageInfo.page || 1) - 1))}
            disabled={(pageInfo.page || 1) <= 1}
          >
            Trang trước
          </button>
          <div>
            Trang <b>{pageInfo.page || 1}</b> / {totalPages}
          </div>
          <button
            className="px-3 py-2 border rounded disabled:opacity-50"
            onClick={() => load(Math.min(totalPages, (pageInfo.page || 1) + 1))}
            disabled={(pageInfo.page || 1) >= totalPages}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
