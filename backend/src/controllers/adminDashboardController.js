// backend/src/controllers/adminDashboardController.js
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

// Lấy thống kê tổng quan cho dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//duy 
    // Thống kê cơ bản
    const [
      totalOrders,
      totalProducts,
      totalUsers,
      monthlyOrders,
      lastMonthOrders,
      weeklyOrders,
      todayOrders,
      monthlyRevenue,
      lastMonthRevenue,
      weeklyRevenue,
      todayRevenue,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ 
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
      }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { 
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
        }},
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'confirmed' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' })
    ]);

    // Tính toán tỷ lệ tăng trưởng
    const orderGrowthRate = lastMonthOrders > 0 
      ? ((monthlyOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1)
      : 0;
    
    const revenueGrowthRate = lastMonthRevenue[0]?.total > 0
      ? ((monthlyRevenue[0]?.total - lastMonthRevenue[0]?.total) / lastMonthRevenue[0]?.total * 100).toFixed(1)
      : 0;

    res.json({
      overview: {
        totalOrders,
        totalProducts,
        totalUsers
      },
      monthly: {
        orders: monthlyOrders,
        revenue: monthlyRevenue[0]?.total || 0,
        orderGrowthRate: parseFloat(orderGrowthRate),
        revenueGrowthRate: parseFloat(revenueGrowthRate)
      },
      weekly: {
        orders: weeklyOrders,
        revenue: weeklyRevenue[0]?.total || 0
      },
      today: {
        orders: todayOrders,
        revenue: todayRevenue[0]?.total || 0
      },
      orderStatus: {
        pending: pendingOrders,
        confirmed: confirmedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

// Lấy dữ liệu doanh thu theo thời gian (7 ngày gần đây)
export const getRevenueChart = async (req, res) => {
  try {
    const days = 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Tạo dữ liệu cho 7 ngày gần đây
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayData = revenueData.find(d => 
        d._id.day === date.getDate() && 
        d._id.month === date.getMonth() + 1 && 
        d._id.year === date.getFullYear()
      );
      
      chartData.push({
        date: date.toISOString().split('T')[0],
        revenue: dayData?.revenue || 0,
        orders: dayData?.orders || 0
      });
    }

    res.json({ chartData });
  } catch (error) {
    console.error('Error fetching revenue chart:', error);
    res.status(500).json({ message: 'Error fetching revenue chart data' });
  }
};

// Lấy đơn hàng gần đây
export const getRecentOrders = async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .select('_id code total status paid createdAt shippingAddress')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ orders: recentOrders });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ message: 'Error fetching recent orders' });
  }
};

// Lấy sản phẩm bán chạy
export const getTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.qty' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Lấy thông tin chi tiết sản phẩm
    const productIds = topProducts.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id name images price stock')
      .lean();

    const productsMap = products.reduce((acc, product) => {
      acc[product._id.toString()] = product;
      return acc;
    }, {});

    const enrichedProducts = topProducts.map(item => ({
      ...item,
      product: productsMap[item._id.toString()] || null
    }));

    res.json({ products: enrichedProducts });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Error fetching top products' });
  }
};
