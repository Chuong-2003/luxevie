// src/pages/admin/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminStats } from "../../services/adminStats";
import BtnExportReport from "../../components/BtnExportReport";

const money = (n) => (Number(n || 0)).toLocaleString("vi-VN") + "₫";

/* ---------- UI atoms ---------- */
function Sparkline({ values = [], tone = "indigo" }) {
  const max = Math.max(...values, 1);
  const colors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
  };
  return (
    <div className="h-8 flex items-end gap-1 mt-auto">
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm ${colors[tone] || "bg-gray-300"}`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

function Badge({ status }) {
  const cls = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-sky-50 text-sky-700 border-sky-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  }[status] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs ${cls}`}>
      {status}
    </span>
  );
}

function CardShell({ title, action, children, desc }) {
  return (
    <section className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function KpiCard({ title, value, delta, icon = "📈", tone = "indigo", hint, spark = [] }) {
  const colors = {
    indigo: {
      text: "text-blue-600",
      bgIcon: "bg-gradient-to-br from-blue-500 to-indigo-600",
      pill: "bg-blue-50 text-blue-700",
      blob: "bg-blue-500"
    },
    emerald: {
      text: "text-emerald-600",
      bgIcon: "bg-gradient-to-br from-emerald-500 to-teal-600",
      pill: "bg-emerald-50 text-emerald-700",
      blob: "bg-emerald-500"
    },
    amber: {
      text: "text-amber-600",
      bgIcon: "bg-gradient-to-br from-amber-400 to-orange-500",
      pill: "bg-amber-50 text-amber-700",
      blob: "bg-amber-500"
    },
    violet: {
      text: "text-violet-600",
      bgIcon: "bg-gradient-to-br from-violet-500 to-purple-600",
      pill: "bg-violet-50 text-violet-700",
      blob: "bg-violet-500"
    },
  }[tone] || {
    text: "text-gray-600",
    bgIcon: "bg-gray-600",
    pill: "bg-gray-100 text-gray-700",
    blob: "bg-gray-400"
  };

  const isPositive = delta > 0;
  const TrendIcon = isPositive ? (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
  ) : (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
  );

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 border border-gray-100">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${colors.bgIcon} transform group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-xl font-medium">{icon}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 relative z-10">
        {!!delta && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-xs font-medium text-gray-400">{hint}</span>}
      </div>

      {/* Decorative Blob */}
      <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-[0.08] ${colors.blob} blur-2xl group-hover:opacity-[0.15] transition-opacity duration-500`} />

      {/* Sparkline Integration */}
      {spark?.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-0 opacity-40 group-hover:opacity-60 transition-opacity">
          {/* Reusing Sparkline component but adjusting its container placement if needed */}
          <Sparkline values={spark} tone={tone} />
        </div>
      )}
    </div>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

/* ---------- Page ---------- */
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    ordersTotal: 0,
    productsTotal: 0,
    usersTotal: 0,
    recentOrders: [],
  });
  const [range, setRange] = useState("7d");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAdminStats(); // thay bằng API thật của bạn
        setStats(data || {});
      } finally {
        setLoading(false);
      }
    })();
  }, [range]);

  const top5 = useMemo(() => stats.recentOrders?.slice(0, 5) ?? [], [stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Bảng điều khiển</h1>
          <p className="text-sm text-gray-500">Hiệu suất bán hàng & hoạt động gần đây</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border px-3 py-2 bg-white text-sm"
            aria-label="Phạm vi thời gian"
          >
            <option value="7d">7 ngày</option>
            <option value="30d">30 ngày</option>
            <option value="90d">90 ngày</option>
          </select>
          <BtnExportReport />
          <Link
            to="/admin/coupons"
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Tạo khuyến mãi
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </>
        ) : (
          <>
            <KpiCard
              title="Doanh thu"
              value={money(stats.revenue)}
              delta={12}
              color="blue"
              spark={[6, 9, 7, 11, 9, 13, 12, 14, 11, 15, 13, 16, 14]}
            />
            <KpiCard
              title="Đơn hàng"
              value={stats.ordersTotal}
              delta={5}
              color="teal"
              spark={[4, 5, 3, 8, 6, 9, 7, 10, 8, 11, 9, 12, 10]}
            />
            <KpiCard
              title="Sản phẩm"
              value={stats.productsTotal}
              delta={-3}
              color="yellow"
              spark={[10, 12, 11, 9, 10, 12, 11, 13, 11, 14, 12, 10, 8]}
            />
            <KpiCard
              title="Người dùng"
              value={stats.usersTotal}
              delta={9}
              color="red"
              spark={[2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7]}
            />
          </>
        )}
      </div>

      {/* 3 cột: Đơn mới / Bán chạy / Việc cần làm */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <CardShell
          title="Đơn hàng mới"
          desc="5 đơn gần nhất"
          action={<Link to="/admin/orders" className="text-sm text-indigo-600 hover:underline">Xem tất cả</Link>}
        >
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : top5.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-3">Mã</th>
                    <th className="py-2 pr-3">Khách</th>
                    <th className="py-2 pr-3">Ngày</th>
                    <th className="py-2 pr-3">Tổng</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {top5.map((o) => (
                    <tr key={o._id} className="border-t">
                      <td className="py-2 pr-3 font-medium">{o.code || o._id.slice(-6)}</td>
                      <td className="py-2 pr-3">{o.customer?.name || o.user?.email || "-"}</td>
                      <td className="py-2 pr-3">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-3 font-medium">{money(o.total)}</td>
                      <td className="py-2 pr-3"><Badge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Chưa có đơn hàng.</div>
          )}
        </CardShell>

        <CardShell
          title="Sản phẩm bán chạy"
          desc="Top demo (thay bằng API thật)"
          action={<Link to="/admin/products" className="text-sm text-indigo-600 hover:underline">Quản lý</Link>}
        >
          <ul className="divide-y">
            {["Áo thun Basic", "Quần jeans Slim", "Áo khoác Hoodie", "Ví da Mini", "Giày Runner"].map((p, i) => (
              <li key={i} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100" />
                  <div>
                    <div className="font-medium text-sm">{p}</div>
                    <div className="text-xs text-gray-500">Tồn kho: {Math.floor(Math.random() * 80) + 20}</div>
                  </div>
                </div>
                <div className="text-sm font-medium">{money(99000 + i * 20000)}</div>
              </li>
            ))}
          </ul>
        </CardShell>

        <CardShell
          title="Công việc cần làm"
          desc="Tự động gợi ý từ dữ liệu bán hàng"
          action={<button className="text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50">Thêm</button>}
        >
          <ul className="space-y-2">
            {[
              "Duyệt 3 đánh giá mới",
              "Nhập thêm hàng Áo thun Basic",
              "Tạo campaign 11.11",
              "Trả lời 2 ticket hỗ trợ",
            ].map((t, i) => (
              <li key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                <div className="text-sm">{t}</div>
                <button className="text-xs text-indigo-600">Chi tiết</button>
              </li>
            ))}
          </ul>
        </CardShell>
      </div>

      {/* Biểu đồ nhỏ + trạng thái + hành động nhanh */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <CardShell title="Doanh thu theo ngày" desc="Demo CSS; có thể thay Chart.js/Recharts">
          <div className="h-40 flex items-end gap-2">
            {[40, 65, 30, 80, 55, 90, 50, 60, 70, 40, 30, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-200 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </CardShell>

        <CardShell title="Tỉ lệ trạng thái đơn">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { k: "pending", v: 12 },
              { k: "confirmed", v: 26 },
              { k: "shipped", v: 21 },
              { k: "delivered", v: 34 },
              { k: "cancelled", v: 7 },
            ].map((s) => (
              <div key={s.k} className="flex items-center justify-between p-3 rounded-lg border">
                <Badge status={s.k} />
                <span className="font-medium">{s.v}%</span>
              </div>
            ))}
          </div>
        </CardShell>

        <CardShell title="Hành động nhanh">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/products/new" className="rounded-xl border p-4 hover:bg-gray-50 text-sm">➕ Thêm sản phẩm</Link>
            <Link to="/admin/orders" className="rounded-xl border p-4 hover:bg-gray-50 text-sm">🚚 Xử lý đơn</Link>
            <Link to="/admin/users" className="rounded-xl border p-4 hover:bg-gray-50 text-sm">👤 Quản lý user</Link>
            <Link to="/admin/coupons" className="rounded-xl border p-4 hover:bg-gray-50 text-sm">🎟️ Mã giảm giá</Link>
          </div>
        </CardShell>
      </div>
    </div>
  );
}
