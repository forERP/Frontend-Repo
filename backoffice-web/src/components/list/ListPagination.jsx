import './ListCommon.css';

export default function ListPagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}) {
  const isEmpty = totalPages === 0;
  const canPrev = !isEmpty && currentPage > 0;
  const canNext = !isEmpty && currentPage < totalPages - 1;

  const handlePageSizeChange = e => {
    if (!onPageSizeChange) {
      return;
    }
    onPageSizeChange(Number(e.target.value));
  };

  return (
    <div className="pagination-wrapper">
      <div className="pagination-page-size">
        <label htmlFor="page-size-select">페이지 크기</label>
        <select
          id="page-size-select"
          value={pageSize}
          onChange={handlePageSizeChange}
          disabled={!onPageSizeChange}
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="pagination">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
          disabled={!canPrev}
          className="pagination-btn"
        >
          이전
        </button>
        <span className="page-info">{isEmpty ? '0 / 0' : `${currentPage + 1} / ${totalPages}`}</span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          className="pagination-btn"
        >
          다음
        </button>
      </div>

      <div className="pagination-spacer" aria-hidden="true" />
    </div>
  );
}