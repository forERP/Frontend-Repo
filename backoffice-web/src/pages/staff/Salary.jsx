import { useMemo, useState } from 'react';
import api from '../../lib/api';
import './Salary.css';

const EMPLOYMENT_OPTIONS = [
    { value: 'HOURLY', label: '시급직' },
    { value: 'MONTHLY', label: '월급직' },
];

const getCurrentYearMonth = () => {
    const now = new Date();
    return {
        year: String(now.getFullYear()),
        month: String(now.getMonth() + 1).padStart(2, '0'),
    };
};

const formatNumber = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
    return new Intl.NumberFormat('ko-KR').format(Number(value));
};

export default function Salary() {
    const { year: currentYear, month: currentMonth } = useMemo(getCurrentYearMonth, []);

    const [registerForm, setRegisterForm] = useState({
        userId: '',
        employmentType: 'HOURLY',
        amount: '',
    });

    const [payrollForm, setPayrollForm] = useState({
        userId: '',
        year: currentYear,
        month: currentMonth,
    });

    const [payroll, setPayroll] = useState(null);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [payrollLoading, setPayrollLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleRegisterChange = (event) => {
        const { name, value } = event.target;
        setRegisterForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePayrollChange = (event) => {
        const { name, value } = event.target;
        setPayrollForm((prev) => ({ ...prev, [name]: value }));
    };

    const validateRegisterForm = () => {
        if (!registerForm.userId.trim()) return '직원 ID를 입력해주세요.';
        if (!registerForm.amount.trim()) return '급여 금액을 입력해주세요.';
        if (Number(registerForm.amount) <= 0) return '급여 금액은 0보다 커야 합니다.';
        return '';
    };

    const validatePayrollForm = () => {
        if (!payrollForm.userId.trim()) return '급여 조회를 위한 직원 ID를 입력해주세요.';
        if (!payrollForm.year.trim() || !payrollForm.month.trim()) return '연/월을 입력해주세요.';
        return '';
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const validationMessage = validateRegisterForm();
        if (validationMessage) {
            setErrorMessage(validationMessage);
            return;
        }

        try {
            setRegisterLoading(true);
            await api.post('/api/salary', {
                userId: Number(registerForm.userId),
                employmentType: registerForm.employmentType,
                amount: Number(registerForm.amount),
            });
            setSuccessMessage('급여 기준이 저장되었습니다.');
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || '급여 저장 중 오류가 발생했습니다.');
        } finally {
            setRegisterLoading(false);
        }
    };

    const handlePayrollSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const validationMessage = validatePayrollForm();
        if (validationMessage) {
            setErrorMessage(validationMessage);
            return;
        }

        try {
            setPayrollLoading(true);
            const response = await api.get('/api/salary/calculate', {
                params: {
                    userId: Number(payrollForm.userId),
                    year: Number(payrollForm.year),
                    month: Number(payrollForm.month),
                },
            });
            setPayroll(response.data);
            setSuccessMessage('급여 계산 결과를 불러왔습니다.');
        } catch (error) {
            setPayroll(null);
            setErrorMessage(error?.response?.data?.message || '급여 조회 중 오류가 발생했습니다.');
        } finally {
            setPayrollLoading(false);
        }
    };

    return (
        <div className="salary-page">
            <header className="salary-page__header">
                <h1>급여 관리</h1>
            </header>

            {(errorMessage || successMessage) && (
                <div className="salary-page__message-wrap">
                    {errorMessage && <p className="salary-page__message salary-page__message--error">{errorMessage}</p>}
                    {successMessage && <p className="salary-page__message salary-page__message--success">{successMessage}</p>}
                </div>
            )}

            <section className="salary-card-grid">
                <article className="salary-card">
                    <h2>급여 기준 등록/수정</h2>
                    <form className="salary-form" onSubmit={handleRegisterSubmit}>
                        <label>
                            직원 ID
                            <input
                                name="userId"
                                type="number"
                                min="1"
                                placeholder="예: 101"
                                value={registerForm.userId}
                                onChange={handleRegisterChange}
                            />
                        </label>

                        <label>
                            고용 형태
                            <select name="employmentType" value={registerForm.employmentType} onChange={handleRegisterChange}>
                                {EMPLOYMENT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            {registerForm.employmentType === 'HOURLY' ? '시급(원)' : '월급(원)'}
                            <input
                                name="amount"
                                type="number"
                                min="0"
                                step="1"
                                placeholder="예: 12000"
                                value={registerForm.amount}
                                onChange={handleRegisterChange}
                            />
                        </label>

                        <button type="submit" disabled={registerLoading}>
                            {registerLoading ? '저장 중...' : '급여 기준 저장'}
                        </button>
                    </form>
                </article>

                <article className="salary-card">
                    <h2>월 급여 조회</h2>
                    <form className="salary-form" onSubmit={handlePayrollSubmit}>
                        <label>
                            직원 ID
                            <input
                                name="userId"
                                type="number"
                                min="1"
                                placeholder="예: 101"
                                value={payrollForm.userId}
                                onChange={handlePayrollChange}
                            />
                        </label>

                        <div className="salary-form__row">
                            <label>
                                연도
                                <input
                                    name="year"
                                    type="number"
                                    placeholder="2026"
                                    value={payrollForm.year}
                                    onChange={handlePayrollChange}
                                />
                            </label>

                            <label>
                                월
                                <input
                                    name="month"
                                    type="number"
                                    min="1"
                                    max="12"
                                    placeholder="03"
                                    value={payrollForm.month}
                                    onChange={handlePayrollChange}
                                />
                            </label>
                        </div>

                        <button type="submit" disabled={payrollLoading}>
                            {payrollLoading ? '조회 중...' : '급여 조회'}
                        </button>
                    </form>
                </article>
            </section>

            <section className="salary-result-card">
                <h2>급여 계산 결과</h2>

                {!payroll && <p className="salary-result-card__empty">조회 결과가 없습니다.</p>}

                {payroll && (
                    <dl className="salary-result-list">
                        <div>
                            <dt>직원명</dt>
                            <dd>{payroll.userName}</dd>
                        </div>
                        <div>
                            <dt>고용 형태</dt>
                            <dd>{payroll.type === 'HOURLY' ? '시급직' : '월급직'}</dd>
                        </div>
                        <div>
                            <dt>기준 급여</dt>
                            <dd>{formatNumber(payroll.baseWage)}원</dd>
                        </div>
                        <div>
                            <dt>기본 근무 시간</dt>
                            <dd>{formatNumber(payroll.normalWorkHours)}시간</dd>
                        </div>
                        <div>
                            <dt>연장 근무 시간</dt>
                            <dd>{formatNumber(payroll.overtimeHours)}시간</dd>
                        </div>
                        <div>
                            <dt>기본 급여</dt>
                            <dd>{formatNumber(payroll.normalPay)}원</dd>
                        </div>
                        <div>
                            <dt>연장 수당</dt>
                            <dd>{formatNumber(payroll.overtimePay)}원</dd>
                        </div>
                        <div className="salary-result-list__total">
                            <dt>총 급여</dt>
                            <dd>{formatNumber(payroll.totalPay)}원</dd>
                        </div>
                    </dl>
                )}
            </section>
        </div>
    );
}
