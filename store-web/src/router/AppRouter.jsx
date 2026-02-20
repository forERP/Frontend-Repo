import { Route, Routes } from 'react-router-dom'
import PosLayout from '../layouts/PosLayout'
import ProtectedRoute from './ProtectedRoute'

import Home from '../pages/Home.jsx'
import Closed from '../pages/closed.jsx'
import Login from '../pages/Login.jsx'
import NotFound from '../pages/NotFound.jsx'
import MenuPage from '../pages/Menu/MenuPage.jsx'
import StartPage from '../pages/StartPage.jsx'
import PaymentFail from '../pages/PaymentFail.jsx'
import PaymentSuccess from '../pages/PaymentSuccess.jsx'
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
      <Route path='/kitchen' element={<Kitchen />} />
      <Route path='/number' element={<Number />} />

      <Route element={<PosLayout />}>
        <Route path='/' element={<StartPage />} />
        <Route path='/login' element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path='/home' element={<Home />} />
          <Route path='/menu' element={<MenuPage />} />
          <Route path='/menu/:category' element={<MenuPage />} />
          <Route path='/payment/success' element={<PaymentSuccess />} />
          <Route path='/payment/fail' element={<PaymentFail />} />
          <Route path='/closed' element={<Closed />} />

          <Route path='/manager' element={<Manager />} />
          <Route path='/change' element={<Change />} />
          <Route path='/dispose' element={<Dispose />} />
          <Route path='/meal' element={<Meal />} />
          <Route path='/receipt' element={<Receipt />} />
          <Route path='/work' element={<Work />} />
        </Route>

        <Route path='*' element={<NotFound />} />
      </Route>
    </Routes>
  )
}

