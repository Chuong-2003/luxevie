import { NavLink, Link } from "react-router-dom";

const item = (to, label, icon) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm 
       hover:bg-gray-100 ${isActive ? 'bg-gray-100 font-medium' : ''}`
    }
  >
    <span className="text-gray-500">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function AdminSidebar() {
  return (
    <aside className="hidden md:block w-64 border-r bg-white min-h-screen sticky top-0">
      <div className="px-4 py-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/dqawqvxcr/image/upload/v1761117182/LuxeVie_2_zvsptx.png"
            alt="LuxeVie Logo"
            className="h-8 w-auto object-contain"
          />
          <span className="text-xs text-gray-500 font-medium">Admin</span>
        </Link>
      </div>
      <div className="p-3 space-y-1">
        {item("/admin", "Dashboard", "📊")}
        {item("/admin/orders", "Orders", "🧾")}
        {item("/admin/products", "Products", "📦")}
        {item("/admin/users", "Users", "👤")}
        {item("/admin/coupons", "Coupons", "🏷️")}
        {item("/admin/banners", "Banner", "🖼️")}
        {item("/admin/brand-sections", "Brand Sections", "⭐")}
        {item("/admin/product-catalog", "Product Catalog", "📋")}
        {item("/admin/reviews", "Reviews (Đánh giá)", "⭐")}
        {item("/admin/chat", "Chat Support", "💬")}
      </div>
    </aside>
  );
}
