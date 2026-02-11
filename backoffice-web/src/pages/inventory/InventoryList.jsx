import { useParams } from 'react-router-dom';

export default function InventoryList() {
  const { storeId } = useParams();
  return (
    <div>
      <h1>지점 재고 목록</h1>
      <p>지점 ID: {storeId}</p>
    </div>
  );
}
