export const menus = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/',
        permissionCode: 'DASHBOARD_VIEW',
    },

    {
        key: 'products',
        label: '상품',
        permissionCode: 'PRODUCT_MENU',
        children: [
            { key: 'product-list', label: '상품 목록', path: '/products', permissionCode: 'PRODUCT_LIST_VIEW' },
            { key: 'product-new', label: '상품 등록', path: '/products/new', permissionCode: 'PRODUCT_CREATE' },
            { key: 'product-detail', label: '상품 상세', path: '/products/:id', hidden: true, permissionCode: 'PRODUCT_DETAIL_VIEW' },
        ],
    },

    {
        key: 'stores',
        label: '매장/창고',
        permissionCode: 'STORE_MENU',
        children: [
            { key: 'store-list', label: '매장 목록', path: '/stores', permissionCode: 'STORE_LIST_VIEW' },
            { key: 'store-create', label: '매장 등록', path: '/stores/create', permissionCode: 'STORE_CREATE' },
            { key: 'store-detail', label: '매장 상세', path: '/stores/:id', hidden: true, permissionCode: 'STORE_DETAIL_VIEW' },
            { key: 'warehouse-list', label: '창고 목록', path: '/warehouses', permissionCode: 'WAREHOUSE_LIST_VIEW' },
            { key: 'warehouse-create', label: '창고 등록', path: '/warehouses/create', permissionCode: 'WAREHOUSE_CREATE' },
            { key: 'warehouse-detail', label: '창고 상세', path: '/warehouses/:id', hidden: true, permissionCode: 'WAREHOUSE_DETAIL_VIEW' },
        ],
    },

    {
        key: 'inventory',
        label: '재고',
        permissionCode: 'INVENTORY_MENU',
        children: [
            { key: 'inventory-list', label: '지점 재고 목록', path: '/stores/:storeId/inventory', permissionCode: 'INVENTORY_VIEW' },
            { key: 'inventory-item', label: '재고 상세', path: '/stores/:storeId/inventory/:productId', hidden: true, permissionCode: 'INVENTORY_DETAIL' },
            { key: 'inventory-adjust', label: '재고 조정', path: '/inventory/adjust', permissionCode: 'INVENTORY_ADJUST' },
            { key: 'inventory-logs', label: '재고 이동 이력', path: '/inventory/logs', permissionCode: 'INVENTORY_LOG_VIEW' },
        ],
    },

    {
        key: 'purchase',
        label: '발주/입고',
        permissionCode: 'PURCHASE_MENU',
        children: [
            { key: 'purchase-requests', label: '발주 요청 목록', path: '/purchase-requests', permissionCode: 'PURCHASE_REQUEST_VIEW' },
            { key: 'purchase-request-detail', label: '발주 요청 상세', path: '/purchase-requests/:id', hidden: true, permissionCode: 'PURCHASE_REQUEST_VIEW' },
            { key: 'purchase-request-create', label: '발주 요청 생성', path: '/purchase-requests/new', permissionCode: 'PURCHASE_REQUEST_CREATE' },
            { key: 'purchase-orders', label: '발주 목록', path: '/purchase-orders', permissionCode: 'PURCHASE_ORDER_VIEW' },
            { key: 'purchase-order-detail', label: '발주 상세', path: '/purchase-orders/:id', hidden: true, permissionCode: 'PURCHASE_ORDER_VIEW' },
            { key: 'inbounds', label: '입고 목록', path: '/inbounds', permissionCode: 'INBOUND_VIEW' },
            { key: 'inbound-detail', label: '입고 상세', path: '/inbounds/:id', hidden: true, permissionCode: 'INBOUND_VIEW' },
        ],
    },

    {
        key: 'orders-outbounds',
        label: '주문/출고',
        permissionCode: 'ORDER_MENU',
        children: [
            { key: 'orders', label: '주문 목록', path: '/orders', permissionCode: 'ORDER_LIST_VIEW' },
            { key: 'order-detail', label: '주문 상세', path: '/orders/:id', hidden: true, permissionCode: 'ORDER_DETAIL_VIEW' },
            { key: 'outbounds', label: '출고 관리', path: '/outbounds', permissionCode: 'OUTBOUND_VIEW' },
            { key: 'outbound-detail', label: '출고 상세', path: '/outbounds/:id', hidden: true, permissionCode: 'OUTBOUND_VIEW' },
        ],
    },

    {
        key: 'discards',
        label: '폐기/급식',
        permissionCode: 'DISCARD_MENU',
        children: [
            { key: 'discard-list', label: '폐기 목록', path: '/discards', permissionCode: 'DISCARD_VIEW' },
            { key: 'discard-detail', label: '폐기 상세', path: '/discards/:id', hidden: true, permissionCode: 'DISCARD_VIEW' },
            { key: 'discard-new', label: '폐기 등록', path: '/discards/new', permissionCode: 'DISCARD_CREATE' },
        ],
    },

    {
        key: 'shipments',
        label: '배송/송장',
        permissionCode: 'SHIPMENT_MENU',
        children: [
            { key: 'shipments-list', label: '배송 목록', path: '/shipments', permissionCode: 'SHIPMENT_VIEW' },
            { key: 'shipment-tracking', label: '송장 추적', path: '/shipments/:id/tracking', hidden: true, permissionCode: 'SHIPMENT_TRACK' },
        ],
    },

    {
        key: 'staff',
        label: '직원/인사',
        permissionCode: 'STAFF_MENU',
        children: [
            { key: 'users', label: '직원 목록', path: '/users', permissionCode: 'USER_VIEW' },
            { key: 'user-detail', label: '직원 상세', path: '/users/:id', hidden: true, permissionCode: 'USER_VIEW' },
            { key: 'attendance', label: '근태 관리', path: '/attendance', permissionCode: 'ATTENDANCE_VIEW' },
            { key: 'salary', label: '급여 관리', path: '/salary', permissionCode: 'SALARY_VIEW' },
        ],
    },

    {
        key: 'reports',
        label: '리포트',
        permissionCode: 'REPORT_MENU',
        children: [
            { key: 'report-inventory', label: '재고 리포트', path: '/reports/inventory', permissionCode: 'REPORT_INVENTORY' },
            { key: 'report-sales', label: '매출 리포트', path: '/reports/sales', permissionCode: 'REPORT_SALES' },
        ],
    },

    {
        key: 'logs',
        label: '로그',
        permissionCode: 'LOG_MENU',
        children: [
            { key: 'admin-log', label: '관리자 로그', path: '/logs/admin', permissionCode: 'ADMIN_LOG_VIEW' },
            { key: 'inventory-log', label: '재고 이동 로그', path: '/logs/inventory', permissionCode: 'INVENTORY_LOG_VIEW' },
        ],
    },

    {
        key: 'settings',
        label: '설정',
        permissionCode: 'SETTINGS_MENU',
        children: [
            { key: 'suppliers', label: '거래처 관리', path: '/settings/suppliers', permissionCode: 'SUPPLIER_VIEW' },
            { key: 'roles', label: '권한/역할', path: '/settings/roles', permissionCode: 'ROLE_VIEW' },
        ],
    },
];

export default menus;
