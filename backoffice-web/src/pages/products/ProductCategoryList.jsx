import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchCategoryPage } from '../../api/categoryApi';
import './ProductCategoryList.css';

const INITIAL_FILTERS = {
  name: '',
  code: '',
};

export default function ProductCategoryList() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadCategories(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const loadCategories = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchCategoryPage({
        page,
        size,
        name: search.name,
        code: search.code,
      });

      setCategories(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError('카테고리 목록 조회에 실패했습니다.');
      setCategories([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = event => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = event => {
    event.preventDefault();
    setCurrentPage(0);
    setQuery({ ...filters });
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setQuery(INITIAL_FILTERS);
    setCurrentPage(0);
  };

  const handlePageSizeChange = size => {
    setCurrentPage(0);
    setPageSize(size);
  };

  return (
    <div className="product-page">
      <div className="product-container">
        <div className="page-header">
          <h1 className="page-title">카테고리 조회</h1>
          <button className="create-btn" onClick={() => navigate('/product-categories/new')}>
            카테고리 등록
          </button>
        </div>

        <div className="card filter-card">
          <ListSearchControls
            formClassName="category-list-search-form"
            fields={[
              {
                name: 'name',
                label: '카테고리명',
                type: 'text',
                value: filters.name,
                onChange: handleFilterChange,
                placeholder: '카테고리명 검색',
              },
              {
                name: 'code',
                label: '카테고리 코드',
                type: 'text',
                value: filters.code,
                onChange: handleFilterChange,
                placeholder: '카테고리 코드 검색',
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

          <table className="erp-table list-table category-list-table">
            <thead>
              <tr>
                <th>카테고리 코드</th>
                <th>카테고리명</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="empty-cell">
                    로딩 중...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                categories.map(category => (
                  <tr
                    key={category.id}
                    className="clickable-row"
                    onClick={() => navigate(`/product-categories/${category.id}`)}
                  >
                    <td title={category.code || '-'}>{category.code || '-'}</td>
                    <td title={category.name || '-'}>{category.name || '-'}</td>
                    <td title={category.description || '-'}>{category.description || '-'}</td>
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
        </div>
      </div>
    </div>
  );
}
