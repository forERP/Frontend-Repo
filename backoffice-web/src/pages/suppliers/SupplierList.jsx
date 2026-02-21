import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchSupplierPage } from '../../api/supplierApi';
import { SUPPLIER_STATUS } from '../../constants/status';
import { getSessionUser, isStoreAdminUser } from '../../utils/auth';
import './SupplierList.css';

const INITIAL_FILTERS = {
  name: '',
  contactName: '',
  status: '',
};

export default function SupplierListPage() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_FILTERS);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadSuppliers(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  const loadSuppliers = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchSupplierPage({
        page,
        size,
        name: search.name,
        contactName: search.contactName,
        status: search.status,
      });

      setSuppliers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError('거래처 목록 조회에 실패했습니다.');
      console.error(err);
      setSuppliers([]);
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
    <div className="supplier-page">
      <div className="supplier-container">
        <div className="page-header">
          <h1 className="page-title">거래처 목록</h1>
          {!isStoreAdmin && (
            <button className="create-btn" onClick={() => navigate('/suppliers/new')}>
              거래처 등록
            </button>
          )}
        </div>

        <div className="card filter-card">
          <ListSearchControls
            fields={[
              {
                name: 'name',
                label: '거래처명',
                type: 'text',
                value: filters.name,
                onChange: handleFilterChange,
                placeholder: '거래처명 검색',
              },
              {
                name: 'contactName',
                label: '담당자명',
                type: 'text',
                value: filters.contactName,
                onChange: handleFilterChange,
                placeholder: '담당자명 검색',
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
              <table className="erp-table list-table supplier-list-table">
                <thead>
                  <tr>
                    <th>거래처명</th>
                    <th>담당자명</th>
                    <th>연락처</th>
                    <th>이메일</th>
                    <th>상태</th>
                    {!isStoreAdmin && <th className="actions-col">작업</th>}
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={isStoreAdmin ? 5 : 6} className="empty-cell">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map(supplier => (
                      <tr
                        key={supplier.supplierId}
                        className="clickable-row"
                        onClick={() => navigate(`/suppliers/${supplier.supplierId}`)}
                      >
                        <td title={supplier.name}>{supplier.name}</td>
                        <td title={supplier.contactName || '-'}>{supplier.contactName || '-'}</td>
                        <td title={supplier.contactPhone || '-'}>{supplier.contactPhone || '-'}</td>
                        <td title={supplier.contactEmail || '-'}>{supplier.contactEmail || '-'}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: SUPPLIER_STATUS[supplier.active ? 'ACTIVE' : 'INACTIVE']?.color || '#6C757D',
                              color: '#fff',
                            }}
                          >
                            {SUPPLIER_STATUS[supplier.active ? 'ACTIVE' : 'INACTIVE']?.label || '-'}
                          </span>
                        </td>
                        {!isStoreAdmin && (
                          <td className="actions-cell">
                            <button
                              className="edit-btn"
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/suppliers/${supplier.supplierId}?edit=1`);
                              }}
                            >
                              수정
                            </button>
                          </td>
                        )}
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

