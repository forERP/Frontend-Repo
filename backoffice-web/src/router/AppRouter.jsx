import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';

// Common Pages
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import NotFound from '../pages/NotFound.jsx';

// Product Pages
import ProductList from '../pages/products/ProductList.jsx';
import ProductForm from '../pages/products/ProductForm.jsx';
import ProductDetail from '../pages/products/ProductDetail.jsx';

// Store Pages
import StoreList from '../pages/stores/StoreList.jsx';
import StoreDetail from '../pages/stores/StoreDetail.jsx';
import WarehouseList from '../pages/warehouses/WarehouseList.jsx';

// Inventory Pages
import InventoryList from '../pages/inventory/InventoryList.jsx';
import InventoryItem from '../pages/inventory/InventoryItem.jsx';
import InventoryAdjust from '../pages/inventory/InventoryAdjust.jsx';
import InventoryLogs from '../pages/inventory/InventoryLogs.jsx';

// Purchase Pages
import PurchaseRequests from '../pages/purchase/PurchaseRequests.jsx';
import PurchaseRequestDetail from '../pages/purchase/PurchaseRequestDetail.jsx';
import PurchaseOrders from '../pages/purchase/PurchaseOrders.jsx';
import PurchaseOrderDetail from '../pages/purchase/PurchaseOrderDetail.jsx';
import Inbounds from '../pages/purchase/Inbounds.jsx';
import InboundDetail from '../pages/purchase/InboundDetail.jsx';

// Order Pages
import OrderList from '../pages/orders/OrderList.jsx';
import OrderDetail from '../pages/orders/OrderDetail.jsx';

// Outbound Pages
import OutboundList from '../pages/outbounds/OutboundList.jsx';
import OutboundDetail from '../pages/outbounds/OutboundDetail.jsx';

// Discard Pages
import DiscardList from '../pages/discards/DiscardList.jsx';
import DiscardForm from '../pages/discards/DiscardForm.jsx';
import DiscardDetail from '../pages/discards/DiscardDetail.jsx';

// Shipment Pages
import Shipments from '../pages/shipments/Shipments.jsx';
import ShipmentTracking from '../pages/shipments/ShipmentTracking.jsx';

// Staff Pages
import Users from '../pages/staff/Users.jsx';
import UserDetail from '../pages/staff/UserDetail.jsx';
import Attendance from '../pages/staff/Attendance.jsx';
import Salary from '../pages/staff/Salary.jsx';

// Report Pages
import InventoryReport from '../pages/reports/InventoryReport.jsx';
import SalesReport from '../pages/reports/SalesReport.jsx';

// Log Pages
import AdminLog from '../pages/historylogs/AdminLog.jsx';
import InventoryLog from '../pages/historylogs/InventoryLog.jsx';

// Settings Pages
import Suppliers from '../pages/settings/Suppliers.jsx';
import Roles from '../pages/settings/Roles.jsx';

// Legacy Pages (keeping for backward compatibility)
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

export default function AppRouter({ user, setUser }) {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout user={user} />}>
          {/* Dashboard */}
          <Route path="/" element={<Home />} />

          {/* Product Routes */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />

          {/* Store Routes */}
          <Route path="/stores" element={<StoreList />} />
          <Route path="/stores/:id" element={<StoreDetail />} />
          <Route path="/warehouses" element={<WarehouseList />} />

          {/* Inventory Routes */}
          <Route path="/stores/:storeId/inventory" element={<InventoryList />} />
          <Route path="/stores/:storeId/inventory/:productId" element={<InventoryItem />} />
          <Route path="/inventory/adjust" element={<InventoryAdjust />} />
          <Route path="/inventory/logs" element={<InventoryLogs />} />

          {/* Purchase Routes */}
          <Route path="/purchase-requests" element={<PurchaseRequests />} />
          <Route path="/purchase-requests/:id" element={<PurchaseRequestDetail />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
          <Route path="/inbounds" element={<Inbounds />} />
          <Route path="/inbounds/:id" element={<InboundDetail />} />

          {/* Order Routes */}
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />

          {/* Outbound Routes */}
          <Route path="/outbounds" element={<OutboundList />} />
          <Route path="/outbounds/:id" element={<OutboundDetail />} />

          {/* Discard Routes */}
          <Route path="/discards" element={<DiscardList />} />
          <Route path="/discards/new" element={<DiscardForm />} />
          <Route path="/discards/:id" element={<DiscardDetail />} />

          {/* Shipment Routes */}
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/shipments/:id/tracking" element={<ShipmentTracking />} />

          {/* Staff Routes */}
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/salary" element={<Salary />} />

          {/* Report Routes */}
          <Route path="/reports/inventory" element={<InventoryReport />} />
          <Route path="/reports/sales" element={<SalesReport />} />

          {/* Log Routes */}
          <Route path="/logs/admin" element={<AdminLog />} />
          <Route path="/logs/inventory" element={<InventoryLog />} />

          {/* Settings Routes */}
          <Route path="/settings/suppliers" element={<Suppliers />} />
          <Route path="/settings/roles" element={<Roles />} />

          {/* Legacy Purchase Routes (for backward compatibility) */}
          <Route path="/purchases/requests" element={<PurchaseRequestListPage />} />
          <Route path="/purchases/requests/:id" element={<PurchaseRequestDetailPage />} />
          <Route path="/purchases/requests/new" element={<PurchaseRequestFormPage />} />

          <Route path="/purchases/approvals" element={<PurchaseApprovalListPage />} />
          <Route path="/purchases/approvals/:id" element={<PurchaseApprovalDetailPage />} />

          <Route path="/purchases/history" element={<PurchaseHistoryListPage />} />
          <Route path="/purchases/history/:id" element={<PurchaseHistoryDetailPage />} />

          <Route path="/inbounds/process" element={<InboundProcessPage />} />
          <Route path="/inbounds/shipment" element={<InboundShipmentPage />} />
          <Route path="/inbounds/history" element={<InboundHistoryPage />} />

        </Route>
      </Route>

      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
