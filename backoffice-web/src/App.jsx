import { useState, useEffect } from 'react';
import './App.css';
import AppRouter from './router/AppRouter.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 초기화 시 localStorage에서 사용자 정보 로드
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

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

