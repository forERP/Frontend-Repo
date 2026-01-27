import { login } from '../api/authApi'

export default function Login() {
  
  const handleLogin = async () => {
    await login({ id, password })
  }

  return (
    <p>
      로그인페이지
    </p>
  )
}