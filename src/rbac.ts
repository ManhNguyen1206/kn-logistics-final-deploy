// ============================================
// RBAC System for KN Logistics
// ============================================

// Types
export type UserRole = 'admin' | 'accountant' | 'store_manager' | 'supplier';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  storeIds?: string[]; // Cửa hàng phụ trách (cho store_manager/accountant)
  accountantStores?: string[]; // Cửa hàng kế toán phụ trách
  supplierCategories?: string[]; // Danh mục cung cấp (cho supplier)
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
  resourceStoreId: string
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

  // Cung ứng: xem tất cả requests của họ
  if (user.role === 'supplier') {
    return { canView: true, allowedStoreIds: ['*'] };
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
// Get Current User from Login
// ============================================
export const getCurrentUser = (): User | null => {
  const loginData = localStorage.getItem('loginData');
  if (!loginData) return null;

  try {
    const data = JSON.parse(loginData);
    return data;
  } catch {
    return null;
  }
};

// ============================================
// Validate Login Credentials
// ============================================
export const validateLogin = (role: UserRole, username: string, password: string): User | null => {
  // Admin
  if (role === 'admin') {
    if (username === 'admin' && password === 'admin123') {
      return {
        id: 'admin-001',
        name: 'Quản trị viên',
        role: 'admin',
      };
    }
    return null;
  }

  // Accountants
  const accountants: Record<string, { id: string; name: string; password: string; storeIds: string[] }> = {
    'sang': { id: 'KT_SANG', name: 'Sang', password: '123', storeIds: ['CH_PHUOCLONG'] },
    'minh': { id: 'KT_MINH', name: 'Minh', password: '123', storeIds: ['CH_PHUSON'] },
    'yen': { id: 'KT_YEN', name: 'Yến', password: '123', storeIds: ['CH_BOMBO'] },
  };

  if (role === 'accountant') {
    const acc = accountants[username.toLowerCase()];
    if (acc && acc.password === password) {
      return {
        id: acc.id,
        name: acc.name,
        role: 'accountant',
        accountantStores: acc.storeIds,
      };
    }
    return null;
  }

  // Stores
  const stores: Record<string, { id: string; name: string; password: string }> = {
    'phuoc-long': { id: 'CH_PHUOCLONG', name: 'Cửa hàng Phước Long', password: '123' },
    'phu-son': { id: 'CH_PHUSON', name: 'Cửa hàng Phú Sơn', password: '123' },
    'bombo': { id: 'CH_BOMBO', name: 'Cửa hàng BomBo', password: '123' },
  };

  if (role === 'store_manager') {
    // Map display names to store keys
    const displayToKey: Record<string, string> = {
      'Phước Long': 'phuoc-long',
      'Phú Sơn': 'phu-son',
      'BomBo': 'bombo',
    };

    const key = displayToKey[username] || username.toLowerCase().replace(/\s+/g, '-');
    const store = stores[key];
    if (store && store.password === password) {
      return {
        id: store.id,
        name: store.name,
        role: 'store_manager',
        storeIds: [store.id],
      };
    }
    return null;
  }

  // Suppliers
  const suppliers: Record<string, { id: string; name: string; password: string }> = {
    'supplier1': { id: 'SUP_001', name: 'Supplier 1', password: '123' },
    'supplier2': { id: 'SUP_002', name: 'Supplier 2', password: '123' },
    'supplier3': { id: 'SUP_003', name: 'Supplier 3', password: '123' },
  };

  if (role === 'supplier') {
    const supplierKey = username.toLowerCase().replace(/\s+/g, '');
    const supplier = suppliers[supplierKey];
    if (supplier && supplier.password === password) {
      return {
        id: supplier.id,
        name: supplier.name,
        role: 'supplier',
        supplierCategories: [],
      };
    }
    return null;
  }

  return null;
};

// ============================================
// Get Usernames by Role
// ============================================
export const getUsernamesByRole = (role: UserRole): string[] => {
  if (role === 'admin') {
    return ['admin'];
  }
  if (role === 'accountant') {
    return ['Sang', 'Minh', 'Yến'];
  }
  if (role === 'store_manager') {
    return ['Phước Long', 'Phú Sơn', 'BomBo'];
  }
  if (role === 'supplier') {
    return ['Supplier 1', 'Supplier 2', 'Supplier 3'];
  }
  return [];
};

// ============================================
// Role Display Names
// ============================================
export const getRoleDisplayName = (role: UserRole): string => {
  const names: Record<UserRole, string> = {
    admin: 'Quản trị viên',
    store_manager: 'Quản lý Cửa hàng',
    accountant: 'Kế toán',
    supplier: 'Cung ứng',
  };
  return names[role];
};
