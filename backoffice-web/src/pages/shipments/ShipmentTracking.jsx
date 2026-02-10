import { useParams } from 'react-router-dom';

export default function ShipmentTracking() {
  const { id } = useParams();
  return (
    <div>
      <h1>송장 추적</h1>
      <p>배송 ID: {id}</p>
    </div>
  );
}
