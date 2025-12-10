// src/pages/admin/CoreAdminLayout.jsx
import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  CContainer, CHeader, CHeaderBrand, CHeaderNav, CHeaderToggler,
  CNavItem, CNavLink, CAvatar,
  CSidebar, CSidebarBrand, CSidebarHeader, CSidebarNav, CSidebarToggler,
  CNavGroup, CNavTitle,
  CFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu, cilSpeedometer, cilBasket, cilPeople, cilLayers } from '@coreui/icons'
import nav from './_nav'
import '../../admin.css'

export default function CoreAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const loc = useLocation()

  return (
    <div className="cui min-h-screen bg-light">
      {/* Header */}
      <CHeader position="sticky" className="mb-4">
        <CHeaderToggler onClick={() => setSidebarOpen(v => !v)} className="ps-1">
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderBrand className="mx-3">
          <Link to="/admin" className="text-decoration-none fw-bold">Admin</Link>
        </CHeaderBrand>
        <CHeaderNav className="ms-auto me-3">
          <CNavItem>
            <CNavLink as={Link} to="/" role="button">Về trang bán hàng</CNavLink>
          </CNavItem>
          <CNavItem>
            <CAvatar size="md" color="secondary" textColor="white">AD</CAvatar>
          </CNavItem>
        </CHeaderNav>
      </CHeader>

      {/* Sidebar */}
      <CSidebar position="fixed" visible={sidebarOpen} onVisibleChange={setSidebarOpen}>
        <CSidebarHeader>
          <CSidebarBrand>
            <img
              src="https://res.cloudinary.com/dqawqvxcr/image/upload/v1761117182/LuxeVie_2_zvsptx.png"
              alt="LuxeVie Logo"
              className="h-8 w-auto object-contain"
              style={{ maxWidth: '120px' }}
            />
            <span className="fw-bold ms-2 text-xs text-muted">Admin</span>
          </CSidebarBrand>
          <CSidebarToggler onClick={() => setSidebarOpen(v => !v)} />
        </CSidebarHeader>
        <CSidebarNav>
          <CNavTitle>Quản trị</CNavTitle>

          {/* Dashboard */}
          <CNavLink as={Link} to="/admin" active={loc.pathname === '/admin'}>
            <CIcon customClassName="nav-icon" icon={cilSpeedometer} />
            Tổng quan
          </CNavLink>

          {/* Products */}
          <CNavGroup toggler={<><CIcon className="nav-icon" icon={cilLayers} />Sản phẩm</>}>
            <CNavLink as={Link} to="/admin/products" active={loc.pathname.startsWith('/admin/products')}>
              Danh sách
            </CNavLink>
            <CNavLink as={Link} to="/admin/products/new" active={loc.pathname === '/admin/products/new'}>
              Thêm mới
            </CNavLink>
          </CNavGroup>

          {/* Orders */}
          <CNavLink as={Link} to="/admin/orders" active={loc.pathname.startsWith('/admin/orders')}>
            <CIcon customClassName="nav-icon" icon={cilBasket} />
            Đơn hàng
          </CNavLink>

          {/* Users */}
          <CNavLink as={Link} to="/admin/users" active={loc.pathname.startsWith('/admin/users')}>
            <CIcon customClassName="nav-icon" icon={cilPeople} />
            Người dùng
          </CNavLink>
        </CSidebarNav>
      </CSidebar>

      {/* Nội dung */}
      <div className="wrapper d-flex flex-column min-vh-100">
        <div className="body flex-grow-1 px-3">
          <CContainer fluid>
            <Outlet />
          </CContainer>
        </div>
        <CFooter className="px-4">
          <div><b>YAME Admin</b> © {new Date().getFullYear()}</div>
          <div className="ms-auto">Build with CoreUI</div>
        </CFooter>
      </div>
    </div>
  )
}
