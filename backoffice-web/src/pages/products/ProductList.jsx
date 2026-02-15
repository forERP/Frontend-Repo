import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchProducts, discontinueProduct, reactivateProduct } from '../../api/productApi';
import './ProductList.css';

const INITIAL_FILTERS = {
  name: '',
  sku: '',
  status: '',
};

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadProducts(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const loadProducts = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchProducts(page, size, search);
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('상품 목록 로드 실패:', err);
      setError('상품 목록을 불러올 수 없습니다.');
      setProducts([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = e => {
    e.preventDefault();
    setCurrentPage(0);
    setQuery({ ...filters });
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(0);
    setQuery(INITIAL_FILTERS);
  };

  const handlePageSizeChange = nextSize => {
    setCurrentPage(0);
    setPageSize(nextSize);
  };

  const handleProductClick = productId => {
    navigate(`/products/${productId}`);
  };

  const handleDiscontinue = async (e, productId) => {
    e.stopPropagation();

    if (!window.confirm('이 상품을 판매 중지 처리하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await discontinueProduct(productId);
      await loadProducts(currentPage, query, pageSize);
    } catch (err) {
      console.error('상품 판매 중지 처리 실패:', err);
      setError('상품 판매 중지 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (e, productId) => {
    e.stopPropagation();

    if (!window.confirm('이 상품의 판매 중지를 해제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await reactivateProduct(productId);
      await loadProducts(currentPage, query, pageSize);
    } catch (err) {
      console.error('상품 재판매 처리 실패:', err);
      setError('상품 재판매 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-page">
      <div className="product-container">
        <div className="page-header">
          <h1 className="page-title">상품 목록</h1>
          <button className="create-btn" onClick={() => navigate('/products/new')}>
            상품 등록
          </button>
        </div>

        <div className="card filter-card">
          <ListSearchControls
            fields={[
              {
                name: 'name',
                label: '상품명',
                type: 'text',
                value: filters.name,
                onChange: handleFilterChange,
                placeholder: '상품명 검색',
              },
              {
                name: 'sku',
                label: 'SKU',
                type: 'text',
                value: filters.sku,
                onChange: handleFilterChange,
                placeholder: 'SKU 검색',
              },
              {
                name: 'status',
                label: '상태',
                type: 'select',
                value: filters.status,
                onChange: handleFilterChange,
                options: [
                  { value: '', label: '전체' },
                  { value: 'ACTIVE', label: '활성' },
                  { value: 'DISCONTINUED', label: '판매 중지' },
                ],
              },
            ]}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="card list-card">
          <div className="table-toolbar">
            <span className="total-count">총 {totalElements.toLocaleString('ko-KR')}건</span>
          </div>

          {loading && <div className="loading">로딩 중...</div>}

          {!loading && (
            <>
              <table className="erp-table list-table product-list-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>상품명</th>
                    <th>카테고리</th>
                    <th>가격</th>
                    <th>상태</th>
                    <th className="actions-col">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-cell">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    products.map(product => (
                      <tr
                        key={product.id}
                        className="clickable-row"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <td title={product.sku || '-'}>{product.sku || '-'}</td>
                        <td title={product.name}>{product.name}</td>
                        <td title={product.categoryName || '-'}>{product.categoryName || '-'}</td>
                        <td title={product.msrpPrice ? `${Number(product.msrpPrice).toLocaleString('ko-KR')}원` : '-'}>
                          {product.msrpPrice ? `${Number(product.msrpPrice).toLocaleString('ko-KR')}원` : '-'}
                        </td>
                        <td>
                          <span className={`status-badge ${product.status?.toLowerCase() || 'active'}`}>
                            {product.status === 'ACTIVE' ? '활성' : '판매 중지'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button
                            className="edit-btn"
                            onClick={e => {
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
                              onClick={e => handleDiscontinue(e, product.id)}
                            >
                              판매 중지
                            </button>
                          )}
                          {product.status === 'DISCONTINUED' && (
                            <button
                              className="reactivate-btn"
                              onClick={e => handleReactivate(e, product.id)}
                            >
                              재판매
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <ListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
