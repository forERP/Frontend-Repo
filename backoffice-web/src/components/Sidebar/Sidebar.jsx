import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({ isOpen, menus, onToggle }) {
  const navigate = useNavigate();
  const [openKeys, setOpenKeys] = useState({});

  const buildDefaultOpenKeys = (menuList, acc = {}) => {
    menuList.forEach(menu => {
      if (menu.collapsible) acc[menu.key] = true;
      if (menu.children) buildDefaultOpenKeys(menu.children, acc);
    });
    return acc;
  };

  useEffect(() => {
    if (menus && menus.length > 0) {
      setOpenKeys(buildDefaultOpenKeys(menus));
    }
  }, [menus]);

  const toggle = (key) => {
    setOpenKeys(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderMenus = (menuList, depth = 0) => (
    <ul className="sidebar-menu">
      {menuList
        .filter(menu => !menu.hidden)
        .map(menu => {
          const opened = openKeys[menu.key];

          return (
            <li key={menu.key} className="sidebar-item">
              <div
                className={`sidebar-label depth-${depth}`}
                onClick={() => {
                  if (menu.collapsible) {
                    toggle(menu.key);
                  } else if (menu.path) {
                    navigate(menu.path);
                  }
                }}
              >
                {menu.label}
              </div>

              {menu.children && (!menu.collapsible || opened) &&
                renderMenus(menu.children, depth + 1)}
            </li>
          );
        })}
    </ul>
  );

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-toggle" onClick={onToggle}>
        <div className="bar" />
        <div className="bar" />
        <div className="bar" />
      </div>

      {isOpen && renderMenus(menus)}
    </aside>
  );
}
