import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";
import { clockIn, clockOut, getAttendanceStatus } from '../api/attendanceApi'
import '../pages/css/Login.css'

export default function Login() {

    /* =========================
       상태 관리
    ========================= */
    const [userName, setUserName] = useState('')
    const [attendanceStatus, setAttendanceStatus] = useState(null)
    const [employeeCode, setEmployeeCode] = useState('')
    const [currentTime, setCurrentTime] = useState('')
    const [storeCode, setStoreCode] = useState('')
    const navigate = useNavigate();

    const [clockInTime, setClockInTime] = useState(null)
    const [clockOutTime, setClockOutTime] = useState(null)

    /* =========================
       매장 코드(자동 입력)
    ========================= */
    useEffect(() => {
        const code = localStorage.getItem('storeCode');
        if(code){
            setStoreCode(code);
        }
    }, []);

    /* =========================
       실시간 현재시간 표시
    ========================= */

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            setCurrentTime(now.toLocaleTimeString('ko-KR'));
        }
        updateTime();
        const timer = setInterval(updateTime, 1000)
        return () => clearInterval(timer)
    }, [])

    /* =========================
       직원 상태 조회
    ========================= */

    useEffect(() => {
        if(employeeCode.length !==4){
            setUserName('');
            setAttendanceStatus(null);
            return;
        }

        const fetchStatus = async () => {
            try{
                const data = await getAttendanceStatus(storeCode, employeeCode);
                setUserName(data.userName);
                setAttendanceStatus(data.status);
                setClockInTime(data.attendance?.clockIn || null);
                setClockOutTime(data.attendance?.clockOut || null);
            }catch (e){
                console.error("직원 조회 실패:", e);
                alert("직원 코드를 확인해주세요.");
                setEmployeeCode('');
            }
        };

        fetchStatus();
    },[employeeCode, storeCode]);
    
    /* =========================
       키패드 입력
    ========================= */

    const handleNumberClick = (num) => {
        if(employeeCode.length < 4){
        setEmployeeCode(prev => prev + num)
        }
    };

    const clearAll = () => {
        setEmployeeCode('')
        setUserName('')
        setAttendanceStatus(null)
        setClockInTime(null);
        setClockOutTime(null);   
    }

    const handleDelete = () => {
        setEmployeeCode(prev => prev.slice(0, -1));   
    };

    const handleActionClick = async() => {
        if(!userName){
            alert("먼저 직원 코드 4자리를 입력해주세요.");
            return;
        }
        try{
            if(attendanceStatus === 'WORK'){
                const data = await clockOut(storeCode, employeeCode);
                const formattedTime = new Date(data.clockOut).toLocaleTimeString('ko-KR');
                alert(`퇴근 처리되었습니다.\n(처리 시각 : ${formattedTime})`);
                setClockOutTime(data.clockOut);
                setAttendanceStatus('OUT');
                clearAll();
            }else if(attendanceStatus === null) {
                const data = await clockIn(storeCode, employeeCode);
                const formattedTime = new Date(data.clockIn).toLocaleTimeString('ko-KR');
                alert(`출근 처리되었습니다.\n(처리 시각 : ${formattedTime})`);
                setClockInTime(data.clockIn);
                setAttendanceStatus(data.status);
                clearAll();
            }else{
                alert("이미 퇴근 처리되었습니다.");
                clearAll();
                return;
            }

        }catch (e) {
            console.error("처리 실패:", e);
            alert("처리 실패:" + (e.response?.data?.message || "직원 코드를 확인해주세요."));
            clearAll();
        }
    };

    /* =========================
        이전화면가기
    ========================= */

    const handleBack = () => {
        navigate(-1);
    };

    const isReady = employeeCode.length === 4 && userName;
    let buttonText = '입력';
    let buttonStyle = {};
    
    if (isReady){
        if (attendanceStatus === 'WORK'){
            buttonText = '퇴근';
            buttonStyle.background = '#e74c3c';
        } else {
            buttonText = '출근';
            buttonStyle.background = '#27ae60';
        }
    }
    if (attendanceStatus === 'OUT'){
        buttonText = '완료';
        buttonStyle.background = '#95a5a6'; 
    }

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

                {/* 직원 코드 */}
                <div className="input-row">
                    <span className="label">직원 코드</span>
                    <span className="value">{employeeCode ? '*'.repeat(employeeCode.length) :'----'}</span>
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
                        onClick={handleActionClick}
                        disabled={!isReady || attendanceStatus === 'OUT'} 
                        style={buttonStyle}
                        
                    >
                        {buttonText}
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