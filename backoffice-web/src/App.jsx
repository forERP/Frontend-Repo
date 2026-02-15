import { useState, useEffect } from 'react';
import './App.css';
import AppRouter from './router/AppRouter.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 초기화 시 세션 스토리지에서 사용자 정보 로드
  useEffect(() => {
    const accessToken = sessionStorage.getItem('accessToken');
    const userId = sessionStorage.getItem('userId');
    const userRole = sessionStorage.getItem('userRole');

    if (accessToken && userId && userRole) {
      setUser({
        userId: parseInt(userId),
        role: userRole,
      });
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <>
      <AppRouter user={user} setUser={setUser} />
    </>
  )
}

