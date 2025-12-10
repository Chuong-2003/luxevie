import { useEffect, useState } from "react";
import Container from "../components/layout/Container";
import api, { extractError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  /* Profile State */
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // New state for upload
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState("");

  /* Password State */
  const [passValues, setPassValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passErr, setPassErr] = useState(null);
  const [passOk, setPassOk] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const { data } = await api.get("/users/me");
        if (!alive) return;
        setValues({
          name: data?.user?.name || "",
          email: data?.user?.email || "",
          phone: data?.user?.phone || "",
          address: data?.user?.address || "",
          avatarUrl: data?.user?.avatarUrl || "",
        });
      } catch (e) {
        setErr(extractError(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  const onChange = (e) =>
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  async function onAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size/type if needed
    if (file.size > 5 * 1024 * 1024) {
      setErr({ message: "File quá lớn. Vui lòng chọn ảnh < 5MB" });
      return;
    }

    try {
      setUploading(true);
      setErr(null);
      const formData = new FormData();
      formData.append("file", file);

      // 1. Upload to generic endpoint
      const { data } = await api.post("/upload/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 2. Update local state
      setValues(prev => ({ ...prev, avatarUrl: data.url }));

      // 3. Auto-save profile with new avatar
      await api.patch("/users/me", { avatarUrl: data.url });
      setOk("Đã cập nhật ảnh đại diện.");
      if (refreshUser) refreshUser(); // Update global user context (header avatar)
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setOk("");
    try {
      setSaving(true);
      await api.patch("/users/me", {
        name: values.name || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        avatarUrl: values.avatarUrl || undefined, // Send avatarUrl too
      });
      setOk("Đã lưu thay đổi.");
    } catch (e) {
      setErr(extractError(e));
    } finally {
      setSaving(false);
    }
  }

  const onPassChange = (e) =>
    setPassValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  async function onPassSubmit(e) {
    e.preventDefault();
    setPassErr(null);
    setPassOk("");

    if (passValues.newPassword !== passValues.confirmNewPassword) {
      setPassErr({ message: "Mật khẩu mới không khớp." });
      return;
    }

    try {
      setPassLoading(true);
      await api.post("/auth/change-password", {
        currentPassword: passValues.currentPassword,
        newPassword: passValues.newPassword,
      });
      setPassOk("Đổi mật khẩu thành công.");
      setPassValues({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (e) {
      setPassErr(extractError(e));
    } finally {
      setPassLoading(false);
    }
  }

  if (loading) return <Container className="py-8">Đang tải…</Container>;

  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Hồ sơ của tôi</h1>

        <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-4 md:p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-lg border-b pb-2">Thông tin cá nhân</h2>

          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center gap-3 mb-4">
            <div className="relative w-24 h-24">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center">
                {values.avatarUrl ? (
                  <img src={values.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-gray-300 font-bold">{values.name?.[0] || "U"}</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                <input type="file" className="hidden" accept="image/*" onChange={onAvatarChange} disabled={uploading} />
              </label>
            </div>
            {uploading && <span className="text-xs text-blue-600 animate-pulse">Đang tải ảnh...</span>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Họ và tên">
              <input
                name="name"
                className="input"
                value={values.name}
                onChange={onChange}
                placeholder="Nguyễn Văn A"
              />
            </Field>
            <Field label="Email">
              <input className="input bg-gray-50" value={values.email} disabled />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Số điện thoại">
              <input
                name="phone"
                className="input"
                value={values.phone}
                onChange={onChange}
                placeholder="09xxxxxxxx"
              />
            </Field>
            <Field label="Địa chỉ">
              <input
                name="address"
                className="input"
                value={values.address}
                onChange={onChange}
                placeholder="Số nhà, đường, phường…"
              />
            </Field>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu thông tin"}
            </button>
          </div>

          {err && <div className="text-sm text-red-600">{err.message}</div>}
          {ok && <div className="text-sm text-green-600">{ok}</div>}
        </form>

        {/* CHANGE PASSWORD FORM */}
        <form onSubmit={onPassSubmit} className="rounded-2xl border bg-white p-4 md:p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-lg border-b pb-2">Đổi mật khẩu</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Mật khẩu hiện tại">
              <input
                type="password"
                name="currentPassword"
                className="input"
                value={passValues.currentPassword}
                onChange={onPassChange}
                required
              />
            </Field>
            <Field label="Mật khẩu mới">
              <input
                type="password"
                name="newPassword"
                className="input"
                value={passValues.newPassword}
                onChange={onPassChange}
                required
                minLength={6}
              />
            </Field>
            <Field label="Xác nhận mật khẩu mới">
              <input
                type="password"
                name="confirmNewPassword"
                className="input"
                value={passValues.confirmNewPassword}
                onChange={onPassChange}
                required
                minLength={6}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button className="btn-secondary" disabled={passLoading}>
              {passLoading ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </div>

          {passErr && <div className="text-sm text-red-600">{passErr.message}</div>}
          {passOk && <div className="text-sm text-green-600">{passOk}</div>}
        </form>

        {/* RECENT ORDERS */}
        <div className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Đơn hàng gần đây</div>
              <div className="text-sm text-gray-600">Xem lịch sử mua hàng của bạn</div>
            </div>
            <Link to="/orders" className="btn-ghost">Xem đơn</Link>
          </div>
        </div>
      </div>
    </Container>
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

// Ensure you import api in Profile.jsx if not already
// import api, { extractError } from "../services/api";
