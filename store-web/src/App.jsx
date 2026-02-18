import { BrowserRouter } from 'react-router-dom'
import './App.css'
import AppRouter from './router/AppRouter.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

