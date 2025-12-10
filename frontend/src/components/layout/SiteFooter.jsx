import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <>
      <footer className="bg-gray-900 text-white pt-16 pb-8" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-6">
                <img
                  src="https://res.cloudinary.com/dqawqvxcr/image/upload/v1761117182/LuxeVie_2_zvsptx.png"
                  alt="LuxeVie Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-gray-400 mb-4">Điểm đến thời trang toàn diện cho bạn.
                Trang phục chất lượng, phong cách đa dạng, giá cả hợp lý.</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">THÔNG TIN</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/about" className="hover:text-white">Giới thiệu LUXEVIE</Link></li>
                <li><a href="#" className="hover:text-white">Hệ thống cửa hàng</a></li>
                <li><a href="#" className="hover:text-white">Tuyển dụng</a></li>
                <li><Link to="/contact" className="hover:text-white">Thông tin liên hệ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">TRỢ GIÚP</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white">Phương thức thanh toán</a></li>
                <li><Link to="/chinh-sach-khach-hang-than-thiet" className="hover:text-white">Chính sách khách hàng thân thiết</Link></li>
                <li><Link to="/chinh-sach-giao-hang" className="hover:text-white">Chính sách giao hàng</Link></li>
                <li><Link to="/chinh-sach-mua-hang" className="hover:text-white">Chính sách mua hàng</Link></li>
                <li><Link to="/chinh-sach-doi-tra" className="hover:text-white">Chính sách đổi trả</Link></li>
                <li><Link to="/chinh-sach-bao-hanh" className="hover:text-white">Chính sách bảo hành</Link></li>
                <li><Link to="/chinh-sach-bao-mat" className="hover:text-white">Chính sách bảo mật</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">THANH TOÁN</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white">Visa / Mastercard / JCB</a></li>
                <li><a href="#" className="hover:text-white">ATM / Internet Banking</a></li>
                <li><a href="#" className="hover:text-white">Quét mã QR</a></li>
                <li><a href="#" className="hover:text-white">Ví điện tử</a></li>
                <li><a href="#" className="hover:text-white">Mua trước trả sau</a></li>
                <li><a href="#" className="hover:text-white">Thanh toán khi nhận hàng (COD)</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">© {new Date().getFullYear()} LuxeVie. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
    </>
  );
}
