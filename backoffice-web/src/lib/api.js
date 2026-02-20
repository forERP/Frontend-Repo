import axios from 'axios';

// 개발 환경: http://localhost:8081 직접 접근
// 프로덕션/Docker: 빈 문자열 (NginX 프록시를 통해 /api로 요청)
const baseURL = import.meta.env.DEV ? 'http://localhost:8081' : '';
const AUTH_SESSION_KEYS = ['accessToken', 'userRole', 'userId'];

function clearAuthSession() {
    AUTH_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
}

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const hasToken = Boolean(sessionStorage.getItem('accessToken'));

        if (hasToken && (status === 401 || status === 403)) {
            clearAuthSession();

            if (window.location.pathname !== '/login') {
                window.location.replace('/login');
            }
        }

        return Promise.reject(error);
    }
);


export default api;

