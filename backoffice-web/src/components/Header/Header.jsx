import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/authApi';
import './Header.css';

export default function Header({ user, menus, activeTopKey, onTopMenuClick }) {
  const navigate = useNavigate();
  const dashboard = menus.find(m => m.key === 'dashboard');
  const restMenus = menus.filter(m => m.key !== 'dashboard');

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      logout();
      navigate('/login');
    }
  };

  const handleMenuClick = (menu) => {
    onTopMenuClick(menu.key);
    // 메뉴에 자식이 있으면 첫 번째 자식으로 이동
    if (menu.children && menu.children.length > 0) {
      const firstChild = menu.children[0];
      navigate(firstChild.path);
    } else if (menu.path) {
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
        
        {/* 사용자 정보 및 로그아웃 */}
        <div className="header-user">
          {user && (
            <>
              <span className="user-info">
                {user.role === 'HQ_ADMIN' && '본사 관리자'}
                {user.role === 'STORE_ADMIN' && '지점 관리자'}
                (ID: {user.userId})
              </span>
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
