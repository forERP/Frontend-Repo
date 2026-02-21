import { isStoreAdminRole } from '../utils/auth';

const STORE_ADMIN_HIDDEN_TOP_KEYS = new Set(['logs']);

const STORE_ADMIN_HIDDEN_CHILD_KEYS = new Set([
  'product-new',
  'product-bundle-new',
  'product-category-new',
  'store-create',
  'warehouse-create',
  'suppliers-create',
]);

export const getMenusByRole = (menus, role) => {
  if (!Array.isArray(menus) || !isStoreAdminRole(role)) {
    return Array.isArray(menus) ? menus : [];
  }

  return menus
    .filter(menu => !STORE_ADMIN_HIDDEN_TOP_KEYS.has(menu.key))
    .map(menu => {
      if (!Array.isArray(menu.children)) {
        return menu;
      }

      const filteredChildren = menu.children.filter(
        child => !STORE_ADMIN_HIDDEN_CHILD_KEYS.has(child.key),
      );

      return {
        ...menu,
        children: filteredChildren,
      };
    })
    .filter(menu => !Array.isArray(menu.children) || menu.children.length > 0);
};
