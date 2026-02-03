import axios from 'axios';

export const fetchMenus = async () => {
  const { data } = await axios.get('/api/menu');
  return data;
};
