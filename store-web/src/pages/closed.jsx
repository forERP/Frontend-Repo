import { useEffect, useState } from 'react'
import { loginPos } from '../api/authApi'
import { useNavigate } from "react-router-dom"
import './css/Login.css'

export default function Closed() {
    const [storeCode, setStoreCode] = useState('')
    const [employeeCode, setEmployeeCode] = useState('')
    const [activeField, setActiveField] = useState('store')
    const navigate = useNavigate();



    const handleNumberClick = (num) => {
        if (activeField === 'store') {
            setStoreCode(prev => prev + num)
        } else {
            setEmployeeCode(prev => prev + num)
        }
    }

    const handleDelete = () => {
        if (activeField === 'store') {
            setStoreCode(prev => prev.slice(0, -1))
        } else {
            setEmployeeCode(prev => prev.slice(0, -1))
        }
    }

    const handleLogin = async () => {
        if (storeCode.length >= 1 && employeeCode.length >= 1) {
          try{
            await loginPos(storeCode, employeeCode);

            alert("마감이 해제되었습니다.");
            navigate('/home');
        }catch(e){
            alert("정보가 일치하지 않습니다.");
        }
    }
}

    /* =========================
        이전화면가기
    ========================= */

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="login-container">
            {/* 좌측 입력 영역 */}
            <div className="login-left">
                <div className="input-row" onClick={() => setActiveField('store')}>
                    <span className="label">매장 코드</span>
                    <span className="value">{storeCode || '------'}</span>
                </div>

                <div className="input-row" onClick={() => setActiveField('admin')}>
                    <span className="label">관리자 코드</span>
                    <span className="value">{employeeCode || '----'}</span>
                </div>
            </div>

            {/* 우측 키패드 */}
            <div className="login-right">
                <div className="keypad">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                        <button
                            key={num}
                            className="key"
                            onClick={() => handleNumberClick(num)}
                        >
                            {num}
                        </button>
                    ))}

                    <button className="key delete" onClick={handleDelete}>
                        지움
                    </button>

                    <button className="key" onClick={() => handleNumberClick(0)}>
                        0
                    </button>

                    <button className="key enter" onClick={handleLogin}>
                        입력
                    </button>

                    <button
                        className="key back"
                        onClick={handleBack}
                    >
                        ← 돌아가기
                    </button>
                </div>
            </div>
        </div>
    )
}
