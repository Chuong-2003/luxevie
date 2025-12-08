import { useEffect, useState } from "react";
import { listAdminCoupons, createAdminCoupon, updateAdminCoupon, deleteAdminCoupon } from "../../services/adminCoupons";
import { extractError } from "../../services/api";

const fmtDate = (d) => d ? new Date(d).toLocaleString() : "—";

const empty = { code:"", type:"percent", value:"", maxUses:"", expiresAt:"", active:true, note:"" };

const TYPE_CONFIG = {
  percent: { label: 'Phần trăm', color: 'blue', icon: '📊' },
  fixed: { label: 'Cố định', color: 'green', icon: '💰' },
};

const STATUS_CONFIG = {
  active: { label: 'Hoạt động', color: 'green', icon: '✅' },
  inactive: { label: 'Tạm dừng', color: 'red', icon: '⏸️' },
  expired: { label: 'Hết hạn', color: 'gray', icon: '⏰' },
};

// Component StatusBadge
const StatusBadge = ({ coupon }) => {
  const now = new Date();
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
  const isMaxUsed = coupon.maxUses && coupon.used >= coupon.maxUses;
  
  let status = 'active';
  if (isExpired || isMaxUsed) status = 'expired';
  else if (!coupon.active) status = 'inactive';
  
  const config = STATUS_CONFIG[status] || { label: status, color: 'gray', icon: '❓' };
  
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${colorClasses[config.color]}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

// Component TypeBadge
const TypeBadge = ({ type }) => {
  const config = TYPE_CONFIG[type] || { label: type, color: 'gray', icon: '❓' };
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${colorClasses[config.color]}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

// Component CouponCard
const CouponCard = ({ coupon, onToggle, onRemove }) => {
  const now = new Date();
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
  const isMaxUsed = coupon.maxUses && coupon.used >= coupon.maxUses;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900">{coupon.code}</h3>
            <TypeBadge type={coupon.type} />
            <StatusBadge coupon={coupon} />
          </div>
          <div className="text-sm text-gray-600">
            <div className="font-medium">
              {coupon.type === 'percent' 
                ? `Giảm ${coupon.value}%` 
                : `Giảm ${Number(coupon.value || 0).toLocaleString()}₫`
              }
            </div>
            {coupon.note && (
              <div className="text-xs text-gray-500 mt-1">{coupon.note}</div>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Đã dùng: {coupon.used || 0}</div>
          <div>Giới hạn: {coupon.maxUses || '∞'}</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-3">
        {coupon.expiresAt ? (
          <div>
            Hết hạn: {new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}
            {isExpired && <span className="text-red-500 ml-1">(Đã hết hạn)</span>}
          </div>
        ) : (
          <div>Không giới hạn thời gian</div>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          ID: {coupon._id.slice(-6)}
        </div>
        <div className="flex space-x-2">
          <button 
            style={{display:"none"}}
            onClick={() => onToggle(coupon)}
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              coupon.active 
                ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                : 'text-green-600 bg-green-50 hover:bg-green-100'
            }`}
          >
            {coupon.active ? 'Tắt' : 'Bật'}
          </button>
          <button 
            onClick={() => onRemove(coupon._id)}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminCouponsList() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const { items } = await listAdminCoupons({ q, limit: 100 });
      setItems(items || []);
    } catch (e) { setErr(extractError(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []); // initial

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      const payload = {
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value) || 0,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
        active: !!form.active,
        note: form.note || undefined
      };
      if (!payload.code) return alert("Nhập mã coupon");
      await createAdminCoupon(payload);
      setForm(empty);
      setShowForm(false);
      await load();
    } catch (e) { setErr(e); }
    finally { setSaving(false); }
  }

  async function toggleActive(it) {
    try {
      const updated = await updateAdminCoupon(it._id, { active: !it.active });
      setItems(list => list.map(x => x._id === it._id ? updated : x));
    } catch (e) { alert(extractError(e).message); }
  }
  async function remove(id) {
    if (!confirm("Xóa coupon này?")) return;
    try {
      await deleteAdminCoupon(id);
      setItems(list => list.filter(x => x._id !== id));
    } catch (e) { alert(extractError(e).message); }
  }

  // Calculate stats
  const stats = {
    total: items.length,
    active: items.filter(item => item.active).length,
    expired: items.filter(item => {
      const now = new Date();
      return item.expiresAt && new Date(item.expiresAt) < now;
    }).length,
    totalUsed: items.reduce((sum, item) => sum + (item.used || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý mã giảm giá</h1>
          <p className="text-sm text-gray-600 mt-1">Tạo và quản lý các mã giảm giá cho khách hàng</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Hiển thị:</span>
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 text-sm font-medium rounded-l-md transition-colors ${
                  viewMode === 'card' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-sm font-medium rounded-r-md transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Bảng
              </button>
            </div>
          </div>
          
          {/* Add Coupon Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Hủy' : '+ Tạo mã mới'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">🎫</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tổng mã</p>
              <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm font-semibold">✅</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
              <p className="text-lg font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-sm font-semibold">⏰</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Hết hạn</p>
              <p className="text-lg font-semibold text-gray-900">{stats.expired}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-sm font-semibold">📊</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Đã sử dụng</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalUsed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tạo mã giảm giá mới</h2>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã giảm giá</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={form.code} 
                  onChange={e=>setForm(f=>({...f, code:e.target.value}))} 
                  placeholder="SUMMER10" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={form.type} 
                  onChange={e=>setForm(f=>({...f, type:e.target.value}))}
                >
                  <option value="percent">📊 Phần trăm (%)</option>
                  <option value="fixed">💰 Cố định (₫)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  type="number" 
                  value={form.value} 
                  onChange={e=>setForm(f=>({...f, value:e.target.value}))} 
                  placeholder={form.type === 'percent' ? '10' : '50000'} 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lần sử dụng tối đa</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  type="number" 
                  value={form.maxUses} 
                  onChange={e=>setForm(f=>({...f, maxUses:e.target.value}))} 
                  placeholder="Không giới hạn"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  type="datetime-local" 
                  value={form.expiresAt} 
                  onChange={e=>setForm(f=>({...f, expiresAt:e.target.value}))}
                />
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={form.active} 
                    onChange={e=>setForm(f=>({...f, active:e.target.checked}))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Kích hoạt ngay</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Ghi chú về mã giảm giá (tùy chọn)" 
                value={form.note} 
                onChange={e=>setForm(f=>({...f, note:e.target.value}))}
                rows={2}
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang tạo...</span>
                  </div>
                ) : (
                  'Tạo mã giảm giá'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Tìm theo mã giảm giá..." 
              value={q} 
              onChange={e=>setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            />
          </div>
          <button 
            onClick={load}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Error Message */}
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
              <div className="mt-2 text-sm text-red-700">{err.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Đang tải...</span>
          </div>
        </div>
      ) : items.length ? (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(coupon => (
                <CouponCard key={coupon._id} coupon={coupon} onToggle={toggleActive} onRemove={remove} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đã dùng</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Giới hạn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hết hạn</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map(coupon => (
                      <tr key={coupon._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <TypeBadge type={coupon.type} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {coupon.type === 'percent' ? `${coupon.value}%` : `${Number(coupon.value || 0).toLocaleString()}₫`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">{coupon.used || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">{coupon.maxUses || '∞'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fmtDate(coupon.expiresAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <StatusBadge coupon={coupon} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => toggleActive(coupon)}
                              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                coupon.active 
                                  ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                                  : 'text-green-600 bg-green-50 hover:bg-green-100'
                              }`}
                            >
                              {coupon.active ? 'Tắt' : 'Bật'}
                            </button>
                            <button 
                              onClick={() => remove(coupon._id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                            >
                              Xóa
                            </button>
                  </div>
                        </td>
              </tr>
                    ))}
          </tbody>
        </table>
      </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có mã giảm giá</h3>
          <p className="text-gray-500">Tạo mã giảm giá đầu tiên để bắt đầu.</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}
function Th({ children }) { return <th className="px-3 py-2 text-left font-medium">{children}</th>; }
function Td({ children, className="" }) { return <td className={`px-3 py-2 ${className}`}>{children}</td>; }
