import './Kitchen.css'
import { useState } from 'react'

export default function Kitchen() {
    const [page, setPage] = useState(1)

    const next = () => setPage(p => p + 1)
    const prev = () => setPage(p => Math.max(1, p - 1))

    return (
        <div className="kitchen-wrapper">

            {/* ✅ 헤더 (1) */}
            <header className="kitchen-header">
                <div>🍔 매장 이름</div>
                <div>👨‍🍳 매니저 홍길동</div>
                <div>{new Date().toLocaleTimeString()}</div>
            </header>


            {/* ✅ 주문 영역 1 (5) */}
            <section className="kitchen-orders">
                <OrderCard />
                <OrderCard />
                <OrderCard />
            </section>


            {/* ✅ 주문 영역 2 (5) */}
            <section className="kitchen-orders">
                <OrderCard />
                <OrderCard />
                <OrderCard />
            </section>


            {/* ✅ 페이징 버튼 (1) */}
            <footer className="kitchen-pagination">
                <button className="page-btn" onClick={prev}>◀</button>
                <span className="page-text">Page {page}</span>
                <button className="page-btn" onClick={next}>▶</button>
            </footer>

        </div>
    )
}


function OrderCard() {
    return (
        <div className="order-card">
            <h3>주문번호 00</h3>

            <div className="menu-list">
                <p>햄버거 세트 x2</p>
                <p>콜라 x1</p>
            </div>

            <button className="call-btn">호출</button>
        </div>
    )
}
