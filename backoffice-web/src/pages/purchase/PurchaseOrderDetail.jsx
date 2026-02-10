import { useParams } from 'react-router-dom';

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>발주 상세</h1>
      <p>발주 ID: {id}</p>
    </div>
  );
}
