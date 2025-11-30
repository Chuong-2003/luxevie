// src/services/api.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://luxevie-backend-qiz2zjce9-duy10102003s-projects.vercel.app/api';

export function getToken() {
  // cố gắng đọc theo vài kiểu lưu phổ biến
  // 1) token trực tiếp
  const t1 = localStorage.getItem('token');
  if (t1) return t1;

  // 2) object auth { token, user }
  try {
    const auth = JSON.parse(localStorage.getItem('auth') || 'null');
    if (auth?.token) return auth.token;
  } catch {}
  return null;
}

const api = axios.create({ baseURL });

// Gắn Authorization: Bearer <token>
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự xử lý 401: có thể logout/đẩy về /login (tuỳ bạn)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // phát event để UI biết token sai/hết hạn
      window.dispatchEvent(new CustomEvent('auth_401'));
      // tuỳ nhu cầu: điều hướng về login
      // import.meta.env.DEV && console.warn('401 Unauthorized – redirecting to /login');
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// tiện ích lấy message lỗi
export function extractError(err) {
  const data = err?.response?.data;
  return {
    status: err?.response?.status || 0,
    code: data?.code || 'ERROR',
    message: data?.message || err?.message || 'Unknown error',
  };
}


export async function loginWithGoogle(credential) {
  const { data } = await api.post('/auth/google', { credential });
  return data; // { token, user }
}
