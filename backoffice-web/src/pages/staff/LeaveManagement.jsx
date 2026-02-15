import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './LeaveManagement.css';

export default function LeaveManagement() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [leaveDate, setLeaveDate] = useState('');
    const [employee, setEmployee] = useState(null);

    useEffect(() => {
        fetchEmployee();
    }, []);

    const fetchEmployee = async () => {
        try {
            const res = await api.get(`/api/users/${userId}`);
            setEmployee(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/attendance/leave', {
                userId: Number(userId),
                leaveDate
            });
            alert('휴가 등록 완료');
            navigate(`/attendance/${userId}`);
        } catch (err) {
            console.error(err);
            alert('등록 실패');
        }
    };

    if (!employee) return <div style={{ textAlign: 'center', padding: '50px' }}>로딩중...</div>;

    return (
        <div className="leave-page">
            <div className="leave-container leave-card">
                <h1>휴가 등록</h1>

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
