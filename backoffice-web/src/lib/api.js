import axios from 'axios';

// 개발 환경: http://localhost:8081 직접 접근
// 프로덕션/Docker: 빈 문자열 (NginX 프록시를 통해 /api로 요청)
const baseURL = import.meta.env.DEV ? 'http://localhost:8081' : '';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));


export default api;

