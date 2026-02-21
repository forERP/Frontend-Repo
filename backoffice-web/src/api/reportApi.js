import api from '../lib/api';
import { getInbound, getInboundList } from '../lib/dataApi';
import { fetchOrderDetail, fetchOrderPage } from './orderApi';
import { fetchOutboundDetail, fetchOutboundPage } from './outboundApi';
import { fetchProducts } from './productApi';
import { fetchUserPage } from './userApi';

const PAGE_SIZE = 100;
const DETAIL_BATCH_SIZE = 8;
const STORE_EMPLOYEE_ROLES = new Set([
  'STORE_ADMIN',
  'STORE_HALL_STAFF',
  'STORE_KITCHEN_STAFF',
]);

const toNumber = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toSafeString = value => (typeof value === 'string' ? value.trim() : '');

const toKey = value => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

const buildLastDayOfMonth = (year, month) => {
  const parsedYear = toNumber(year);
  const parsedMonth = toNumber(month);
  const safeYear = parsedYear > 0 ? parsedYear : new Date().getFullYear();
  const safeMonth = parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : new Date().getMonth() + 1;

  const date = new Date(safeYear, safeMonth, 0);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

async function fetchAllPages(fetchPage) {
  const rows = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await fetchPage(page);
    const content = Array.isArray(result?.content) ? result.content : [];
    rows.push(...content);

    const nextTotalPages = Number(result?.totalPages);
    if (Number.isFinite(nextTotalPages) && nextTotalPages > 0) {
      totalPages = nextTotalPages;
    } else {
      totalPages = page + 1;
    }

    page += 1;
  }

  return rows;
}

async function mapByBatches(items, mapper, batchSize = DETAIL_BATCH_SIZE) {
  const results = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const chunk = items.slice(index, index + batchSize);
    const mapped = await Promise.all(chunk.map(mapper));
    results.push(...mapped);
  }

  return results;
}

const createMovementRow = (name, rowKey, extra = {}) => ({
  key: rowKey,
  name: name || '-',
  inboundQty: 0,
  outboundQty: 0,
  netQty: 0,
  ...extra,
});

const updateNetQty = row => {
  row.netQty = row.inboundQty - row.outboundQty;
};

async function fetchProductNameMap(productIds) {
  const normalizedIds = Array.from(
    new Set(
      productIds
        .map(id => toNumber(id))
        .filter(id => id > 0),
    ),
  );

  const unresolved = new Set(normalizedIds);
  const productNameMap = new Map();

  if (unresolved.size === 0) {
    return productNameMap;
  }

  let page = 0;
  let totalPages = 1;

  while (page < totalPages && unresolved.size > 0) {
    const data = await fetchProducts(page, PAGE_SIZE);
    const content = Array.isArray(data?.content) ? data.content : [];

    content.forEach(product => {
      const productId = toNumber(product?.id);
      if (unresolved.has(productId)) {
        productNameMap.set(productId, product?.name || `상품 ${productId}`);
        unresolved.delete(productId);
      }
    });

    const nextTotalPages = Number(data?.totalPages);
    if (Number.isFinite(nextTotalPages) && nextTotalPages > 0) {
      totalPages = nextTotalPages;
    } else {
      totalPages = page + 1;
    }

    page += 1;
  }

  unresolved.forEach(productId => {
    productNameMap.set(productId, `상품 ${productId}`);
  });

  return productNameMap;
}

function aggregateInventoryByStore({ inbounds, outbounds }) {
  const rowMap = new Map();

  inbounds.forEach(({ listItem, detail }) => {
    const storeId = toKey(listItem?.storeId);
    const name = listItem?.storeName || (storeId ? `매장 ${storeId}` : '-');
    const key = storeId || `store-name:${name}`;
    const row = rowMap.get(key) || createMovementRow(name, key, { storeId: listItem?.storeId ?? null });

    const inboundQty = (detail?.items || []).reduce((sum, item) => sum + toNumber(item?.qty), 0);
    row.inboundQty += inboundQty;
    updateNetQty(row);
    rowMap.set(key, row);
  });

  outbounds.forEach(({ listItem, detail }) => {
    const storeId = toKey(listItem?.storeId);
    const name = listItem?.storeName || (storeId ? `매장 ${storeId}` : '-');
    const key = storeId || `store-name:${name}`;
    const row = rowMap.get(key) || createMovementRow(name, key, { storeId: listItem?.storeId ?? null });

    const outboundQty = (detail?.items || []).reduce((sum, item) => sum + toNumber(item?.qty), 0);
    row.outboundQty += outboundQty;
    updateNetQty(row);
    rowMap.set(key, row);
  });

  return Array.from(rowMap.values());
}

async function aggregateInventoryByProduct({ inbounds, outbounds }) {
  const allProductIds = [];
  inbounds.forEach(({ detail }) => {
    (detail?.items || []).forEach(item => allProductIds.push(item?.productId));
  });
  outbounds.forEach(({ detail }) => {
    (detail?.items || []).forEach(item => allProductIds.push(item?.productId));
  });

  const productNameMap = await fetchProductNameMap(allProductIds);
  const rowMap = new Map();

  const getRow = productId => {
    const numericProductId = toNumber(productId);
    const key = String(numericProductId);
    const existing = rowMap.get(key);
    if (existing) {
      return existing;
    }

    const next = createMovementRow(
      productNameMap.get(numericProductId) || `상품 ${numericProductId}`,
      key,
      { productId: numericProductId },
    );
    rowMap.set(key, next);
    return next;
  };

  inbounds.forEach(({ detail }) => {
    (detail?.items || []).forEach(item => {
      const productId = toNumber(item?.productId);
      if (productId <= 0) return;

      const row = getRow(productId);
      row.inboundQty += toNumber(item?.qty);
      updateNetQty(row);
    });
  });

  outbounds.forEach(({ detail }) => {
    (detail?.items || []).forEach(item => {
      const productId = toNumber(item?.productId);
      if (productId <= 0) return;

      const row = getRow(productId);
      row.outboundQty += toNumber(item?.qty);
      updateNetQty(row);
    });
  });

  return Array.from(rowMap.values());
}

export async function fetchInventoryReport({
  groupBy = 'product',
  movementType = 'ALL',
  storeKeyword = '',
  from = '',
  to = '',
} = {}) {
  const normalizedStoreKeyword = toSafeString(storeKeyword);
  const normalizedFrom = toSafeString(from);
  const normalizedTo = toSafeString(to);

  const inboundList = await fetchAllPages(page =>
    getInboundList({
      page,
      size: PAGE_SIZE,
      storeKeyword: normalizedStoreKeyword,
      status: 'CONFIRMED',
      from: normalizedFrom,
      to: normalizedTo,
    }),
  );

  const [outboundConfirmed, outboundArrived] = await Promise.all([
    fetchAllPages(page =>
      fetchOutboundPage({
        page,
        size: PAGE_SIZE,
        storeKeyword: normalizedStoreKeyword,
        status: 'CONFIRMED',
        from: normalizedFrom,
        to: normalizedTo,
      }),
    ),
    fetchAllPages(page =>
      fetchOutboundPage({
        page,
        size: PAGE_SIZE,
        storeKeyword: normalizedStoreKeyword,
        status: 'ARRIVED',
        from: normalizedFrom,
        to: normalizedTo,
      }),
    ),
  ]);

  const uniqueOutboundMap = new Map();
  [...outboundConfirmed, ...outboundArrived].forEach(outbound => {
    uniqueOutboundMap.set(toKey(outbound?.outboundId), outbound);
  });
  const outboundList = Array.from(uniqueOutboundMap.values());

  const [inboundDetails, outboundDetails] = await Promise.all([
    mapByBatches(inboundList, async inbound => {
      try {
        const detail = await getInbound(inbound.inboundId);
        return { listItem: inbound, detail };
      } catch (error) {
        console.error('입고 상세 조회 실패:', inbound?.inboundId, error);
        return null;
      }
    }),
    mapByBatches(outboundList, async outbound => {
      try {
        const detail = await fetchOutboundDetail(outbound.outboundId);
        return { listItem: outbound, detail };
      } catch (error) {
        console.error('출고 상세 조회 실패:', outbound?.outboundId, error);
        return null;
      }
    }),
  ]);

  const validInbounds = inboundDetails.filter(Boolean);
  const validOutbounds = outboundDetails.filter(Boolean);

  const rows = groupBy === 'store'
    ? aggregateInventoryByStore({ inbounds: validInbounds, outbounds: validOutbounds })
    : await aggregateInventoryByProduct({ inbounds: validInbounds, outbounds: validOutbounds });

  const filteredRows = rows
    .filter(row => {
      if (movementType === 'INBOUND') return row.inboundQty > 0;
      if (movementType === 'OUTBOUND') return row.outboundQty > 0;
      return true;
    })
    .sort((a, b) => {
      const left = b.inboundQty + b.outboundQty;
      const right = a.inboundQty + a.outboundQty;
      if (left !== right) return left - right;
      return a.name.localeCompare(b.name, 'ko-KR');
    });

  const summary = filteredRows.reduce(
    (acc, row) => {
      acc.totalInboundQty += row.inboundQty;
      acc.totalOutboundQty += row.outboundQty;
      return acc;
    },
    { totalInboundQty: 0, totalOutboundQty: 0, netQty: 0 },
  );
  summary.netQty = summary.totalInboundQty - summary.totalOutboundQty;

  return {
    rows: filteredRows,
    summary,
    totalRows: filteredRows.length,
  };
}

export async function fetchSalesReport({
  groupBy = 'product',
  storeKeyword = '',
  orderStatus = 'EXCLUDE_CANCELED',
  from = '',
  to = '',
} = {}) {
  const normalizedStoreKeyword = toSafeString(storeKeyword);
  const normalizedFrom = toSafeString(from);
  const normalizedTo = toSafeString(to);

  const shouldExcludeCanceled = orderStatus === 'EXCLUDE_CANCELED';
  const requestedStatus = shouldExcludeCanceled ? '' : toSafeString(orderStatus);

  const orders = await fetchAllPages(page =>
    fetchOrderPage({
      page,
      size: PAGE_SIZE,
      storeKeyword: normalizedStoreKeyword,
      status: requestedStatus,
      from: normalizedFrom,
      to: normalizedTo,
    }),
  );

  const filteredOrders = shouldExcludeCanceled
    ? orders.filter(order => order?.status !== 'CANCELED')
    : orders;

  const totalSalesAmount = filteredOrders.reduce((sum, order) => sum + toNumber(order?.totalAmount), 0);
  const totalOrderCount = filteredOrders.length;

  if (groupBy === 'store') {
    const rowMap = new Map();
    filteredOrders.forEach(order => {
      const storeId = toKey(order?.storeId);
      const name = order?.storeName || (storeId ? `매장 ${storeId}` : '-');
      const key = storeId || `store-name:${name}`;
      const row = rowMap.get(key) || {
        key,
        storeId: order?.storeId ?? null,
        name,
        salesAmount: 0,
        orderCount: 0,
        soldQty: 0,
      };

      row.salesAmount += toNumber(order?.totalAmount);
      row.orderCount += 1;
      rowMap.set(key, row);
    });

    const rows = Array.from(rowMap.values()).sort((a, b) => b.salesAmount - a.salesAmount);

    return {
      rows,
      summary: {
        totalSalesAmount,
        totalOrderCount,
        totalSoldQty: 0,
        totalGroupCount: rows.length,
      },
    };
  }

  const orderDetails = await mapByBatches(filteredOrders, async order => {
    try {
      return await fetchOrderDetail(order.orderId);
    } catch (error) {
      console.error('주문 상세 조회 실패:', order?.orderId, error);
      return null;
    }
  });

  const validDetails = orderDetails.filter(Boolean);
  const rowMap = new Map();
  let totalSoldQty = 0;

  validDetails.forEach(order => {
    const orderProductSet = new Set();

    (order?.items || []).forEach(item => {
      const productId = toNumber(item?.productId);
      if (productId <= 0) return;

      const key = String(productId);
      const row = rowMap.get(key) || {
        key,
        productId,
        name: item?.productName || `상품 ${productId}`,
        salesAmount: 0,
        soldQty: 0,
        orderCount: 0,
      };

      const quantity = toNumber(item?.qty);
      const amount = item?.amount !== null && item?.amount !== undefined
        ? toNumber(item?.amount)
        : toNumber(item?.unitPrice) * quantity;

      row.soldQty += quantity;
      row.salesAmount += amount;
      totalSoldQty += quantity;

      if (!orderProductSet.has(productId)) {
        row.orderCount += 1;
        orderProductSet.add(productId);
      }

      rowMap.set(key, row);
    });
  });

  const rows = Array.from(rowMap.values()).sort((a, b) => b.salesAmount - a.salesAmount);

  return {
    rows,
    summary: {
      totalSalesAmount,
      totalOrderCount,
      totalSoldQty,
      totalGroupCount: rows.length,
    },
  };
}

async function fetchPayrollByUserAndMonth(userId, year, month) {
  const response = await api.get('/api/salary/calculate', {
    params: {
      userId,
      year,
      month,
    },
  });

  return response.data;
}

export async function fetchPayrollReport({
  year,
  month,
  storeKeyword = '',
  employmentType = '',
} = {}) {
  const parsedYear = toNumber(year) || new Date().getFullYear();
  const parsedMonth = toNumber(month) || new Date().getMonth() + 1;
  const normalizedStoreKeyword = toSafeString(storeKeyword);
  const normalizedEmploymentType = toSafeString(employmentType);
  const paymentDate = buildLastDayOfMonth(parsedYear, parsedMonth);

  const users = await fetchAllPages(page =>
    fetchUserPage({
      page,
      size: PAGE_SIZE,
      status: 'ACTIVE',
      storeKeyword: normalizedStoreKeyword,
    }),
  );

  const targetUsers = users.filter(user =>
    user?.storeId &&
    STORE_EMPLOYEE_ROLES.has(user?.role),
  );

  const payrollRows = await mapByBatches(targetUsers, async user => {
    try {
      const payroll = await fetchPayrollByUserAndMonth(user.id, parsedYear, parsedMonth);
      return {
        userId: user.id,
        employeeCode: user.employeeCode || '-',
        employeeName: user.name || '-',
        storeId: user.storeId,
        storeName: user.storeName || `매장 ${user.storeId}`,
        payrollType: payroll?.type || null,
        baseAmount: payroll?.baseWage ?? null,
        thisMonthPay: payroll?.totalPay ?? null,
        paymentDate,
        hasSalary: true,
      };
    } catch (error) {
      const message = error?.response?.data?.message || '';
      if (message) {
        console.warn(`급여 계산 실패: userId=${user.id}, message=${message}`);
      } else {
        console.warn(`급여 계산 실패: userId=${user.id}`, error);
      }

      return {
        userId: user.id,
        employeeCode: user.employeeCode || '-',
        employeeName: user.name || '-',
        storeId: user.storeId,
        storeName: user.storeName || `매장 ${user.storeId}`,
        payrollType: null,
        baseAmount: null,
        thisMonthPay: null,
        paymentDate,
        hasSalary: false,
      };
    }
  });

  const filteredRows = payrollRows
    .filter(row => (normalizedEmploymentType ? row.payrollType === normalizedEmploymentType : true))
    .sort((a, b) => {
      const storeCompare = (a.storeName || '').localeCompare(b.storeName || '', 'ko-KR');
      if (storeCompare !== 0) return storeCompare;
      return (a.employeeName || '').localeCompare(b.employeeName || '', 'ko-KR');
    });

  const groupedMap = new Map();
  filteredRows.forEach(row => {
    const key = toKey(row.storeId);
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        storeId: row.storeId,
        storeName: row.storeName,
        rows: [],
      });
    }
    groupedMap.get(key).rows.push(row);
  });

  const stores = Array.from(groupedMap.values()).sort((a, b) =>
    (a.storeName || '').localeCompare(b.storeName || '', 'ko-KR'),
  );

  const summary = filteredRows.reduce(
    (acc, row) => {
      acc.totalEmployeeCount += 1;
      if (!row.hasSalary) {
        acc.missingSalaryCount += 1;
      }
      acc.totalPayrollAmount += toNumber(row.thisMonthPay);
      return acc;
    },
    {
      totalEmployeeCount: 0,
      totalPayrollAmount: 0,
      missingSalaryCount: 0,
    },
  );

  return {
    rows: filteredRows,
    stores,
    summary,
  };
}
