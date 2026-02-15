import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import { menus } from '../constants/menus';
import './MainLayout.css';
import './AdminUi.css';

export default function MainLayout({ user }) {
  const location = useLocation();
  const [activeTopKey, setActiveTopKey] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 페이지 로드 시 localStorage에서 사이드바 상태 복원
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    const savedActiveTopKey = localStorage.getItem('activeTopKey');
    
    if (savedSidebarState !== null) {
      setIsSidebarOpen(JSON.parse(savedSidebarState));
    }
    if (savedActiveTopKey && menus.some(menu => menu.key === savedActiveTopKey)) {
      setActiveTopKey(savedActiveTopKey);
    } else {
      setActiveTopKey('dashboard');
    }
  }, []);

  // 사이드바 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // activeTopKey가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('activeTopKey', activeTopKey);
  }, [activeTopKey]);

  const activeTopMenu = useMemo(
    () => menus.find(menu => menu.key === activeTopKey),
    [activeTopKey]
  );

  const sidebarMenus = activeTopMenu?.children ?? [];

  const handleTopMenuClick = (key) => {
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
        menus={menus}
        activeTopKey={activeTopKey}
        onTopMenuClick={handleTopMenuClick}
      />

      <div className="layout-body">
        <Sidebar
          isOpen={isSidebarOpen}
          menus={sidebarMenus}
          onToggle={toggleSidebar}
        />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
