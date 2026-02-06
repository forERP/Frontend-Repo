export const menus = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/',
        permissionCode: 'DASHBOARD_VIEW',
    },

    {
        key: 'store',
        label: '매장 관리',
        permissionCode: 'STORE_MENU',
        children: [
            {
                key: 'store-list',
                label: '매장 목록',
                path: '/stores',
                permissionCode: 'STORE_LIST_VIEW',
            },
            {
                key: 'store-detail',
                label: '매장 상세',
                collapsible: true,
                permissionCode: 'STORE_DETAIL_MENU',
                children: [
                    {
                        key: 'store-basic',
                        label: '기본 정보',
                        path: '/stores/:id/basic',
                        permissionCode: 'STORE_BASIC_VIEW',
                    },
                    {
                        key: 'store-status',
                        label: '운영 상태',
                        path: '/stores/:id/status',
                        permissionCode: 'STORE_STATUS_UPDATE',
                    },
                    {
                        key: 'store-summary',
                        label: '운영 현황',
                        path: '/stores/:id/summary',
                        permissionCode: 'STORE_SUMMARY_VIEW',
                    },
                ],
            },
        ],
    },

    {
        key: 'product-stock',
        label: '상품/재고',
        permissionCode: 'PRODUCT_STOCK_MENU',
        children: [
            {
                key: 'product',
                label: '상품 관리',
                collapsible: true,
                permissionCode: 'PRODUCT_MENU',
                children: [
                    {
                        key: 'product-list',
                        label: '상품 목록',
                        path: '/products',
                        permissionCode: 'PRODUCT_LIST_VIEW',
                    },
                    {
                        key: 'product-detail',
                        label: '상품 상세',
                        path: '/products/:id',
                        hidden: true,
                        permissionCode: 'PRODUCT_DETAIL_VIEW',
                    },
                ],
            },
            {
                key: 'stock',
                label: '재고 관리',
                collapsible: true,
                permissionCode: 'STOCK_MENU',
                children: [
                    {
                        key: 'stock-status',
                        label: '재고 현황',
                        path: '/stocks',
                        permissionCode: 'STOCK_VIEW',
                    },
                    {
                        key: 'stock-history',
                        label: '재고 이력',
                        path: '/stocks/history',
                        permissionCode: 'STOCK_HISTORY_VIEW',
                    },
                    {
                        key: 'stock-adjust',
                        label: '재고 조정',
                        path: '/stocks/adjust',
                        permissionCode: 'STOCK_ADJUST',
                    },
                ],
            },
        ],
    },

    {
        key: 'purchase-inbound',
        label: '발주/입고',
        permissionCode: 'PURCHASE_INBOUND_MENU',
        children: [
            {
                key: 'purchase',
                label: '발주 관리',
                collapsible: true,
                permissionCode: 'PURCHASE_MENU',
                children: [
                    { key: 'purchase-request', label: '발주 요청', path: '/purchases/requests' },
                    { key: 'purchase-approve', label: '발주 승인', path: '/purchases/approvals' },
                    { key: 'purchase-history', label: '발주 이력', path: '/purchases' },
                ],
            },
            {
                key: 'inbound',
                label: '입고 관리',
                collapsible: true,
                permissionCode: 'INBOUND_MENU',
                children: [
                    { key: 'inbound-process', label: '입고 처리', path: '/inbounds/process' },
                    { key: 'inbound-history', label: '입고 이력', path: '/inbounds/history' },
                    { key: 'inbound-delivery', label: '입고 배송 정보', path: '/inbounds/shipment' },
                ],
            },
        ],
    },

    {
        key: 'order-shipment',
        label: '주문/출고',
        permissionCode: 'ORDER_SHIPMENT_MENU',
        children: [
            {
                key: 'order',
                label: '주문 조회',
                collapsible: true,
                permissionCode: 'ORDER_MENU',
                children: [
                    { key: 'order-list', label: '주문 목록', path: '/orders' },
                    { key: 'order-detail', label: '주문 상세', path: '/orders/:id', hidden: true },
                ],
            },
            {
                key: 'shipment',
                label: '출고 관리',
                collapsible: true,
                permissionCode: 'SHIPMENT_MENU',
                children: [
                    { key: 'shipment-process', label: '출고 처리', path: '/shipments/process' },
                    { key: 'shipment-history', label: '출고 이력', path: '/shipments' },
                    { key: 'shipment-delivery', label: '출고 배송 정보', path: '/shipments/deliveries' },
                ],
            },
        ],
    },

    {
        key: 'return',
        label: '반품',
        permissionCode: 'RETURN_MENU',
        children: [
            { key: 'return-request', label: '반품 요청', path: '/returns/requests' },
            { key: 'return-approve', label: '반품 승인', path: '/returns/approvals' },
            { key: 'return-history', label: '반품 이력', path: '/returns' },
        ],
    },
    {
        key: 'disposal',
        label: '폐기',
        permissionCode: 'DISPOSAL_MENU',
        children: [
            {
                key: 'disposal-request',
                label: '폐기 요청',
                path: '/disposals/requests',
                permissionCode: 'DISPOSAL_REQUEST',
            },
            {
                key: 'disposal-approve',
                label: '폐기 승인',
                path: '/disposals/approvals',
                permissionCode: 'DISPOSAL_APPROVE',
            },
            {
                key: 'disposal-history',
                label: '폐기 이력',
                path: '/disposals',
                permissionCode: 'DISPOSAL_HISTORY',
            },
        ],
    },

    {
        key: 'sales-settlement',
        label: '매출/정산',
        permissionCode: 'SALES_SETTLEMENT_MENU',
        children: [
            {
                key: 'sales',
                label: '매출 조회',
                collapsible: true,
                children: [
                    { key: 'sales-summary', label: '매출 요약', path: '/sales' },
                    { key: 'sales-detail', label: '매출 상세', path: '/sales/detail' },
                ],
            },
            {
                key: 'settlement',
                label: '정산 관리',
                collapsible: true,
                children: [
                    { key: 'settlement-create', label: '정산 생성', path: '/settlements/new' },
                    { key: 'settlement-history', label: '정산 이력', path: '/settlements' },
                ],
            },
        ],
    },
    {
        key: 'staff-auth',
        label: '직원/권한 관리',
        permissionCode: 'STAFF_AUTH_MENU',
        children: [
            { key: 'staff', label: '직원 관리', path: '/staffs' },
            { key: 'attendance', label: '근태 관리', path: '/attendances' },
            { key: 'role', label: '권한 관리', path: '/roles' },
        ],
    },

    {
        key: 'logs',
        label: 'Logs',
        permissionCode: 'LOG_MENU',
        children: [
            { key: 'admin-log', label: '관리자 행위 로그', path: '/logs/admin' },
            { key: 'data-log', label: '주요 데이터 변경 이력', path: '/logs/data' },
        ],
    },
];

export default menus;
