import api from '../lib/api';

export const fetchReturnPage = async ({
  storeId = '',
  status = '',
  from = '',
  to = '',
  page = 0,
  size = 10,
} = {}) => {
  const params = { page, size };

  if (storeId) {
    params.storeId = Number(storeId);
  }

  if (status) {
    params.status = status;
  }

  if (from) {
    params.from = from;
  }

  if (to) {
    params.to = to;
  }

  const response = await api.get('/api/returns', { params });
  return response.data;
};

