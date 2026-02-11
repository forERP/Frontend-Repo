import { useParams } from 'react-router-dom';

export default function PurchaseRequestDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>발주 요청 상세</h1>
      <p>발주 요청 ID: {id}</p>
    </div>
  );
}
