import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import NotFound from '../pages/NotFound.jsx'
import MenuPage from '../pages/Menu/MenuPage.jsx'
import Manager from '../manager/manager.jsx'
import Change from '../manager/change.jsx'
import Dispose from '../manager/dispose.jsx'
import Meal from '../manager/meal.jsx'
import Receipt from '../manager/receipt.jsx'
import Work from '../manager/work.jsx'

export default function AppRouter() {
  return (
    <Routes>

      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Home />} />

      <Route path="/menu/:category" element={<MenuPage />} />

      {/* 메니저 */}
      <Route path="/manager" element={<Manager />} />


      <Route path="/change" element={< Change />} />

      <Route path="/dispose" element={< Dispose />} />
      <Route path="/meal" element={< Meal />} />

      <Route path="/receipt" element={< Receipt />} />


      <Route path="/work" element={< Work />} />


      {/* menu/:category */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}