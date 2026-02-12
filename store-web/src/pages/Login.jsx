import { useState } from 'react'
import { loginPos, getUserInfo } from '../api/authApi'
import './css/Login.css'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate();

  const [storeCode, setStoreCode] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [activeField, setActiveField] = useState('store')
  const [errorMsg, setErrorMsg] = useState('');

  

  const handleNumberClick = (num) => {
    setErrorMsg('');
    if (activeField === 'store') {
      if(storeCode.length <3){
      setStoreCode(prev => prev + num)
      }
    } else {
      if(employeeCode.length <4){
      setEmployeeCode(prev => prev + num)
    }
  }
}

  const handleDelete = () => {
    setErrorMsg('');
    if (activeField === 'store') {
      setStoreCode(prev => prev.slice(0, -1))
    } else {
      setEmployeeCode(prev => prev.slice(0, -1))
    }
  }

  // 백엔드 연동
  const handleLogin = async () => {
    if (!storeCode || !employeeCode){
      setErrorMsg("코드를 모두 입력해주세요.");
    return;
  }

  try{
    // POS 로그인 API 호출
    const loginData = await loginPos(storeCode, employeeCode);

    localStorage.setItem('accessToken', loginData.token);
    localStorage.setItem('role', loginData.role);
    localStorage.setItem('userId', loginData.userId);
    localStorage.setItem('storeCode', storeCode);

    const userData = await getUserInfo(loginData.userId);

    // 권한 체크
    if(!userData.storeId && loginData.role !== 'HQ_ADMIN'){
      throw new Error("매장 정보가 없는 계정입니다.");
    }

    localStorage.setItem('storeId', userData.storeId || '0');
    localStorage.setItem('userName', userData.name);

    console.log(`로그인 성공: ${userData.name}`);

    navigate('/home');

  }catch(err){
    console.error(err);
    localStorage.clear();
    setErrorMsg("로그인 실패: 코드를 확인해주세요.");
  }
};

  return (
    <div className="login-container">
      {/* 좌측 입력 영역 */}
      <div className="login-left">
        <div className="input-row" onClick={() => setActiveField('store')}>
          <span className="label">매장 코드</span>
          <span className="value">{storeCode ? '*'.repeat(storeCode.length):'---'}</span>
        </div>

        <div className="input-row" onClick={() => setActiveField('employee')}>
          <span className="label">관리자 코드</span>
          <span className="value">{employeeCode ? '*'.repeat(employeeCode.length):'----'}</span>
        </div>

      {/*에러 메시지 표시 */}
      {errorMsg && <div style={{color: 'red', marginTop:'10px'}}>{errorMsg}</div>}
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
        </div>
      </div>
    </div>
  )
}
