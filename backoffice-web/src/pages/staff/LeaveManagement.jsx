import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { getSessionUser, isStoreAdminUser } from '../../utils/auth';
import './LeaveManagement.css';

export default function LeaveManagement() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const sessionUser = getSessionUser();
    const isStoreAdmin = isStoreAdminUser(sessionUser);
    const scopedStoreId = isStoreAdmin && sessionUser?.storeId ? Number(sessionUser.storeId) : null;
    const [leaveDate, setLeaveDate] = useState('');
    const [employee, setEmployee] = useState(null);
    const [error, setError] = useState('');

    const fetchEmployee = async () => {
        try {
            const res = await api.get(`/api/users/${userId}`);
            if (scopedStoreId != null && Number(res.data?.storeId) !== scopedStoreId) {
                setError('본인 매장 직원만 조회할 수 있습니다.');
                setEmployee(null);
                return;
            }
            setError('');
            setEmployee(res.data);
        } catch (err) {
            console.error(err);
            setError('직원 정보를 불러오지 못했습니다.');
        }
    };

    useEffect(() => {
        fetchEmployee();
    }, [scopedStoreId, userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!leaveDate) {
            alert('날짜를 선택하세요.');
            return;
        }

        try {
            if (scopedStoreId != null && Number(employee?.storeId) !== scopedStoreId) {
                alert('본인 매장 직원만 휴가를 등록할 수 있습니다.');
                return;
            }

            await api.post('/api/attendance/leave', {
                userId: Number(userId),
                leaveDate
            });

            alert('휴가 등록 완료');

            navigate(`/attendance/${userId}?month=${leaveDate.slice(0, 7)}`);

        } catch (err) {
            const message =
                err.response?.data?.message || '등록 실패';
            alert(message);
        }
    };


    if (!employee) return <div style={{ textAlign: 'center', padding: '50px' }}>{error || '로딩중...'}</div>;

    return (
        <div className="leave-page">
            <div className="leave-container leave-card">
                <h1>휴가 등록</h1>
                {error && <div className="error-message">{error}</div>}

                <div className="employee-card" style={{ marginBottom: '20px' }}>
                    <p><strong>직원 ID:</strong> {employee.id}</p>
                    <p><strong>이름:</strong> {employee.name}</p>
                </div>

                <form className="leave-form" onSubmit={handleSubmit}>
                    <label>휴가 날짜</label>
                    <input
                        type="date"
                        value={leaveDate}
                        onChange={(e) => setLeaveDate(e.target.value)}
                        required
                    />
                    <button type="submit">등록</button>
                </form>
            </div>
        </div>
    );
}
