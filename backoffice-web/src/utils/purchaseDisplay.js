export const formatDocNumber = (createdAt, id) => {
  if (!createdAt || id == null) return '-';

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return String(id);

  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(id).padStart(4, '0');

  return `${yy}${mm}${dd}-${seq}`;
};

export const formatNameAndCode = (name, code) => {
  const safeName = name?.trim();
  const safeCode = code?.trim();

  if (safeName && safeCode) return `${safeName}(${safeCode})`;
  if (safeName) return safeName;
  if (safeCode) return safeCode;
  return '-';
};
