import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/authApi';
import './Header.css';

export default function Header({ user, menus, activeTopKey, onTopMenuClick }) {
  const navigate = useNavigate();
  const dashboard = menus.find(m => m.key === 'dashboard');
  const restMenus = menus.filter(m => m.key !== 'dashboard');

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
      navigate('/login');
    }
  };

  const handleUserClick = () => {
    if (!user?.userId) {
      return;
    }
    navigate(`/users/${user.userId}`);
  };

  const handleMenuClick = menu => {
    onTopMenuClick(menu.key);
    if (menu.children && menu.children.length > 0) {
      navigate(menu.children[0].path);
      return;
    }
    if (menu.path) {
      navigate(menu.path);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        {dashboard && (
          <button
            className={activeTopKey === dashboard.key ? 'active' : ''}
            onClick={() => handleMenuClick(dashboard)}
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
            onClick={() => handleMenuClick(menu)}
          >
            {menu.label}
          </button>
        ))}

        <div className="header-user">
          {user && (
            <>
              <button type="button" className="user-info-btn" onClick={handleUserClick}>
                {user.name || '-'}
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
