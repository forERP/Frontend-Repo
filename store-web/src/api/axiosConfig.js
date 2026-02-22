import axios from "axios";
import { clearSharedPosSession, getPosAccessToken, syncSessionStorageFromShared } from './posSessionStorage';

const POS_STORAGE_KEYS = [
    'accessToken',
    'role',
    'userRole',
    'userId',
    'storeId',
    'storeName',
    'storeCode',
    'userName',
    'employeeCode',
];

const POS_SESSION_UPDATED_EVENT = 'pos-session-updated';

function clearPosSessionStorage() {
    POS_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));
    clearSharedPosSession();
    window.dispatchEvent(new Event(POS_SESSION_UPDATED_EVENT));
}

function isAuthRequest(url = '') {
    return url.includes('/users/login');
}

const baseURL = import.meta.env.DEV ? 'http://localhost:8089/api' : '/api'

const api = axios.create({
    baseURL,
    headers:{
        'Content-Type':'application/json',
    },
});

api.interceptors.request.use(
    (config)=>{
        syncSessionStorageFromShared();
        const token = getPosAccessToken();
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error)=> Promise.reject(error)
   );

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const hasSessionToken = Boolean(sessionStorage.getItem('accessToken'));
        const hasToken = Boolean(getPosAccessToken());
        const requestUrl = String(error?.config?.url ?? '');
        const isMonitorPage = window.location.pathname === '/kitchen' || window.location.pathname === '/number';

        if (hasToken && (status === 401 || status === 403) && !isAuthRequest(requestUrl)) {
            clearPosSessionStorage();

            if (!isMonitorPage && hasSessionToken && window.location.pathname !== '/login') {
                window.location.replace('/login');
            }
        }

        return Promise.reject(error);
    }
);

   export default api;
