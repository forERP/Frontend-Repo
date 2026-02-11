import { useParams } from 'react-router-dom';

export default function OrderDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>주문 상세</h1>
      <p>주문 ID: {id}</p>
    </div>
  );
}
