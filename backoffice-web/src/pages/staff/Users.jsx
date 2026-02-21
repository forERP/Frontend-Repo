import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListPagination from '../../components/list/ListPagination';
import ListSearchControls from '../../components/list/ListSearchControls';
import { fetchUserPage } from '../../api/userApi';
import { USER_ROLE, USER_ROLE_OPTIONS, USER_STATUS, USER_STATUS_OPTIONS } from '../../constants/user';
import { getLockedStoreKeyword, getSessionUser, isStoreAdminUser } from '../../utils/auth';
import './Users.css';

const createInitialFilters = lockedStoreKeyword => ({
  storeKeyword: lockedStoreKeyword || '',
  name: '',
  status: '',
  role: '',
  createdFrom: '',
  createdTo: '',
});

export default function Users() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const isStoreAdmin = isStoreAdminUser(sessionUser);
  const lockedStoreKeyword = getLockedStoreKeyword(sessionUser);
  const initialFilters = useMemo(
    () => createInitialFilters(isStoreAdmin ? lockedStoreKeyword : ''),
    [isStoreAdmin, lockedStoreKeyword],
  );

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState(initialFilters);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadUsers(currentPage, query, pageSize);
  }, [currentPage, query, pageSize]);

  useEffect(() => {
    setFilters(initialFilters);
    setQuery(initialFilters);
    setCurrentPage(0);
  }, [initialFilters]);

  const loadUsers = async (page, search, size) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchUserPage({
        page,
        size,
        storeKeyword: search.storeKeyword,
        name: search.name,
        status: search.status,
        role: search.role,
        createdFrom: search.createdFrom,
        createdTo: search.createdTo,
      });

      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError('직원 목록 조회에 실패했습니다.');
      setUsers([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    if (isStoreAdmin && name === 'storeKeyword') {
      return;
    }
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = e => {
    e.preventDefault();
    setCurrentPage(0);
    setQuery(isStoreAdmin ? { ...filters, storeKeyword: lockedStoreKeyword } : { ...filters });
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setCurrentPage(0);
    setQuery(initialFilters);
  };

  const handlePageSizeChange = size => {
    setCurrentPage(0);
    setPageSize(size);
  };

  return (
    <div className="users-page">
      <div className="users-page-content">
        <div className="page-header">
          <h1 className="page-title">직원 목록</h1>
          <button className="create-btn" onClick={() => navigate('/users/new')}>
            직원 등록
          </button>
        </div>

        <div className="card filter-card">
          <ListSearchControls
            formClassName="user-list-search-form"
            fields={[
              {
                name: 'storeKeyword',
                label: '매장',
                type: 'text',
                value: filters.storeKeyword,
                onChange: handleFilterChange,
                placeholder: '매장명 또는 매장코드',
                disabled: isStoreAdmin,
              },
              {
                name: 'name',
                label: '직원명',
                type: 'text',
                value: filters.name,
                onChange: handleFilterChange,
                placeholder: '직원명 검색',
              },
              {
                name: 'status',
                label: '상태',
                type: 'select',
                value: filters.status,
                onChange: handleFilterChange,
                options: USER_STATUS_OPTIONS,
              },
              {
                name: 'role',
                label: '역할',
                type: 'select',
                value: filters.role,
                onChange: handleFilterChange,
                options: USER_ROLE_OPTIONS,
              },
              {
                name: 'createdRange',
                label: '등록일',
                type: 'date-range',
                fromName: 'createdFrom',
                toName: 'createdTo',
                fromValue: filters.createdFrom,
                toValue: filters.createdTo,
                onChange: handleFilterChange,
                className: 'date-range-field',
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

          <table className="erp-table list-table user-list-table">
            <thead>
              <tr>
                <th>직원코드</th>
                <th>직원명</th>
                <th>매장</th>
                <th>역할</th>
                <th>상태</th>
                <th>등록일</th>
                <th className="actions-col">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    로딩 중...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user.id}
                    className="clickable-row"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <td title={user.employeeCode || '-'}>{user.employeeCode || '-'}</td>
                    <td title={user.name}>{user.name}</td>
                    <td title={`${user.storeName || '-'}${user.storeCode ? ` (${user.storeCode})` : ''}`}>
                      {user.storeName || '-'}
                      {user.storeCode ? ` (${user.storeCode})` : ''}
                    </td>
                    <td>
                      <span
                        className="role-badge"
                        style={{
                          backgroundColor: `${USER_ROLE[user.role]?.color || '#6B7280'}22`,
                          color: USER_ROLE[user.role]?.color || '#374151',
                        }}
                        title={USER_ROLE[user.role]?.label || user.role || '-'}
                      >
                        {USER_ROLE[user.role]?.label || user.role || '-'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: USER_STATUS[user.status]?.color || '#6C757D', color: '#fff' }}
                      >
                        {USER_STATUS[user.status]?.label || user.status || '-'}
                      </span>
                    </td>
                    <td title={user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="edit-btn"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/users/${user.id}/edit`);
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
        </div>
      </div>
    </div>
  );
}
