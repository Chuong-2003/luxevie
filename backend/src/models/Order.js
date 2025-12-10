import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  name: String,
  image: String, // snapshot ảnh lúc mua
  sku: String,
  color: String,
  size: String,
  price: { type: Number, required: true }, // đơn giá đã chốt
  qty: { type: Number, required: true },
}, { _id: false });

const AddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  email: String,
  address: String, // địa chỉ cụ thể (frontend field)
  line1: String,
  line2: String,
  ward: String,
  district: String,
  city: String,
  province: String, // frontend field
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  code: { type: String, unique: true, index: true }, // vd: OD20250001
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  items: { type: [OrderItemSchema], required: true },
  note: String,

  shippingAddress: AddressSchema,
  paymentMethod: { type: String, enum: ['cod', 'bank', 'momo', 'vnpay', 'qr', 'paypal'], default: 'cod' },

  subtotal: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  paid: { type: Boolean, default: false },

  // MoMo payment info
  momoRequestId: { type: String },
  momoTransId: { type: String },
  momoResponseTime: { type: Date },
  paymentInfo: {
    momo: {
      transId: String,
      payType: String,
      responseTime: Date,
      amount: Number,
    }
  },

  // log mốc thời gian
  placedAt: Date,
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  refundedAt: Date,
}, { timestamps: true });

export const Order = mongoose.model('Order', OrderSchema);
