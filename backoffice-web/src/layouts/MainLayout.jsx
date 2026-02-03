import React, { useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import { menus } from '../constants/menus';
import './MainLayout.css';

export default function MainLayout() {
  const [activeTopKey, setActiveTopKey] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
