import './Number.css'
import { useEffect, useState } from 'react'

export default function number() {
    const [time, setTime] = useState('')

    const [done] = useState([1, 2, 3, 4, 5])      // 완료
    const [ready] = useState([11, 12, 13, 14])   // 준비중

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="status-wrapper">

            {/* ===== 헤더 ===== */}
            <header className="status-header">

                <div className="header-left">
                    <h2>주문하신</h2>
                    <h2 className="yellow">제품이 완료되었습니다</h2>
                </div>

                <div className="header-right">
                    <h2>제품을</h2>
                    <h2>준비하는 중입니다</h2>
                    <span className="time">{time}</span>
                </div>

            </header>


            {/* ===== 번호 영역 ===== */}
            <main className="status-main">

                {/* 완료 */}
                <section className="status-section left">
                    <div className="number-grid">
                        {done.map(n => (
                            <div key={n} className="number-box done">
                                번호 {n}
                            </div>
                        ))}
                    </div>
                </section>


                {/* 준비중 */}
                <section className="status-section right">
                    <div className="number-grid">
                        {ready.map(n => (
                            <div key={n} className="number-box ready">
                                번호 {n}
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    )
}
