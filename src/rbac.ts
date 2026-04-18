// ============================================
// RBAC System for KN Logistics
// ============================================

// Types
export type UserRole = 'admin' | 'accountant' | 'store_manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  storeIds?: string[]; // Cửa hàng phụ trách (cho store_manager/accountant)
  accountantStores?: string[]; // Cửa hàng kế toán phụ trách
}

export interface PermissionCheck {
  canView: boolean;
  allowedStoreIds: string[];
}

// ============================================
// Permission Checker
// ============================================
export const checkPermission = (
  user: User | null,
  resourceStoreId: string,
  resourceType: 'transaction' | 'fund_ledger' | 'follow_up'
): PermissionCheck => {
  if (!user) {
    return { canView: false, allowedStoreIds: [] };
  }

  // Admin có quyền xem tất cả
  if (user.role === 'admin') {
    return { canView: true, allowedStoreIds: ['*'] };
  }

  // Cửa hàng: chỉ xem cửa hàng của mình
  if (user.role === 'store_manager') {
    const allowed = user.storeIds || [];
    const canView = allowed.includes(resourceStoreId);
    return { canView, allowedStoreIds: allowed };
  }

  // Kế toán: xem cửa hàng phụ trách
  if (user.role === 'accountant') {
    const allowed = user.accountantStores || [];
    const canView = allowed.includes(resourceStoreId);
    return { canView, allowedStoreIds: allowed };
  }

  return { canView: false, allowedStoreIds: [] };
};

// ============================================
// Data Filter by Permission
// ============================================
export const filterDataByPermission = (
  data: any[],
  user: User | null,
  storeIdField: string = 'storeId'
): any[] => {
  if (!user) return [];
  
  if (user.role === 'admin') {
    return data; // Admin thấy tất cả
  }

  const allowedStores = 
    user.role === 'store_manager' 
      ? (user.storeIds || [])
      : (user.accountantStores || []);

  return data.filter(item => allowedStores.includes(item[storeIdField]));
};

// ============================================
// Mock Current User (để test)
// ============================================
export const getCurrentUser = (): User => {
  // Trong production: lấy từ Firebase Auth + Firestore user document
  // Hiện tại: mock data
  const userRole = localStorage.getItem('userRole') as UserRole || 'admin';
  
  const users: Record<UserRole, User> = {
    admin: {
      id: 'admin-001',
      name: 'Quản trị viên',
      role: 'admin',
    },
    store_manager: {
      id: 'sm-001',
      name: 'Quản lý Cửa hàng BomBo',
      role: 'store_manager',
      storeIds: ['cua-hang-bombo'],
    },
    accountant: {
      id: 'acc-001',
      name: 'Kế toán Linh',
      role: 'accountant',
      accountantStores: ['cua-hang-bombo', 'cua-hang-khac'],
    },
  };

  return users[userRole];
};

// ============================================
// Role Display Names
// ============================================
export const getRoleDisplayName = (role: UserRole): string => {
  const names: Record<UserRole, string> = {
    admin: 'Quản trị viên',
    store_manager: 'Quản lý Cửa hàng',
    accountant: 'Kế toán',
  };
  return names[role];
};
