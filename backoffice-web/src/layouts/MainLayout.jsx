import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import './MainLayout.css';

export default function MainLayout() {
  const dummyMenus = {
    Dashboard: [],
    Stores: ['매장 등록', '정보 수정', '운영 상태', '운영 현황'],
    Products: ['상품 관리', '재고 관리', '발주 관리', '입고 관리'],
    Orders: ['주문 관리', '출고 관리', '배송 관리', '반품 관리'],
    Sales: ['매출 관리', '정산 관리'],
    Staff: ['매출 관리', '정산 관리'],
    Logs: ['관리자 행위 로그', '주요 데이터 변경 이력']
  };


  const [selectedTopMenu, setSelectedTopMenu] = useState('dashboard');
  const [selectedSubMenu, setSelectedSubMenu] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleTopMenuClick = (menu) => {
    setSelectedTopMenu(menu);

    if (menu === 'dashboard') {
      setIsSidebarOpen(false);
      setSelectedSubMenu(null);
    } else {
      setIsSidebarOpen(true);
      setSelectedSubMenu(dummyMenus[menu]?.[0] || null);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleSubMenuClick = (sub) => setSelectedSubMenu(sub);

  return (
    <div className="main-layout">
      <Header
        menus={dummyMenus}
        selectedTopMenu={selectedTopMenu}
        onTopMenuClick={handleTopMenuClick}
      />

      <div className="layout-body">
        <Sidebar
          isOpen={isSidebarOpen}
          menus={dummyMenus}
          selectedTopMenu={selectedTopMenu}
          selectedSubMenu={selectedSubMenu}
          onSubClick={handleSubMenuClick}
          onToggle={toggleSidebar}
        />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
