import React from 'react';
import './Header.css';

export default function Header({ selectedTopMenu, onTopMenuClick, menus }) {
  const topMenus = Object.keys(menus).filter(menu => menu !== 'Dashboard'); // 오른쪽 메뉴

  return (
    <header className="header">
      <div className="header-left">
        <button
          className={selectedTopMenu === 'Dashboard' ? 'active' : ''}
          onClick={() => onTopMenuClick('Dashboard')}
        >
          Dashboard
        </button>
      </div>

      <div className="header-right">
        <div className="right-menu-wrapper">
          {topMenus.map((menu) => (
            <button
              key={menu}
              className={selectedTopMenu === menu ? 'active' : ''}
              onClick={() => onTopMenuClick(menu)}
            >
              {menu}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
