import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './AttendanceDetail.css';

export default function AttendanceDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [history, setHistory] = useState([]);
    const [month, setMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await api.get(`/api/users/${userId}`);
                setEmployee(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchEmployee();
    }, [userId]);

    useEffect(() => {
        if (!employee?.storeId) return;
        fetchHistory();
    }, [month, employee]);

    const fetchHistory = async () => {
        try {
            const [year, monthValue] = month.split('-');

            const lastDay = new Date(year, monthValue, 0).getDate();

            const startDate = `${year}-${monthValue}-01`;
            const endDate = `${year}-${monthValue}-${String(lastDay).padStart(2, '0')}`;

            console.log("startDate:", startDate);
            console.log("endDate:", endDate);

            const res = await api.get('/api/attendance/history', {
                params: {
                    storeId: employee.storeId,
                    startDate,
                    endDate
                }
            });

            const filtered = res.data.filter(
                item => String(item.userId) === String(userId)
            );

            setHistory(filtered);
        } catch (err) {
            console.error(err);
        }
    };


    const formatTime = (time) =>
        time ? new Date(time).toLocaleTimeString() : '-';

    const getStatusLabel = (status) => {
        switch (status) {
            case 'WORK': return '근무중';
            case 'OUT': return '퇴근';
            case 'LEAVE': return '휴가';
            case 'ABSENT': return '결근';
            default: return '-';
        }
    };

    if (!employee) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                로딩중...
            </div>
        );
    }

    return (
        <div className="detail-page">
            <div className="detail-container">
                <h1>근태 상세</h1>

                <div className="employee-card">
                    <p><strong>직원 ID:</strong> {employee.id}</p>
                    <p><strong>이름:</strong> {employee.name}</p>
                    <p><strong>소속 매장:</strong> {employee.storeName}</p>
                </div>

                <div className="month-selector">
                    <label>조회 월: </label>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>

                <div className="history-card">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>근무 날짜</th>
                                <th>출근</th>
                                <th>퇴근</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{
                                        textAlign: 'center',
                                        padding: '20px',
                                        color: '#888'
                                    }}>
                                        근태 기록이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                history.map(item => (
                                    <tr key={item.attendanceId}>
                                        <td>{item.workDate}</td>
                                        <td>{formatTime(item.clockIn)}</td>
                                        <td>{formatTime(item.clockOut)}</td>
                                        <td>
                                            <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <button
                    className="leave-btn"
                    onClick={() => navigate(`/attendance/${userId}/leave`)}
                >
                    휴가 등록
                </button>
            </div>
        </div>
    );
}