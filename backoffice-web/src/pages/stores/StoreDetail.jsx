import { useParams } from 'react-router-dom';

export default function StoreDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>매장 상세</h1>
      <p>매장 ID: {id}</p>
    </div>
  );
}
