import { useState, useEffect } from 'react';
import './App.css';
import AppRouter from './router/AppRouter.jsx';
import api from './lib/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      const accessToken = sessionStorage.getItem('accessToken');
      const userId = sessionStorage.getItem('userId');
      const userRole = sessionStorage.getItem('userRole');
      const userName = sessionStorage.getItem('userName');

      if (!(accessToken && userId && userRole)) {
        setIsLoading(false);
        return;
      }

      let userStoreId = sessionStorage.getItem('userStoreId');
      let userStoreName = sessionStorage.getItem('userStoreName') || '';
      let userStoreCode = sessionStorage.getItem('userStoreCode') || '';

      if (!userStoreId) {
        try {
          const profileResponse = await api.get(`/api/users/${userId}`);
          const profile = profileResponse.data || {};

          if (profile.storeId) {
            userStoreId = String(profile.storeId);
            sessionStorage.setItem('userStoreId', userStoreId);
          }
          userStoreName = profile.storeName || '';
          userStoreCode = profile.storeCode || '';
          sessionStorage.setItem('userStoreName', userStoreName);
          sessionStorage.setItem('userStoreCode', userStoreCode);
        } catch (profileError) {
          console.warn('failed to hydrate user store profile:', profileError?.response?.status || profileError.message);
        }
      }

      setUser({
        userId: parseInt(userId, 10),
        role: userRole,
        name: userName || '',
        storeId: userStoreId ? parseInt(userStoreId, 10) : null,
        storeName: userStoreName,
        storeCode: userStoreCode,
      });

      setIsLoading(false);
    };

    hydrate();
  }, []);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return <AppRouter user={user} setUser={setUser} />;
}

