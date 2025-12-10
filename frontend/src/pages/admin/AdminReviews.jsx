import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { extractError } from "../../services/api";

const fmtDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");
const limit = 20;

export default function AdminReviews() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get("/admin/reviews", {
        params: { page, limit, q },
      });
      setItems(res.data.items || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const remove = async (id) => {
    if (!globalThis.confirm("Xóa đánh giá này?")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      setItems((list) => list.filter((i) => i._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      alert(extractError(e).message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
          <p className="text-sm text-gray-600 mt-1">
            Xem và quản lý các đánh giá từ khách hàng
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-2">
        <input
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tìm theo tên hoặc nội dung..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
        />
        <button
          onClick={() => {
            setPage(1);
            load();
          }}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          Tìm
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : err ? (
          <div className="p-8 text-center text-red-500">Lỗi: {err.message}</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Chưa có đánh giá nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nội dung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div
                        className="text-sm font-medium text-gray-900 max-w-xs truncate"
                        title={r.productId}
                      >
                        ID: {r.productId}
                        {/* Note: review list admin API needs to populate product name ideally, but current controller just sends raw doc or simple list. 
                            If we want product name, we should populate productId in backend. 
                            For now just show ID or basic info. */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {r.name || "Incognito"}
                      </div>
                      {r.userId && (
                        <div className="text-xs text-gray-500">
                          User ID: {r.userId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-yellow-500 font-bold">
                        {r.rating} ★
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-700 max-w-xs line-clamp-2"
                        title={r.content}
                      >
                        {r.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fmtDate(r.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => remove(r._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded bg-white disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded bg-white disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
