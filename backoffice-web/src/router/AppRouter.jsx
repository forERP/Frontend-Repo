import { Navigate, Routes, Route } from 'react-router-dom';
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
import StoreCreate from '../pages/stores/StoreCreate.jsx';
import StoreDetail from '../pages/stores/StoreDetail.jsx';
import WarehouseList from '../pages/warehouses/WarehouseList.jsx';
import WarehouseCreate from '../pages/warehouses/WarehouseCreate.jsx';
import WarehouseDetail from '../pages/warehouses/WarehouseDetail.jsx';

// Inventory Pages
import InventoryList from '../pages/inventory/InventoryList.jsx';
import InventoryItem from '../pages/inventory/InventoryItem.jsx';
import InventoryAdjust from '../pages/inventory/InventoryAdjust.jsx';
import InventoryLogs from '../pages/inventory/InventoryLogs.jsx';

// Purchase Pages
import PurchaseRequestListPage from '../pages/purchase/request/PurchaseRequestListPage.jsx';
import PurchaseRequestDetailPage from '../pages/purchase/request/PurchaseRequestDetailPage.jsx';
import PurchaseRequestFormPage from '../pages/purchase/request/PurchaseRequestFormPage.jsx';
import PurchaseOrderListPage from '../pages/purchase/order/PurchaseOrderListPage.jsx';
import PurchaseOrderDetailPage from '../pages/purchase/order/PurchaseOrderDetailPage.jsx';
import PurchaseApprovalListPage from '../pages/purchase/approval/PurchaseApprovalListPage.jsx';
import PurchaseApprovalDetailPage from '../pages/purchase/approval/PurchaseApprovalDetailPage.jsx';
import Inbounds from '../pages/inbounds/InboundListPage.jsx';
import InboundDetail from '../pages/inbounds/InboundDetailPage.jsx';

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
import UserForm from '../pages/staff/UserForm.jsx';
import UserUpdate from '../pages/staff/UserUpdate.jsx';
import UserDetail from '../pages/staff/UserDetail.jsx';
import Attendance from '../pages/staff/Attendance.jsx';
import AttendanceDetail from '../pages/staff/AttendanceDetail.jsx';
import LeaveManagement from '../pages/staff/LeaveManagement.jsx';
import Salary from '../pages/staff/Salary.jsx';

// Report Pages
import InventoryReport from '../pages/reports/InventoryReport.jsx';
import SalesReport from '../pages/reports/SalesReport.jsx';

// Log Pages
import AdminLog from '../pages/historylogs/AdminLog.jsx';
import InventoryLog from '../pages/historylogs/InventoryLog.jsx';

// Supplier Pages
import SupplierList from '../pages/suppliers/SupplierList.jsx';
import SupplierCreate from '../pages/suppliers/SupplierCreate.jsx';
import SupplierDetail from '../pages/suppliers/SupplierDetail.jsx';

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
          <Route path="/stores/create" element={<StoreCreate />} />
          <Route path="/stores/:id" element={<StoreDetail />} />
          <Route path="/warehouses" element={<WarehouseList />} />
          <Route path="/warehouses/create" element={<WarehouseCreate />} />
          <Route path="/warehouses/:id" element={<WarehouseDetail />} />

          {/* Inventory Routes */}
          <Route path="/stores/:storeId/inventory" element={<InventoryList />} />
          <Route path="/stores/:storeId/inventory/:productId" element={<InventoryItem />} />
          <Route path="/inventory/adjust" element={<InventoryAdjust />} />
          <Route path="/inventory/logs" element={<InventoryLogs />} />

          {/* Purchase Routes */}
          <Route path="/purchase-requests" element={<PurchaseRequestListPage />} />
          <Route path="/purchase-requests/new" element={<PurchaseRequestFormPage />} />
          <Route path="/purchase-requests/:id" element={<PurchaseRequestDetailPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
          <Route path="/purchase-orders/:orderId" element={<PurchaseOrderDetailPage />} />
          <Route path="/purchase-approvals" element={<PurchaseApprovalListPage />} />
          <Route path="/purchase-approvals/:id" element={<PurchaseApprovalDetailPage />} />

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
          <Route path="/users/:userId" element={<UserDetail />} />
          <Route path="/users/new" element={<UserForm />} />
          <Route path="/users/:userId/edit" element={<UserUpdate />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/attendance/:userId" element={<AttendanceDetail />} />
          <Route path="/attendance/:userId/leave" element={<LeaveManagement />} />
          <Route path="/salary" element={<Salary />} />

          {/* Report Routes */}
          <Route path="/reports/inventory" element={<InventoryReport />} />
          <Route path="/reports/sales" element={<SalesReport />} />

          {/* Log Routes */}
          <Route path="/logs/admin" element={<AdminLog />} />
          <Route path="/logs/inventory" element={<InventoryLog />} />

          {/* Supplier Routes */}
          <Route path="/suppliers" element={<SupplierList />} />
          <Route path="/suppliers/new" element={<SupplierCreate />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
          <Route path="/settings/suppliers" element={<Navigate to="/suppliers" replace />} />
          <Route path="/settings/roles" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />

        </Route>
      </Route>

      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
