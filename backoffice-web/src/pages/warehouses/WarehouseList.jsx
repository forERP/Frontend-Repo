import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchWarehousePage } from '../../api/warehouseApi';
import './WarehouseList.css';

const INITIAL_FILTERS = {
  keyword: '',
  status: '',
};

export default function WarehouseListPage() {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadWarehouses(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const loadWarehouses = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchWarehousePage({
        page,
        size,
        keyword: search.keyword,
        status: search.status,
      });

      setWarehouses(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError('창고 목록 조회에 실패했습니다.');
      console.error(err);
      setWarehouses([]);
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
    <div className="warehouse-page">
      <div className="warehouse-container">
        <div className="page-header">
          <h1 className="page-title">창고 목록</h1>
          <button className="create-btn" onClick={() => navigate('/warehouses/create')}>
            창고 등록
          </button>
        </div>

        <div className="card filter-card">
          <ListSearchControls
            fields={[
              {
                name: 'keyword',
                label: '창고',
                type: 'text',
                value: filters.keyword,
                onChange: handleFilterChange,
                placeholder: '창고명 또는 창고코드',
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
                  { value: 'INACTIVE', label: '비활성' },
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
              <table className="erp-table list-table warehouse-list-table">
                <thead>
                  <tr>
                    <th>창고코드</th>
                    <th>창고명</th>
                    <th>매장</th>
                    <th>상태</th>
                    <th className="actions-col">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-cell">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    warehouses.map(warehouse => (
                      <tr
                        key={warehouse.warehouseId}
                        className="clickable-row"
                        onClick={() => navigate(`/warehouses/${warehouse.warehouseId}`)}
                      >
                        <td title={warehouse.code}>{warehouse.code}</td>
                        <td title={warehouse.name}>{warehouse.name}</td>
                        <td title={warehouse.storeName || '-'}>{warehouse.storeName || '-'}</td>
                        <td>
                          <span className={`status-badge ${warehouse.active ? 'active' : 'inactive'}`}>
                            {warehouse.active ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button
                            className="edit-btn"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/warehouses/${warehouse.warehouseId}?edit=1`);
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
