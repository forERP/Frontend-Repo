import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../pages/Menu/Menu.css";

/* ===============================
   메뉴 데이터 (가격 추가)
=============================== */
const menuData = {
    set: [
        { id: 1, name: "불고기 세트", price: 8500 },
        { id: 2, name: "치즈버거 세트", price: 9000 },
        { id: 3, name: "치킨 세트", price: 8800 },
        { id: 4, name: "더블버거 세트", price: 9500 },
    ],
    burger: [
        { id: 1, name: "불고기 버거", price: 4500 },
        { id: 2, name: "치즈 버거", price: 4800 },
        { id: 3, name: "치킨 버거", price: 5000 },
        { id: 4, name: "더블 버거", price: 5500 },
    ],
    side: [
        { id: 1, name: "감자튀김", price: 2500 },
        { id: 2, name: "치즈스틱", price: 3000 },
        { id: 3, name: "너겟", price: 3200 },
        { id: 4, name: "어니언링", price: 3000 },
    ],
    drink: [
        { id: 1, name: "콜라", price: 2000 },
        { id: 2, name: "사이다", price: 2000 },
        { id: 3, name: "아메리카노", price: 2500 },
        { id: 4, name: "오렌지주스", price: 2800 },
    ],
};

const MAX_MENU_COUNT = 16;
const ITEMS_PER_PAGE = 4;

function MenuPage() {
    const { category } = useParams();
    const navigate = useNavigate();

    const [selectedMenus, setSelectedMenus] = useState([]);
    const [page, setPage] = useState(0);

    useEffect(() => {
        setPage(0);
    }, [category]);

    const menus = menuData[category] || [];

    const filledMenus = [
        ...menus,
        ...Array(MAX_MENU_COUNT - menus.length).fill(null),
    ];

    /* ===============================
       메뉴 선택
    =============================== */
    const handleSelectMenu = (menu) => {
        setSelectedMenus((prev) => {
            const exist = prev.find(
                (item) =>
                    item.id === menu.id &&
                    item.category === category
            );

            if (exist) {
                return prev.map((item) =>
                    item.id === menu.id &&
                        item.category === category
                        ? { ...item, count: item.count + 1 }
                        : item
                );
            }

            return [
                ...prev,
                {
                    ...menu,
                    category,
                    count: 1,
                },
            ];
        });
    };

    const increaseCount = (id, category) => {
        setSelectedMenus((prev) =>
            prev.map((item) =>
                item.id === id && item.category === category
                    ? { ...item, count: item.count + 1 }
                    : item
            )
        );
    };

    const decreaseCount = (id, category) => {
        setSelectedMenus((prev) =>
            prev
                .map((item) =>
                    item.id === id && item.category === category
                        ? { ...item, count: item.count - 1 }
                        : item
                )
                .filter((item) => item.count > 0)
        );
    };

    /* ===============================
       페이지네이션
    =============================== */
    const startIndex = page * ITEMS_PER_PAGE;
    const visibleMenus = selectedMenus.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    /* ===============================
       총 금액 계산 (전체 기준)
    =============================== */
    const totalPrice = selectedMenus.reduce(
        (sum, item) => sum + item.price * item.count,
        0
    );

    return (
        <div className="menu-layout">
            <div className="menu-main">
                {/* 선택된 메뉴 표시 */}
                <div className="menu-display">
                    {visibleMenus.map((menu) => (
                        <div
                            key={`${menu.category}-${menu.id}`}
                            className="selected-menu"
                        >
                            <div>
                                <span className="menu-name">
                                    {menu.name}
                                </span>
                                <div style={{ fontSize: "16px", marginTop: "4px" }}>
                                    금액 : {menu.price * menu.count}원
                                </div>
                            </div>

                            <div className="menu-count">
                                <button
                                    onClick={() =>
                                        decreaseCount(menu.id, menu.category)
                                    }
                                >
                                    -
                                </button>
                                <span>{menu.count}</span>
                                <button
                                    onClick={() =>
                                        increaseCount(menu.id, menu.category)
                                    }
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* 총 금액 표시 */}
                    <div className="total-price">
                        총금액 : {totalPrice.toLocaleString()}원
                    </div>

                    {/* 페이지 이동 */}
                    {selectedMenus.length > ITEMS_PER_PAGE && (
                        <div className="page-controls">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(page - 1)}
                            >
                                ◀
                            </button>
                            <button
                                disabled={
                                    (page + 1) * ITEMS_PER_PAGE >=
                                    selectedMenus.length
                                }
                                onClick={() => setPage(page + 1)}
                            >
                                ▶
                            </button>
                        </div>
                    )}
                </div>

                {/* 카테고리 영역 */}
                <div className="menu-category">
                    <div className="category-buttons">
                        <button onClick={() => navigate("/menu/set")}>세트</button>
                        <button onClick={() => navigate("/menu/burger")}>햄버거</button>
                        <button onClick={() => navigate("/menu/side")}>사이드</button>
                        <button onClick={() => navigate("/menu/drink")}>음료</button>
                    </div>

                    <div className="menu-grid">
                        {filledMenus.map((menu, index) => (
                            <button
                                key={index}
                                className="menu-button"
                                disabled={!menu}
                                onClick={() =>
                                    menu && handleSelectMenu(menu)
                                }
                            >
                                {menu ? menu.name : ""}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="menu-footer">
                <button className="back-btn" onClick={() => navigate('/')}>
                    이전 화면
                </button>

                <button className="pay-btn">급식</button>
            </div>
        </div>
    );
}

export default MenuPage;
