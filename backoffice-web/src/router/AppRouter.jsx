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
import ProductBundleForm from '../pages/products/ProductBundleForm.jsx';
import ProductDetail from '../pages/products/ProductDetail.jsx';
import ProductCategoryList from '../pages/products/ProductCategoryList.jsx';
import ProductCategoryForm from '../pages/products/ProductCategoryForm.jsx';
import ProductCategoryDetail from '../pages/products/ProductCategoryDetail.jsx';

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
import ReturnList from '../pages/returns/ReturnList.jsx';

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
import PayrollReport from '../pages/reports/PayrollReport.jsx';

// Log Pages
import AdminLog from '../pages/historylogs/AdminLog.jsx';
import InventoryLog from '../pages/historylogs/InventoryLog.jsx';

// Supplier Pages
import SupplierList from '../pages/suppliers/SupplierList.jsx';
import SupplierCreate from '../pages/suppliers/SupplierCreate.jsx';
import SupplierDetail from '../pages/suppliers/SupplierDetail.jsx';
import { isStoreAdminRole } from '../utils/auth';

export default function AppRouter({ user, setUser }) {
  const isStoreAdmin = isStoreAdminRole(user?.role);

  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout user={user} />}>
          {/* Dashboard */}
          <Route path="/" element={<Home />} />

          {/* Product Routes */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={isStoreAdmin ? <Navigate to="/products" replace /> : <ProductForm />} />
          <Route path="/products/bundles/new" element={isStoreAdmin ? <Navigate to="/products" replace /> : <ProductBundleForm />} />
          <Route path="/product-categories" element={<ProductCategoryList />} />
          <Route path="/product-categories/new" element={isStoreAdmin ? <Navigate to="/product-categories" replace /> : <ProductCategoryForm />} />
          <Route path="/product-categories/:id" element={<ProductCategoryDetail />} />
          <Route path="/products/:id" element={<ProductDetail />} />

          {/* Store Routes */}
          <Route path="/stores" element={<StoreList />} />
          <Route path="/stores/create" element={isStoreAdmin ? <Navigate to="/stores" replace /> : <StoreCreate />} />
          <Route path="/stores/:id" element={<StoreDetail />} />
          <Route path="/warehouses" element={<WarehouseList />} />
          <Route path="/warehouses/create" element={isStoreAdmin ? <Navigate to="/warehouses" replace /> : <WarehouseCreate />} />
          <Route path="/warehouses/:id" element={<WarehouseDetail />} />

          {/* Inventory Routes */}
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/stores/:storeId/inventory" element={<InventoryList />} />
          <Route path="/stores/:storeId/inventory/:storeProductId" element={<InventoryItem />} />
          <Route path="/inventory/store-products/:storeProductId" element={<InventoryItem />} />
          <Route path="/inventory/adjust" element={<InventoryAdjust />} />
          <Route path="/inventory/logs" element={<InventoryLogs />} />

          {/* Purchase Routes */}
          <Route path="/purchase-requests" element={<PurchaseRequestListPage />} />
          <Route path="/purchase-requests/new" element={<PurchaseRequestFormPage />} />
          <Route path="/purchase-requests/:id" element={<PurchaseRequestDetailPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
          <Route path="/purchase-orders/:orderId" element={<PurchaseOrderDetailPage />} />
          <Route path="/purchase-approvals" element={isStoreAdmin ? <Navigate to="/purchase-requests" replace /> : <PurchaseApprovalListPage />} />
          <Route path="/purchase-approvals/:id" element={isStoreAdmin ? <Navigate to="/purchase-requests" replace /> : <PurchaseApprovalDetailPage />} />

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
          <Route path="/returns" element={<ReturnList />} />
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
          <Route path="/reports/payroll" element={<PayrollReport />} />

          {/* Log Routes */}
          <Route path="/logs/admin" element={isStoreAdmin ? <Navigate to="/" replace /> : <AdminLog />} />
          <Route path="/logs/inventory" element={isStoreAdmin ? <Navigate to="/" replace /> : <InventoryLog />} />

          {/* Supplier Routes */}
          <Route path="/suppliers" element={<SupplierList />} />
          <Route path="/suppliers/new" element={isStoreAdmin ? <Navigate to="/suppliers" replace /> : <SupplierCreate />} />
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
