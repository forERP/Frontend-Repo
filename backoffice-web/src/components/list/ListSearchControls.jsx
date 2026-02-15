import './ListCommon.css';

export default function ListSearchControls({
  fields = [],
  onSearch,
  onReset,
  searchLabel = '검색',
  resetLabel = '초기화',
  formClassName = '',
  actionsClassName = '',
}) {
  const formClasses = ['list-search-form', formClassName].filter(Boolean).join(' ');
  const actionsClasses = ['list-search-actions', actionsClassName].filter(Boolean).join(' ');

  return (
    <form className={formClasses} onSubmit={onSearch}>
      {fields.map(field => (
        <div className={['list-search-field', field.className].filter(Boolean).join(' ')} key={field.name}>
          <label htmlFor={field.name}>{field.label}</label>
          {field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
            >
              {(field.options || []).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'date-range' ? (
            <div className="list-search-date-range">
              <input
                id={field.name}
                type="date"
                name={field.fromName}
                value={field.fromValue || ''}
                onChange={field.onChange}
                aria-label={`${field.label} 시작일`}
              />
              <span className="date-range-separator" aria-hidden="true">~</span>
              <input
                type="date"
                name={field.toName}
                value={field.toValue || ''}
                onChange={field.onChange}
                aria-label={`${field.label} 종료일`}
              />
            </div>
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.type || 'text'}
              value={field.value}
              onChange={field.onChange}
              placeholder={field.placeholder || ''}
            />
          )}
        </div>
      ))}

      <div className={actionsClasses}>
        <button type="submit" className="search-btn">
          {searchLabel}
        </button>
        <button type="button" className="reset-btn" onClick={onReset}>
          {resetLabel}
        </button>
      </div>
    </form>
  );
}
