import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import NotFound from '../pages/NotFound.jsx';


import PurchaseRequestListPage from '../pages/purchase/request/PurchaseRequestListPage.jsx'
import PurchaseRequestDetailPage from '../pages/purchase/request/PurchaseRequestDetailPage.jsx'
import PurchaseRequestFormPage from '../pages/purchase/request/PurchaseRequestFormPage.jsx'

import PurchaseApprovalListPage from '../pages/purchase/approval/PurchaseApprovalListPage.jsx'
import PurchaseApprovalDetailPage from '../pages/purchase/approval/PurchaseApprovalDetailPage.jsx'

import PurchaseHistoryListPage from '../pages/purchase/history/PurchaseHistoryListPage.jsx'
import PurchaseHistoryDetailPage from '../pages/purchase/history/PurchaseHistoryDetailPage.jsx'

import InboundProcessPage from '../pages/inbound/InboundProcessPage.jsx';
import InboundShipmentPage from '../pages/inbound/InboundShipmentPage.jsx';
import InboundHistoryPage from '../pages/inbound/InboundHistoryPage.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />


          <Route path="/purchases/requests" element={<PurchaseRequestListPage />} />
          <Route path="/purchases/requests/:id" element={<PurchaseRequestDetailPage />} />
          <Route path="/purchases/requests/new" element={<PurchaseRequestFormPage />} />

          <Route path="/purchases/approvals" element={<PurchaseApprovalListPage />} />
          <Route path="/purchases/approvals/:id" element={<PurchaseApprovalDetailPage />} />

          <Route path="/purchases/history" element={<PurchaseHistoryListPage />} />
          <Route path="/purchases/history:id" element={<PurchaseHistoryDetailPage />} />

          <Route path="/inbounds/process" element={<InboundProcessPage />} />
          <Route path="/inbounds/shipment" element={<InboundShipmentPage />} />
          <Route path="/inbounds/history" element={<InboundHistoryPage />} />

        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
