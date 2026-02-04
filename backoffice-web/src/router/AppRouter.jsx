import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import NotFound from '../pages/NotFound.jsx';

import PurchaseRequestListPage from '../pages/purchaseRequest/requestList/PurchaseRequestListPage.jsx';
import PurchaseRequestDetailPage from '../pages/purchaseRequest/approval/PurchaseApprovalPage.jsx';

import InboundProcessPage from '../pages/inbound/InboundProcessPage.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />


          <Route path="/purchases/requests" element={<PurchaseRequestListPage />} />
          <Route path="/purchases/approvals" element={<PurchaseRequestDetailPage />} />

          <Route path="/inbounds/process" element={<InboundProcessPage />} />

        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
