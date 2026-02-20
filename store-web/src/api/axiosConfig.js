import axios from "axios";

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
    window.dispatchEvent(new Event(POS_SESSION_UPDATED_EVENT));
}

function isAuthRequest(url = '') {
    return url.includes('/users/login');
}

const api = axios.create({
    baseURL:'http://localhost:8081/api',
    headers:{
        'Content-Type':'application/json',
    },
});

api.interceptors.request.use(
    (config)=>{
        const token = sessionStorage.getItem('accessToken');
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
        const hasToken = Boolean(sessionStorage.getItem('accessToken'));
        const requestUrl = String(error?.config?.url ?? '');

        if (hasToken && (status === 401 || status === 403) && !isAuthRequest(requestUrl)) {
            clearPosSessionStorage();

            if (window.location.pathname !== '/login') {
                window.location.replace('/login');
            }
        }

        return Promise.reject(error);
    }
);

   export default api;
