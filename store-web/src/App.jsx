import { BrowserRouter } from 'react-router-dom'
import './App.css'
import AppRouter from './router/AppRouter.jsx'
import Header from "./components/Header.jsx"

export default function App() {
  return (
    <BrowserRouter>
      <div className="pos-bg">
        <div className="pos-container">
          <header className="pos-header">
            <Header />
          </header>
          <main className="pos-main">
            <AppRouter />
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}