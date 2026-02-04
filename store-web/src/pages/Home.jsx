import { useNavigate } from 'react-router-dom';
import './css/MenuButtons.css'


export default function MenuButtons() {
  const navigate = useNavigate();

  return (
    <div className="menu-container">
      {/* 상단 4개 버튼 */}
      <div className="menu-top">
        <button className="menu-btn" onClick={() => navigate("/menu/set")}>
          🍔🍟🥤 <span>햄버거 세트</span>
        </button>

        <button className="menu-btn" onClick={() => navigate("/menu/burger")}>
          🍔 <span>햄버거</span>
        </button>

        <button className="menu-btn" onClick={() => navigate("/menu/side")}>
          🍟 <span>사이드</span>
        </button>

        <button className="menu-btn" onClick={() => navigate("/menu/drink")}>
          🥤 <span>음료</span>
        </button>
      </div>
      {/* 하단 2개 버튼 */}
      <div className="menu-bottom">
        <button className="menu-btn admin" onClick={() => navigate("/manager")}>⚙️<span>관리자</span></button>
        <button className="menu-btn close" onClick={() => navigate("/closed")}>🔒<span>마감</span></button>
      </div>
    </div>

  )
}
