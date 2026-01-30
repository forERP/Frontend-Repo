import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import NotFound from '../pages/NotFound.jsx'
import MenuPage from '../pages/Menu/MenuPage.jsx'

export default function AppRouter() {
  return (
    <Routes>

      <Route path="/" element={<Home />} />

      <Route path="/menu/:category" element={<MenuPage />} />

      {/* <Route path="/login" element={<Login />} /> */}
      {/* menu/:category */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  )
}