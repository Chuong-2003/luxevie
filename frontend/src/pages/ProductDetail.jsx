// src/pages/ProductDetail.jsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import { addItem as addToCart } from '../services/cart';
import { fetchReviews, createReview } from '../services/reviews';
import RegistrationForm from '../components/RegistrationForm';
import { useAuth } from '../context/AuthContext';

const imgOf = (im) => (typeof im === 'string' ? im : im?.url);
function discountPct(base, sale) {
  if (!base || !sale || sale >= base) return null;
  const pct = Math.round(((base - sale) / base) * 100);
  return pct > 0 ? pct : null;
}
function finalUnitPrice(product, variant) {
  if (variant?.price && variant.price > 0) return variant.price;
  if (product?.salePrice && product.salePrice > 0) return product.salePrice;
  return product?.price || 0;
}
function basePrice(product, variant) {
  return product?.price || variant?.price || 0;
}
function deriveOptions(product) {
  const vs = Array.isArray(product?.variants) ? product.variants : [];
  const colors = [...new Set(vs.map(v => v.color).filter(Boolean))];
  const sizesFromVariants = [...new Set(vs.map(v => v.size).filter(Boolean))];
  const sizes = sizesFromVariants.length ? sizesFromVariants : (Array.isArray(product?.sizes) ? product.sizes : []);
  return { colors, sizes, variants: vs };
}
function inStock(product, variant) {
  if (variant) return (variant.stock || 0) > 0;
  const vs = Array.isArray(product?.variants) ? product.variants : [];
  if (vs.length) return vs.some(v => (v.stock || 0) > 0);
  return (product?.stock || 0) > 0;
}

function PriceBlock({ product, variant }) {
  const unit = finalUnitPrice(product, variant);
  const base = basePrice(product, variant);
  const pct = base > unit ? discountPct(base, unit) : null;
  return (
    <div className="flex items-baseline gap-2">
      <div className="text-2xl font-bold text-red-600">{Number(unit).toLocaleString()}₫</div>
      {base > unit && (
        <>
          <div className="line-through text-gray-500">{Number(base).toLocaleString()}₫</div>
          {pct ? <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-semibold">-{pct}%</span> : null}
        </>
      )}
    </div>
  );
}

function Gallery({ images = [] }) {
  const [idx, setIdx] = useState(0);
  const src = imgOf(images[idx]) || imgOf(images[0]);
  if (!images?.length) return <div className="w-full aspect-[4/5] bg-neutral-100 rounded-xl" />;

  const totalImages = images.length;
  const goPrev = () => setIdx((prev) => (prev - 1 + totalImages) % totalImages);
  const goNext = () => setIdx((prev) => (prev + 1) % totalImages);

  return (
    <div className="space-y-3">
      {/* Ảnh chính với nút điều hướng */}
      <div className="relative rounded-xl overflow-hidden border bg-white">
        <div className="w-full aspect-[4/5] bg-neutral-100 max-w-md mx-auto relative">
          <img src={src} alt="product" className="w-full h-full object-cover" />

          {/* Nút điều hướng - chỉ hiển thị khi có nhiều hơn 1 ảnh */}
          {totalImages > 1 && (
            <>
              {/* Nút Previous (Trái) */}
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
                aria-label="Ảnh trước"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Nút Next (Phải) */}
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
                aria-label="Ảnh sau"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails - hiển thị ngang ở dưới */}
      <div className="flex gap-2 overflow-x-auto snap-x pb-2">
        {images.map((im, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border snap-start ${i === idx ? 'ring-2 ring-black' : 'hover:border-gray-400'}`}
            aria-label={`thumb ${i + 1}`}
          >
            <div className="w-full h-full bg-neutral-100">
              <img src={imgOf(im)} alt={`thumb-${i}`} className="w-full h-full object-cover" loading="lazy" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Accordion({ items }) {
  const [open, setOpen] = useState(items?.[0]?.key || null);
  return (
    <div className="divide-y rounded-lg border bg-white">
      {items.map((it) => (
        <div key={it.key}>
          <button
            onClick={() => setOpen(o => (o === it.key ? null : it.key))}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
          >
            <span className="font-medium">{it.title}</span>
            <span className="text-xl">{open === it.key ? '−' : '+'}</span>
          </button>
          {open === it.key && (
            <div className="px-4 pb-4 text-sm text-gray-700">
              {typeof it.content === 'string' ? <p>{it.content}</p> : it.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// -function RatingSummary({ product, localReviews }) {
// -  const reviews = product?.reviews || [];
// -  const all = [...reviews, ...localReviews];
// -  const count = all.length;
// -  const avg = count ? all.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
function RatingSummary({ reviews = [] }) {
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
  return (
    <div className="flex items-center gap-2">
      <StarRating value={avg} readOnly size={18} />
      {/* <span className="text-sm text-gray-600">{count ? `${avg.toFixed(1)} / 5 (${count})` : 'Chưa có đánh giá'}</span> */}
      <span className="text-sm text-gray-600">
        {count ? `${avg.toFixed(1)} / 5 (${count})` : 'Chưa có đánh giá'}
      </span>
    </div>
  );
}

// Product Carousel Section Component
function ProductCarouselSection({ title, products }) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
      setTimeout(checkScrollButtons, 100);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
      setTimeout(checkScrollButtons, 100);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      setTimeout(checkScrollButtons, 100);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
      };
    }
  }, [products]);

  if (!products || products.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
          onScroll={checkScrollButtons}
        >
          {products.map((product) => (
            <div key={product._id} className="flex-shrink-0" style={{ width: '220px', minWidth: '220px' }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {products.length > 4 && (
          <>
            {/* Left Arrow */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all z-10"
                aria-label="Scroll left"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Right Arrow */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center hover:bg-gray-50 hover:shadow-xl transition-all z-10"
                aria-label="Scroll right"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [p, setP] = useState(null);
  const [related, setRelated] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { colors, sizes, variants } = useMemo(() => deriveOptions(p || {}), [p]);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);

  const [localReviews, setLocalReviews] = useState([]);
  // const [reviewForm, setReviewForm] = useState({ rating: 5, name: '', content: '' });

  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, name: '', content: '' });
  const [rvLoading, setRvLoading] = useState(false);

  // Tự động điền tên user nếu đã đăng nhập (đã bỏ trường name, dùng từ user)
  // useEffect không cần thiết nữa vì form chỉ hiển thị khi đã đăng nhập
  const images = p?.images?.length
    ? p.images
    : [{ url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop' }];

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    const exact = variants.find(
      v => (color ? v.color === color : true) && (size ? v.size === size : true)
    );
    if (exact) return exact;
    // fallback: lấy biến thể còn hàng
    const firstInStock = variants.find(v => (v.stock || 0) > 0);
    return firstInStock || variants[0] || null;
  }, [variants, color, size]);

  // ✅ HOOK này đặt trước mọi return
  const availableSizes = useMemo(() => {
    if (!variants.length || !color) return sizes;
    const set = new Set(
      variants.filter(v => v.color === color && (v.stock || 0) > 0).map(v => v.size)
    );
    return sizes.filter(s => set.has(s));
  }, [variants, color, sizes]);

  const canBuy =
    inStock(p, selectedVariant) &&
    (!variants.length || (size || colors.length === 0));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products/${id}`);
        if (!alive) return;

        const prod = data.product;
        setP(prod);

        /* (a) ✅ Preselect biến thể còn hàng
           - Nếu có variants: chọn biến thể đầu tiên còn stock > 0 (nếu không có, chọn biến thể đầu tiên)
           - Set luôn cả color/size nếu có
           - Nếu không có variants nhưng có danh sách sizes: có thể preselect size đầu tiên (tuỳ bạn, có thể bỏ nếu muốn bắt user chọn)
        */
        if (Array.isArray(prod?.variants) && prod.variants.length) {
          const vInStock = prod.variants.find(v => (v.stock || 0) > 0) || prod.variants[0];
          if (vInStock) {
            if (vInStock.color) setColor(vInStock.color);
            if (vInStock.size) setSize(vInStock.size);
          }
        } else {
          // Không có variants: tuỳ chọn preselect size đầu tiên (nếu bạn có mảng sizes riêng)
          if (Array.isArray(prod?.sizes) && prod.sizes.length) {
            setSize(prod.sizes[0]);
          }
        }

        // Related products (by brand and category)
        const rel = await api.get(`/products/${id}/related`);
        if (alive) setRelated((rel?.data?.items || []).slice(0, 10));

        // Bestsellers (top 10 most sold products)
        const bestsellersRes = await api.get('/products', {
          params: { sort: 'sold_desc', limit: 10, status: 'active' }
        });
        if (alive) setBestsellers((bestsellersRes?.data?.items || []).filter(item => item._id !== id));

        // Promotions (products with salePrice, sorted by discount percentage)
        const promotionsRes = await api.get('/products', {
          params: { saleOnly: 'true', limit: 50, status: 'active' }
        });
        if (alive) {
          const allPromotions = promotionsRes?.data?.items || [];
          const productsWithDiscount = allPromotions
            .filter(item => {
              const price = item.price || 0;
              const salePrice = item.salePrice || 0;
              return salePrice > 0 && salePrice < price && item._id !== id;
            })
            .map(item => {
              const price = item.price || 0;
              const salePrice = item.salePrice || 0;
              const discount = ((price - salePrice) / price) * 100;
              return { ...item, discount };
            })
            .sort((a, b) => b.discount - a.discount)
            .slice(0, 10);
          setPromotions(productsWithDiscount);
        }

        // 🔽 Reviews thật
        setRvLoading(true);
        try {
          const rv = await fetchReviews(id, { page: 1, limit: 20 });
          if (alive) setReviews(rv.items || []);
        } finally {
          if (alive) setRvLoading(false);
        }
      } catch {
        navigate('/collection', { replace: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, navigate]);


  const onAddToCart = () => {
    // Kiểm tra đăng nhập trước
    if (!user) {
      const confirmLogin = window.confirm('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng. Bạn có muốn đăng nhập ngay bây giờ?');
      if (confirmLogin) {
        navigate('/login', { state: { returnTo: `/product/${id}` } });
      }
      return;
    }

    if (!p) return;
    if (variants.length && !size && sizes.length) {
      alert('Vui lòng chọn size.');
      return;
    }
    if (!inStock(p, selectedVariant)) {
      alert('Sản phẩm tạm hết hàng.');
      return;
    }

    const line = {
      productId: p._id,
      name: p.name,
      image: imgOf(p.images?.[0]) || '',
      price: finalUnitPrice(p, selectedVariant),
      qty: Math.max(1, qty),
      size: selectedVariant?.size || size || '',
      color: selectedVariant?.color || color || '',
      sku: selectedVariant?.sku || '',
    };

    addToCart(line);
    alert('Đã thêm vào giỏ');
  };

  // const submitReview = (e) => {
  //   e.preventDefault();
  //   const r = { ...reviewForm, rating: Number(reviewForm.rating) || 5, createdAt: new Date().toISOString() };
  //   if (!r.name || !r.content) return alert('Vui lòng nhập tên và nội dung đánh giá.');
  //   setLocalReviews(prev => [r, ...prev]);
  //   setReviewForm({ rating: 5, name: '', content: '' });
  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Vui lòng đăng nhập để đánh giá.');
      return;
    }
    const payload = {
      name: user.name || user.email || 'Khách',
      content: reviewForm.content?.trim(),
      rating: Number(reviewForm.rating) || 5,
    };
    if (!payload.content) {
      alert('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    try {
      const rv = await createReview(id, payload);
      setReviews((prev) => [rv, ...prev]);            // prepend review mới
      setReviewForm({ rating: 5, name: '', content: '' }); // Reset form
    } catch (err) {
      console.error(err);
      alert('Gửi đánh giá thất bại. Vui lòng thử lại.');
    }
  };

  // ====== return chỉ nằm sau tất cả hooks ======
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border overflow-hidden">
            <div className="w-full aspect-[4/5] bg-neutral-200 animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-8 bg-neutral-200 rounded w-3/4 animate-pulse" />
            <div className="h-5 bg-neutral-200 rounded w-1/2 animate-pulse" />
            <div className="h-10 bg-neutral-200 rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (!p) return null;

  const breadcrumbs = [
    { to: '/', label: 'Trang chủ' },
    p.category ? { to: `/collection?category=${p.category}`, label: p.category } : null,
    { label: p.name },
  ].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* breadcrumbs */}
      <nav className="text-sm text-gray-600 mb-3">
        <ol className="flex flex-wrap items-center gap-2">
          {breadcrumbs.map((b, i) => (
            <li key={i} className="flex items-center gap-2">
              {b.to ? <Link to={b.to} className="hover:underline">{b.label}</Link> : <span>{b.label}</span>}
              {i < breadcrumbs.length - 1 && <span className="text-gray-400">/</span>}
            </li>
          ))}
        </ol>
      </nav>

      {/* main */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
        <div className="md:sticky md:top-24 h-max">
          <Gallery images={images} />
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">{p.name}</h1>
          {p.brand && <div className="mt-1 text-gray-500 text-sm">Thương hiệu: {p.brand}</div>}

          <div className="mt-2"><RatingSummary reviews={reviews} /></div>
          <div className="mt-3"><PriceBlock product={p} variant={selectedVariant} /></div>

          {!!colors.length && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Chọn màu</div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const anyStock = variants.some(v => v.color === c && (v.stock || 0) > 0);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c === color ? '' : c)}
                      disabled={!anyStock}
                      className={`px-3 py-1.5 rounded border ${color === c ? 'bg-black text-white' : 'hover:bg-gray-50'} disabled:opacity-40`}
                      title={anyStock ? c : `${c} (hết hàng)`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!!sizes.length && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium mb-2">Chọn size</div>
                <a href="#size-guide" onClick={(e) => e.preventDefault()} className="text-xs text-gray-600 hover:text-black">
                  Hướng dẫn chọn size
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const enabled = !color
                    ? (variants.length ? variants.some(v => v.size === s && (v.stock || 0) > 0) : true)
                    : availableSizes.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(prev => (prev === s ? '' : s))}
                      disabled={!enabled}
                      className={`px-3 py-1.5 rounded border ${size === s ? 'bg-black text-white' : 'hover:bg-gray-50'} disabled:opacity-40`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button className="px-3 py-2 hover:bg-gray-50" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <input
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center outline-none"
                inputMode="numeric"
              />
              <button className="px-3 py-2 hover:bg-gray-50" onClick={() => setQty(q => q + 1)}>+</button>
            </div>

            <button onClick={onAddToCart} disabled={!canBuy} className="flex-1 px-4 py-3 rounded-xl bg-black text-white font-medium hover:opacity-90 disabled:opacity-50">Thêm vào giỏ</button>
            <button onClick={() => { onAddToCart(); navigate('/cart'); }} disabled={!canBuy} className="px-4 py-3 rounded-xl border font-medium hover:bg-gray-50 disabled:opacity-50">Mua ngay</button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border p-3"><div className="font-medium">Giao nhanh</div><div className="text-gray-600">2–4 ngày toàn quốc</div></div>
            <div className="rounded-xl border p-3"><div className="font-medium">Đổi trả 7 ngày</div><div className="text-gray-600">Đổi size, lỗi kỹ thuật</div></div>
            <div className="rounded-xl border p-3"><div className="font-medium">Thanh toán</div><div className="text-gray-600">COD / Chuyển khoản</div></div>
          </div>

          <div className="mt-6 space-y-3">
            <Accordion
              items={[
                { key: 'desc', title: 'Mô tả sản phẩm', content: p.description || 'Đang cập nhật mô tả chi tiết.' },
                {
                  key: 'specs', title: 'Thông số & chất liệu',
                  content: (
                    <div className="whitespace-pre-line text-sm text-gray-700">
                      {Array.isArray(p.specs) && p.specs.length ? (
                        p.specs.join('\n')
                      ) : (
                        'Chất liệu: Cotton/Poly tuỳ phiên bản\nPhom: Regular / Slim\nHDSD: Giặt máy nhẹ, không tẩy, ủi nhiệt độ thấp'
                      )}
                    </div>
                  ),
                },
                { key: 'ship', title: 'Vận chuyển & đổi trả', content: 'Giao 2–4 ngày toàn quốc. Đổi trả 7 ngày (chưa sử dụng, còn tag).' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Đánh giá */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Đánh giá</h3>
          <RatingSummary reviews={reviews} />
        </div>

        {/* Form đánh giá - chỉ hiển thị khi đã đăng nhập */}
        {user && (
          <form onSubmit={submitReview} className="mb-6 bg-white">
            <div className="flex items-center gap-3">
              {/* Avatar người dùng bên trái */}
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-semibold text-sm">
                    {String(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Input field - mở rộng */}
              <div className="flex-1">
                <textarea
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-400 outline-none resize-none min-h-[50px]"
                  placeholder="Viết bình luận..."
                  rows={1}
                />
              </div>

              {/* Rating và nút gửi - cùng hàng */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm(f => ({ ...f, rating: v }))} size={20} />
                <button
                  type="submit"
                  disabled={!reviewForm.content.trim()}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Gửi đánh giá"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Danh sách đánh giá */}
        <div className="space-y-4">
          {rvLoading ? (
            <div className="text-sm text-gray-500">Đang tải đánh giá…</div>
          ) : reviews.length ? (
            reviews.map((r, i) => (
              <div key={r._id || i} className="bg-white border rounded-lg p-4">
                {/* Header: Avatar + Username */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                    {r.user?.avatarUrl || r.avatar ? (
                      <img src={r.user?.avatarUrl || r.avatar} alt={r.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 font-semibold text-sm">
                        {(r.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{r.name || 'Khách'}</div>
                  </div>
                </div>

                {/* Rating - Sao đỏ */}
                <div className="mb-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} width={18} height={18} viewBox="0 0 20 20" fill="currentColor"
                        className={r.rating >= s ? 'text-red-500' : 'text-gray-300'}>
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.562-.954L10 0l2.948 5.956 6.562.954-4.755 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>

                {/* Metadata: Ngày + Phân loại hàng */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  {r.createdAt && (
                    <>
                      <span>{new Date(r.createdAt).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      {r.productVariant && (
                        <>
                          <span>|</span>
                          <span>Phân loại hàng: {r.productVariant}</span>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Product Attributes */}
                {(r.scent || r.skinType || r.function) && (
                  <div className="text-sm text-gray-600 mb-3 space-y-1">
                    {r.scent && <div>Mùi hương: {r.scent}</div>}
                    {r.skinType && <div>Dành cho da: {r.skinType}</div>}
                    {r.function && <div>Công dụng: {r.function}</div>}
                  </div>
                )}

                {/* Review Content */}
                <div className="text-gray-900 mt-2 whitespace-pre-line">{r.content}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">Chưa có đánh giá.</div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <ProductCarouselSection title="Sản phẩm liên quan" products={related} />

      {/* Bestsellers */}
      <ProductCarouselSection title="Sản phẩm nổi bật" products={bestsellers} />

      {/* Promotions */}
      <ProductCarouselSection title="Sản phẩm khuyến mãi" products={promotions} />

      {/* Registration Form */}
      <RegistrationForm />
    </div>
  );
}
