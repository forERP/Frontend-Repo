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
import StoreForm from '../pages/stores/StoreForm.jsx';
import StoreDetail from '../pages/stores/StoreDetail.jsx';
import WarehouseList from '../pages/warehouses/WarehouseList.jsx';

// Inventory Pages
import InventoryList from '../pages/inventory/InventoryList.jsx';
import InventoryItem from '../pages/inventory/InventoryItem.jsx';
import InventoryAdjust from '../pages/inventory/InventoryAdjust.jsx';
import InventoryLogs from '../pages/inventory/InventoryLogs.jsx';

// Purchase Pages
import PurchaseRequestListPage from '../pages/purchase/request/PurchaseRequestListPage.jsx';
import PurchaseRequestDetailPage from '../pages/purchase/request/PurchaseRequestDetailPage.jsx';
import PurchaseRequestFormPage from '../pages/purchase/request/PurchaseRequestFormPage.jsx';
import PurchaseApprovalListPage from '../pages/purchase/approval/PurchaseApprovalListPage.jsx';
import PurchaseApprovalDetailPage from '../pages/purchase/approval/PurchaseApprovalDetailPage.jsx';
import PurchaseHistoryListPage from '../pages/purchase/history/PurchaseHistoryListPage.jsx';
import PurchaseHistoryDetailPage from '../pages/purchase/history/PurchaseHistoryDetailPage.jsx';
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
          <Route path="/stores/create" element={<StoreForm />} />
          <Route path="/stores/:id" element={<StoreDetail />} />
          <Route path="/warehouses" element={<WarehouseList />} />

          {/* Inventory Routes */}
          <Route path="/stores/:storeId/inventory" element={<InventoryList />} />
          <Route path="/stores/:storeId/inventory/:productId" element={<InventoryItem />} />
          <Route path="/inventory/adjust" element={<InventoryAdjust />} />
          <Route path="/inventory/logs" element={<InventoryLogs />} />

          {/* Purchase Routes */}
          <Route path="/purchase-requests" element={<PurchaseRequestListPage />} />
          <Route path="/purchase-requests/new" element={<PurchaseRequestFormPage />} />
          <Route path="/purchase-requests/:id" element={<PurchaseRequestDetailPage />} />
          <Route path="/purchase-approvals" element={<PurchaseApprovalListPage />} />
          <Route path="/purchase-approvals/:id" element={<PurchaseApprovalDetailPage />} />
          <Route path="/purchase-orders" element={<PurchaseHistoryListPage />} />
          <Route path="/purchase-orders/:id" element={<PurchaseHistoryDetailPage />} />
          
          {/* Inbound Routes */}
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

        </Route>
      </Route>

      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
