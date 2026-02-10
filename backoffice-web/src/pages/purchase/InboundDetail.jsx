import { useParams } from 'react-router-dom';

export default function InboundDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>입고 상세</h1>
      <p>입고 ID: {id}</p>
    </div>
  );
}
