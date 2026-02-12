import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, discontinueProduct, reactivateProduct } from '../../api/productApi';
import './ProductList.css';

export default function ProductList() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadProducts();
    }, [currentPage]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchProducts(currentPage, 10);
            setProducts(data.content || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error('상품 목록 로드 실패:', err);
            setError('상품 목록을 불러올 수 없습니다.');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/products/${productId}`);
    };

    const handleDiscontinue = async (e, productId) => {
        e.stopPropagation();
        
        if (!window.confirm('이 상품을 단종 처리하시겠습니까?')) {
            return;
        }

        try {
            setLoading(true);
            await discontinueProduct(productId);
            await loadProducts();
        } catch (err) {
            console.error('상품 단종 처리 실패:', err);
            setError('상품 단종 처리에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleReactivate = async (e, productId) => {
        e.stopPropagation();
        
        if (!window.confirm('이 상품을 재등록(단종 취소)하시겠습니까?')) {
            return;
        }

        try {
            setLoading(true);
            await reactivateProduct(productId);
            await loadProducts();
        } catch (err) {
            console.error('상품 재등록 실패:', err);
            setError('상품 재등록에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <div className="product-page">
            <div className="product-container">
                <div className="page-header">
                    <h1 className="page-title">상품 목록</h1>
                    <button
                        className="create-btn"
                        onClick={() => navigate('/products/new')}
                    >
                        상품 등록
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="card">
                    {loading && <div className="loading">로드 중...</div>}

                    {!loading && products.length === 0 && (
                        <div className="empty-state">
                            <p>등록된 상품이 없습니다.</p>
                        </div>
                    )}

                    {!loading && products.length > 0 && (
                        <>
                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th>SKU</th>
                                        <th>상품명</th>
                                        <th>카테고리</th>
                                        <th>가격</th>
                                        <th>상태</th>
                                        <th>작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="product-row"
                                            onClick={() => handleProductClick(product.id)}
                                        >
                                            <td className="sku">{product.sku || '-'}</td>
                                            <td className="name">{product.name}</td>
                                            <td className="category">{product.categoryName || '-'}</td>
                                            <td className="price">
                                                {product.msrpPrice ? `${Number(product.msrpPrice).toLocaleString('ko-KR')}원` : '-'}
                                            </td>
                                            <td className="status">
                                                <span className={`status-badge ${product.status?.toLowerCase() || 'active'}`}>
                                                    {product.status === 'ACTIVE' ? '활성' : '단종'}
                                                </span>
                                            </td>
                                            <td className="actions">
                                                <button
                                                    className="edit-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/products/${product.id}`);
                                                    }}
                                                    disabled={product.status === 'DISCONTINUED'}
                                                >
                                                    편집
                                                </button>
                                                {product.status !== 'DISCONTINUED' && (
                                                    <button
                                                        className="discontinue-btn"
                                                        onClick={(e) => handleDiscontinue(e, product.id)}
                                                    >
                                                        단종
                                                    </button>
                                                )}
                                                {product.status === 'DISCONTINUED' && (
                                                    <button
                                                        className="reactivate-btn"
                                                        onClick={(e) => handleReactivate(e, product.id)}
                                                    >
                                                        재활성
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="pagination">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 0}
                                    className="pagination-btn"
                                >
                                    이전
                                </button>
                                <span className="page-info">
                                    {currentPage + 1} / {totalPages}
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage >= totalPages - 1}
                                    className="pagination-btn"
                                >
                                    다음
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
