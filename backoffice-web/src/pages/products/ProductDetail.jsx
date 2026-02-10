import { useParams } from 'react-router-dom';

export default function ProductDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>상품 상세</h1>
      <p>상품 ID: {id}</p>
    </div>
  );
}
