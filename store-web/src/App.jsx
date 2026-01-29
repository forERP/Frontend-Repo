import './App.css'
import Header from './components/Header.jsx'
import AppRouter from './router/AppRouter.jsx'

export default function App() {
  return (
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
  )
}
