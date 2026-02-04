import { useNavigate } from 'react-router-dom';
import './MenuButtons.css'; // 파일명도 manager 권장

export default function ManagerMenu() {
    const navigate = useNavigate();

    return (
        <div className="manager-menu-container">
            <button
                className="manager-menu-btn"
                onClick={() => navigate('/receipt')}
            >
                🧾
                <span>영수증</span>
            </button>

            <button
                className="manager-menu-btn"
                onClick={() => navigate('/work')}
            >
                ⏰
                <span>출근/퇴근/휴식</span>
            </button>

            <button
                className="manager-menu-btn"
                onClick={() => navigate('/change')}
            >
                👤
                <span>매니저 변경</span>
            </button>

            <button
                className="manager-menu-btn"
                onClick={() => navigate('/meal')}
            >
                🍱
                <span>급식</span>
            </button>

            <button
                className="manager-menu-btn manager-danger"
                onClick={() => navigate('/dispose')}
            >
                🗑️
                <span>폐기</span>
            </button>

            <button
                className="manager-menu-btn manager-back"
                onClick={() => navigate('/')}
            >
                ↩️
                <span>돌아가기</span>
            </button>
        </div>
    );
}
