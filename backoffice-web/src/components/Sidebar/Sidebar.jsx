import './Sidebar.css';

export default function Sidebar({
  isOpen,
  menus,
  selectedTopMenu,
  selectedSubMenu,
  onSubClick,
  onToggle,
}) {
  const subMenus = menus[selectedTopMenu] || [];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-toggle" onClick={onToggle}>
        <div className={`bar ${isOpen ? 'open' : ''}`}></div>
        <div className={`bar ${isOpen ? 'open' : ''}`}></div>
        <div className={`bar ${isOpen ? 'open' : ''}`}></div>
      </div>

      {isOpen && (
        <ul className="sidebar-menu">
          {subMenus.map((sub) => (
            <li key={sub}>
              <button
                className={`sidebar-btn ${selectedSubMenu === sub ? 'active' : ''}`}
                onClick={() => onSubClick(sub)}
              >
                <span className="text">{sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>

  );
}
