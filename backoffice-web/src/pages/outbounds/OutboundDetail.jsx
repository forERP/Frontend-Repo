import { useParams } from 'react-router-dom';

export default function OutboundDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>출고 상세</h1>
      <p>출고 ID: {id}</p>
    </div>
  );
}
