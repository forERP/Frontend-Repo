import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import { menus } from '../constants/menus';
import { getMenusByRole } from '../constants/menuAccess';
import './MainLayout.css';
import './AdminUi.css';

export default function MainLayout({ user }) {
  const location = useLocation();
  const [activeTopKey, setActiveTopKey] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const visibleMenus = useMemo(() => getMenusByRole(menus, user?.role), [user?.role]);

  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    const savedActiveTopKey = localStorage.getItem('activeTopKey');

    if (savedSidebarState !== null) {
      setIsSidebarOpen(JSON.parse(savedSidebarState));
    }

    if (savedActiveTopKey && visibleMenus.some(menu => menu.key === savedActiveTopKey)) {
      setActiveTopKey(savedActiveTopKey);
      return;
    }

    setActiveTopKey(visibleMenus[0]?.key || 'dashboard');
  }, [visibleMenus]);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('activeTopKey', activeTopKey);
  }, [activeTopKey]);

  useEffect(() => {
    if (!visibleMenus.some(menu => menu.key === activeTopKey)) {
      setActiveTopKey(visibleMenus[0]?.key || 'dashboard');
    }
  }, [activeTopKey, visibleMenus]);

  useEffect(() => {
    if (location.pathname === '/') {
      setActiveTopKey('dashboard');
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const activeTopMenu = useMemo(
    () => visibleMenus.find(menu => menu.key === activeTopKey),
    [activeTopKey, visibleMenus],
  );

  const isDashboardTop = activeTopKey === 'dashboard' || location.pathname === '/';
  const sidebarMenus = activeTopMenu?.children ?? [];

  const handleTopMenuClick = key => {
    setActiveTopKey(key);

    if (key === 'dashboard') {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="main-layout">
      <Header
        user={user}
        menus={visibleMenus}
        activeTopKey={activeTopKey}
        onTopMenuClick={handleTopMenuClick}
      />

      <div className="layout-body">
        {!isDashboardTop && (
          <Sidebar
            isOpen={isSidebarOpen}
            menus={sidebarMenus}
            onToggle={toggleSidebar}
          />
        )}

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

