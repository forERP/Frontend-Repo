const toNumberOrNull = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const getSessionUser = () => {
  const userId = toNumberOrNull(sessionStorage.getItem('userId'));
  const role = sessionStorage.getItem('userRole') || '';
  const name = sessionStorage.getItem('userName') || '';
  const storeId = toNumberOrNull(sessionStorage.getItem('userStoreId'));
  const storeName = sessionStorage.getItem('userStoreName') || '';
  const storeCode = sessionStorage.getItem('userStoreCode') || '';

  if (!userId || !role) {
    return null;
  }

  return {
    userId,
    role,
    name,
    storeId,
    storeName,
    storeCode,
  };
};

export const isStoreAdminRole = role => role === 'STORE_ADMIN';

export const isStoreAdminUser = user => isStoreAdminRole(user?.role);

export const getLockedStoreKeyword = user => {
  if (!user) {
    return '';
  }
  return user.storeCode || user.storeName || '';
};
