import { useParams } from 'react-router-dom';

export default function DiscardDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>폐기 상세</h1>
      <p>폐기 ID: {id}</p>
    </div>
  );
}
