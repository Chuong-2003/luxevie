import { Product } from '../models/Product.js';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export const chatWithAi = async (req, res) => {
    const { message } = req.body;

    try {
        const lower = message?.toLowerCase() || "";
        let reply = "Tôi là trợ lý ảo LuxeVie. Tôi có thể giúp bạn tìm kiếm sản phẩm, kiểm tra đơn hàng hoặc trả lời các câu hỏi thường gặp.";

        // 1. Intent: Hỏi về đơn hàng
        if (lower.includes("đơn hàng") || lower.includes("tra cứu") || lower.includes("status")) {
            return res.json({ reply: "Để tra cứu đơn hàng, vui lòng vào mục 'Đơn hàng của tôi' trong trang cá nhân hoặc cung cấp Mã đơn hàng để tôi kiểm tra (tính năng đang phát triển)." });
        }

        // 2. Intent: Sản phẩm mới
        if (lower.includes("mới") || lower.includes("new")) {
            const newProducts = await Product.find({ status: 'active' })
                .sort({ createdAt: -1 })
                .limit(3)
                .select('name price salePrice slug images');

            if (newProducts.length) {
                return res.json({
                    reply: "Dưới đây là các sản phẩm mới nhất tại LuxeVie:",
                    products: newProducts
                });
            }
        }

        // 3. Intent: Sản phẩm bán chạy
        if (lower.includes("bán chạy") || lower.includes("hot") || lower.includes("top")) {
            const hotProducts = await Product.find({ status: 'active' })
                .sort({ sold: -1 })
                .limit(3)
                .select('name price salePrice images');

            if (hotProducts.length) {
                return res.json({
                    reply: "Top sản phẩm bán chạy nhất hiện nay:",
                    products: hotProducts
                });
            }
        }

        // 4. Intent: Tìm kiếm sản phẩm (keyword)
        // Loại trừ các từ khóa giao tiếp thông thường để tránh query rác
        const ignore = ["xin chào", "hello", "hi", "cảm ơn", "tạm biệt", "cho hỏi"];
        if (!ignore.some(w => lower.includes(w)) && message.length > 2) {
            // Tìm kiếm cơ bản bằng regex
            const products = await Product.find({
                status: 'active',
                name: { $regex: message, $options: 'i' }
            }).limit(3).select('name price salePrice images');

            if (products.length > 0) {
                return res.json({
                    reply: `Tôi tìm thấy một số sản phẩm phù hợp với "${message}":`,
                    products: products
                });
            }
        }

        // 5. Fallback / Giao tiếp xã giao
        if (lower.includes("xin chào") || lower.includes("hello")) {
            reply = "Xin chào! Rất vui được hỗ trợ bạn. Bạn đang tìm món thời trang nào hôm nay?";
        } else if (lower.includes("đổi trả") || lower.includes("bảo hành")) {
            reply = "LuxeVie hỗ trợ đổi trả trong vòng 30 ngày (sản phẩm còn nguyên tem). Bảo hành trọn đời cho đường may.";
        }

        // Simulate thinking delay natural
        await new Promise(r => setTimeout(r, 600));

        res.json({ reply });

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ reply: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau." });
    }
};
