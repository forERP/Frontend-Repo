import { useParams } from 'react-router-dom';

export default function UserDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>직원 상세</h1>
      <p>직원 ID: {id}</p>
    </div>
  );
}
