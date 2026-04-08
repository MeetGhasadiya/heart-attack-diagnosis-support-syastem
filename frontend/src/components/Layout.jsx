import React, { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ActivitySquare, History, LayoutDashboard, LogOut, Menu, PanelLeftClose, ShieldPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import './Layout.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/predict', label: 'Start Prediction', icon: ActivitySquare },
  { to: '/history', label: 'History', icon: History },
]

const pageTitles = {
  '/': 'Dashboard',
  '/predict': 'Prediction Workspace',
  '/history': 'Prediction History',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const pageTitle = pageTitles[location.pathname] || 'Medical AI Workspace'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`layout-shell ${collapsed ? 'is-collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <motion.aside
        className="sidebar"
        initial={{ x: -18, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <ShieldPlus size={20} />
          </div>
          {!collapsed && (
            <div>
              <div className="brand-name">AI Heart Attack</div>
              <div className="brand-sub">Diagnosis Support</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-highlight" className="nav-highlight" />}
                    <Icon size={18} className="relative z-10" />
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || ''}</div>
              <div className="sidebar-user-copy">
                <div className="sidebar-user-name">{displayName}</div>
                <div className="sidebar-user-email">{user?.email || ''}</div>
              </div>
            </div>
          )}
          <button type="button" className="logout-chip" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        <button type="button" className="collapse-btn" onClick={() => setCollapsed((value) => !value)}>
          <PanelLeftClose size={16} />
        </button>
      </motion.aside>

      <div className="layout-main">
        <motion.header
          className="topbar"
          initial={{ y: -14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.28 }}
        >
          <div className="topbar-copy">
            <div className="topbar-kicker">Medical decision support</div>
            <div className="topbar-title">{pageTitle}</div>
          </div>

          <div className="topbar-actions">
            <button type="button" className="mobile-menu-btn" onClick={() => setMobileMenuOpen((value) => !value)}>
              <Menu size={18} />
            </button>
          </div>
        </motion.header>

        <motion.main
          className="main-content"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <Outlet />
        </motion.main>
      </div>

      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
