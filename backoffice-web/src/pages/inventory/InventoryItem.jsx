import { useParams } from 'react-router-dom';

export default function InventoryItem() {
  const { storeId, productId } = useParams();
  return (
    <div>
      <h1>재고 상세</h1>
      <p>지점 ID: {storeId}, 상품 ID: {productId}</p>
    </div>
  );
}
