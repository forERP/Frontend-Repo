import { useState } from "react";
import { useNavigate } from "react-router-dom"
import "../pages/css/recepit.css";

export default function ReceiptPage() {



    const navigate = useNavigate();
    navigate(-1);


    const receipts = [
        {
            id: 1,
            date: "2026-02-04",
            time: "10:21",
            amount: 14500,
            items: ["치즈버거 세트", "감튀", "콜라"],
        },
        {
            id: 2,
            date: "2026-02-04",
            time: "11:02",
            amount: 8800,
            items: ["치킨 세트"],
        },
        {
            id: 3,
            date: "2026-02-04",
            time: "11:40",
            amount: 5000,
            items: ["치킨 버거"],
        },
        {
            id: 4,
            date: "2026-02-04",
            time: "12:12",
            amount: 3000,
            items: ["치즈스틱"],
        },
        {
            id: 5,
            date: "2026-02-04",
            time: "13:33",
            amount: 2500,
            items: ["감자튀김"],
        },
        {
            id: 6,
            date: "2026-02-04",
            time: "14:05",
            amount: 9500,
            items: ["더블버거 세트"],
        },
    ];

    const [selected, setSelected] = useState(receipts[0]);

    return (
        <div className="receipt-layout">
            {/* ================= 왼쪽 ================= */}
            <div className="receipt-left">
                <div className="filter-bar">
                    <button>월 선택</button>
                    <button>일 선택</button>
                </div>

                <div className="receipt-grid">
                    {receipts.map((r) => (
                        <button
                            key={r.id}
                            className={`receipt-cell ${selected.id === r.id ? "active" : ""
                                }`}
                            onClick={() => setSelected(r)}
                        >
                            <div>{r.date}</div>
                            <div>{r.time}</div>
                            <div>{r.amount.toLocaleString()}원</div>
                        </button>
                    ))}
                </div>

                {/* ===== 페이징 (UI 전용) ===== */}
                <div className="pagination">
                    {"<< < 1 2 3 4 5 > >>"}
                </div>
            </div>

            {/* ================= 오른쪽 ================= */}
            <div className="receipt-right">
                <h2>영수증</h2>

                <div className="detail">
                    <p>날짜 : {selected.date}</p>
                    <p>시간 : {selected.time}</p>
                    <hr />

                    {selected.items.map((item, i) => (
                        <div key={i} className="item-row">
                            {item}
                        </div>
                    ))}

                    <hr />
                    <p className="total">
                        총 금액 : {selected.amount.toLocaleString()}원
                    </p>
                    
                    {/* 🔥 하단 고정 영역 */}
                    <div className="receipt-bottom">
                        <button className="print-btn">
                            🖨 인쇄
                        </button>

                        <button
                            className="back-btn"
                            onClick={() => navigate(-1)}
                        >
                            ← 돌아가기
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
