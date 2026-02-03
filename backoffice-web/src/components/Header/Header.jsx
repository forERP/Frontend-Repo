import React from 'react';
import './Header.css';

export default function Header({ selectedTopMenu, onTopMenuClick, menus }) {
  const topMenus = Object.keys(menus).filter(menu => menu !== 'Dashboard');

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
        <nav>
          {topMenus.map((menu) => (
            <button
              key={menu}
              className={selectedTopMenu === menu ? 'active' : ''}
              onClick={() => onTopMenuClick(menu)}
            >
              {menu}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
