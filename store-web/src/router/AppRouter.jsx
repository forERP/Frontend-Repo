import { Routes, Route } from 'react-router-dom'
import PosLayout from '../layouts/PosLayout'

import Home from '../pages/Home.jsx'
import Closed from '../pages/closed.jsx'
import Login from '../pages/Login.jsx'
import NotFound from '../pages/NotFound.jsx'
import MenuPage from '../pages/Menu/MenuPage.jsx'
import StartPage from '../pages/StartPage.jsx'
import Manager from '../manager/manager.jsx'
import Change from '../manager/change.jsx'
import Dispose from '../manager/dispose.jsx'
import Meal from '../manager/meal.jsx'
import Receipt from '../manager/receipt.jsx'
import Work from '../manager/work.jsx'

import Kitchen from '../other/kitchen.jsx'
import Number from '../other/number.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path='/' element={<StartPage />} />

      {/* ✅ 번외 (pos-main 영향 ❌ 완전 독립) */}

      <Route path="/kitchen" element={<Kitchen />} />
      <Route path="/number" element={<Number />} />


      {/* ✅ POS 전용 그룹 (pos-main 적용) */}
      <Route element={<PosLayout />} >

        <Route path="/" element={<Home />} />
        <Route path="/menu/:category" element={<MenuPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/closed" element={<Closed />} />

        <Route path="/manager" element={<Manager />} />
        <Route path="/change" element={<Change />} />
        <Route path="/dispose" element={<Dispose />} />
        <Route path="/meal" element={<Meal />} />
        <Route path="/receipt" element={<Receipt />} />
        <Route path="/work" element={<Work />} />

      </Route>

      <Route path="*" element={<NotFound />} />

    </Routes>
  )
}
