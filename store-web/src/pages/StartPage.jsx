import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at 20% 20%, #1d4ed8, #0f172a 68%)',
    color: '#ffffff',
    cursor: 'pointer',
    userSelect: 'none',
  },
  content: {
    textAlign: 'center',
    padding: '32px',
  },
  title: {
    fontSize: '3.4rem',
    marginBottom: '16px',
    fontWeight: 800,
  },
  subTitle: {
    fontSize: '1.2rem',
    opacity: 0.9,
  },
}

export default function StartPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      navigate('/home', { replace: true })
    }
  }, [navigate])

  return (
    <div style={styles.container} onClick={() => navigate('/login')}>
      <div style={styles.content}>
        <h1 style={styles.title}>POS 시작 화면</h1>
        <p style={styles.subTitle}>화면을 터치해서 로그인하세요</p>
      </div>
    </div>
  )
}
