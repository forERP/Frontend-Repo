import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";
import { login } from '../api/authApi'
import '../pages/css/Login.css'

export default function Login() {

    /* =========================
       상태 관리
    ========================= */

    const [adminCode, setAdminCode] = useState('')
    const [currentTime, setCurrentTime] = useState('')
    const navigate = useNavigate();


    /* =========================
       실시간 현재시간 표시
    ========================= */

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()

            const hh = String(now.getHours()).padStart(2, '0')
            const mm = String(now.getMinutes()).padStart(2, '0')
            const ss = String(now.getSeconds()).padStart(2, '0')

            setCurrentTime(`${hh}:${mm}:${ss}`)
        }

        updateTime()
        const timer = setInterval(updateTime, 1000)

        return () => clearInterval(timer)
    }, [])


    /* =========================
       키패드 입력
    ========================= */

    const handleNumberClick = (num) => {
        setAdminCode(prev => prev + num)
    }

    const handleDelete = () => {
        setAdminCode(prev => prev.slice(0, -1))
    }


    /* =========================
       로그인
    ========================= */

    const handleLogin = async () => {
        if (adminCode.length >= 4) {
            await login({
                password: adminCode,
            })
        }
    }

    /* 자동 로그인 트리거 */
    useEffect(() => {
        if (adminCode.length >= 4) {
            handleLogin()
        }
    }, [adminCode])


    /* =========================
        이전화면가기
    ========================= */

    const handleBack = () => {
        navigate(-1);
    };



    /* =========================
       UI
    ========================= */

    return (
        <div className="login-container">

            {/* 좌측 영역 */}
            <div className="login-left">

                {/* 현재 시간 */}
                <div className="input-row">
                    <span className="label">현재 시간</span>
                    <span className="value">{currentTime}</span>
                </div>

                {/* 관리자 코드 */}
                <div className="input-row">
                    <span className="label">관리자 코드</span>
                    <span className="value">{adminCode || '----'}</span>
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

                    <button
                        className="key"
                        onClick={() => handleNumberClick(0)}
                    >
                        0
                    </button>

                    <button
                        className="key enter"
                        onClick={handleLogin}
                    >
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
