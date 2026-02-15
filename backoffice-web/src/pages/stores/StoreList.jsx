import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchStorePage } from '../../api/storeApi';
import { STORE_STATUS } from '../../constants/status';
import './StoreList.css';

const INITIAL_FILTERS = {
  name: '',
  code: '',
  status: '',
};

export default function StoreListPage() {
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadStores(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const loadStores = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchStorePage({
        page,
        size,
        name: search.name,
        code: search.code,
        status: search.status,
      });

      setStores(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError('매장 목록 조회에 실패했습니다.');
      console.error(err);
      setStores([]);
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

  return (
    <div className="store-page">
      <div className="store-container">
        <div className="page-header">
          <h1 className="page-title">매장 목록</h1>
          <button className="create-btn" onClick={() => navigate('/stores/create')}>
            매장 등록
          </button>
        </div>

        <div className="card filter-card">
          <ListSearchControls
            fields={[
              {
                name: 'name',
                label: '매장명',
                type: 'text',
                value: filters.name,
                onChange: handleFilterChange,
                placeholder: '매장명 검색',
              },
              {
                name: 'code',
                label: '매장코드',
                type: 'text',
                value: filters.code,
                onChange: handleFilterChange,
                placeholder: '매장코드 검색',
              },
              {
                name: 'status',
                label: '상태',
                type: 'select',
                value: filters.status,
                onChange: handleFilterChange,
                options: [
                  { value: '', label: '전체' },
                  ...Object.entries(STORE_STATUS).map(([key, value]) => ({ value: key, label: value.label })),
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
              <table className="erp-table list-table store-list-table">
                <thead>
                  <tr>
                    <th>매장명</th>
                    <th>매장코드</th>
                    <th>주소</th>
                    <th>전화번호</th>
                    <th>운영 상태</th>
                    <th className="actions-col">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-cell">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    stores.map(store => (
                      <tr
                        key={store.id}
                        className="clickable-row"
                        onClick={() => navigate(`/stores/${store.id}`)}
                      >
                        <td title={store.name}>{store.name}</td>
                        <td title={store.code || '-'}>{store.code || '-'}</td>
                        <td title={store.address || '-'}>{store.address || '-'}</td>
                        <td title={store.phone || '-'}>{store.phone || '-'}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: STORE_STATUS[store.status]?.color || '#6C757D',
                              color: '#fff',
                            }}
                          >
                            {STORE_STATUS[store.status]?.label || store.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button
                            className="edit-btn"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/stores/${store.id}?edit=1`);
                            }}
                          >
                            수정
                          </button>
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
