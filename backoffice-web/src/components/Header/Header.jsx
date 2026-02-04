import React from 'react';
import './Header.css';

export default function Header({ menus, activeTopKey, onTopMenuClick }) {
  const dashboard = menus.find(m => m.key === 'dashboard');
  const restMenus = menus.filter(m => m.key !== 'dashboard');

  return (
    <header className="header">
      <div className="header-left">
        {dashboard && (
          <button
            className={activeTopKey === dashboard.key ? 'active' : ''}
            onClick={() => onTopMenuClick(dashboard.key)}
          >
            {dashboard.label}
          </button>
        )}
      </div>

      <div className="header-right">
        {restMenus.map(menu => (
          <button
            key={menu.key}
            className={activeTopKey === menu.key ? 'active' : ''}
            onClick={() => onTopMenuClick(menu.key)}
          >
            {menu.label}
          </button>
        ))}
      </div>
    </header>
  );
}
