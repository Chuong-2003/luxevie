// import { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import api, { extractError } from '../services/api';

// const AuthCtx = createContext(null);

// export function AuthProvider({ children }) {
//   const [token, setToken] = useState(() => localStorage.getItem('token'));
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(!!token);
//   const [error, setError] = useState(null);

//   // fetch /auth/me nếu có token
//   useEffect(() => {
//     let mounted = true;
//     async function loadMe() {
//       if (!token) {
//         setUser(null);
//         setLoading(false);
//         return;
//       }
//       setLoading(true);
//       setError(null);
//       try {
//         const { data } = await api.get('/auth/me');
//         if (mounted) setUser(data.user);
//       } catch (e) {
//         const er = extractError(e);
//         if (mounted) {
//           setError(er);
//           // token có thể hết hạn → xoá
//           localStorage.removeItem('token');
//           setToken(null);
//           setUser(null);
//         }
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }
//     loadMe();
//     return () => { mounted = false; };
//   }, [token]);

//   const login = useCallback((newToken) => {
//     localStorage.setItem('token', newToken);
//     setToken(newToken);
//   }, []);

//   const logout = useCallback(() => {
//     localStorage.removeItem('token');
//     setToken(null);
//     setUser(null);
//   }, []);

//   return (
//     <AuthCtx.Provider value={{ user, token, loading, error, login, logout }}>
//       {children}
//     </AuthCtx.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthCtx);
// }
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { clearCart } from '../services/cart';

const Ctx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setUser(null); setLoading(false); return; } // ❗ không có token thì coi như chưa đăng nhập
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
      localStorage.removeItem('token'); // token hỏng/hết hạn thì bỏ đi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const login = async (token) => {
    localStorage.setItem('token', token);
    await fetchMe();
  };

  const logout = () => {
    localStorage.removeItem('token');
    clearCart(); // Xóa giỏ hàng khi đăng xuất
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout, refreshUser: fetchMe }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
