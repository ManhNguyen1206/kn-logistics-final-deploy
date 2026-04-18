// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, CheckCircle, Clock, Package, AlertCircle, FileText, ArrowRight, Database, RefreshCw, Lock, Unlock, UserPlus, MapPin, Download, FileUp, Paperclip, Upload, Settings, Bell, X } from 'lucide-react';
import { getCurrentUser, filterDataByPermission, UserRole, validateLogin, getUsernamesByRole, getIdsByRole } from './rbac';
import type { User } from './rbac';

// ============================================================================
// BƯỚC 1: CẤU HÌNH DATABASE FIREBASE
// ============================================================================
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWQUm1ZmcHkScjh7sjM2uQb0YxrEwtDs8",
  authDomain: "kn-logistics.firebaseapp.com",
  projectId: "kn-logistics",
  storageBucket: "kn-logistics.firebasestorage.app",
  messagingSenderId: "1067718029881",
  appId: "1:1067718029881:web:7c2fa796f116220823d3e8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = 'kn-logistics-v1'; 
const getPublicCol = (colName: string) => collection(db, 'artifacts', appId, 'public', 'data', colName);
const getPublicDoc = (colName: string, docId: string) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

// ============================================================================
// ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU
// ============================================================================
interface Product { id: string; name: string; }
interface Accountant { id: string; name: string; password?: string; }
interface Store { id: string; name: string; accountantId: string; password?: string; }
interface ReceiptItem { product: Product; quantity: number; note: string; condition?: string; }
interface Receipt {
  id: string; date: string; creator: string; storeId: string; accountantId: string;
  items: ReceiptItem[]; status: string; accNotes: string; generalNote: string; erpId: string;
  invoice?: { name: string, url: any };
}
interface Notification {
  id: string; accountantId: string; receiptId: string; storeId: string; storeName: string;
  createdAt: string; isRead: boolean; type: string;
}
interface Transaction {
  id: string; type: 'chi' | 'thu'; amount: number; note: string; date: string;
  storeId: string; storeName: string; creator: string;
}
interface Supplier {
  id: string; name: string; password?: string; createdAt?: string;
}
interface InvoiceRequest {
  id: string; storeId: string; supplierId?: string; amount: number; note?: string;
  status: string; createdAt?: string; submittedAt?: string;
}

const STATUSES: any = {
  NEW: { id: 'NEW', label: 'Mới gửi', color: 'bg-blue-100 text-blue-800' },
  RECEIVED: { id: 'RECEIVED', label: 'Đã tiếp nhận', color: 'bg-yellow-100 text-yellow-800' },
  WAITING_INVOICE: { id: 'WAITING_INVOICE', label: 'Chờ hóa đơn', color: 'bg-orange-100 text-orange-800' },
  INVOICE_PROVIDED: { id: 'INVOICE_PROVIDED', label: 'Đã có hóa đơn', color: 'bg-purple-100 text-purple-800' },
  COMPLETED: { id: 'COMPLETED', label: 'Đã nhập ERP', color: 'bg-green-100 text-green-800' }
};

const ITEM_CONDITIONS: any = {
  'NORMAL': { label: 'Bình thường', color: 'bg-emerald-100 text-emerald-800 border-emerald-400', icon: '✓' },
  'DENTED': { label: 'Móp méo', color: 'bg-amber-100 text-amber-800 border-amber-400', icon: '⚠' },
  'NEAR_DATE': { label: 'Cận date', color: 'bg-orange-100 text-orange-800 border-orange-400', icon: '📅' },
  'DAMAGED': { label: 'Hư hỏng', color: 'bg-red-100 text-red-800 border-red-400', icon: '❌' },
  'WRONG_PKG': { label: 'Sai bao bì', color: 'bg-indigo-100 text-indigo-800 border-indigo-400', icon: '📦' }
};

const INITIAL_ACCOUNTANTS = [
  { id: 'KT_SANG', name: 'Sang', password: '123' },
  { id: 'KT_MINH', name: 'Minh', password: '123' },
  { id: 'KT_YEN', name: 'Yến', password: '123' },
];

const INITIAL_STORES = [
  { id: 'CH_PHUOCLONG', name: 'Cửa hàng Phước Long', accountantId: 'KT_SANG', password: '123' },
  { id: 'CH_PHUSON', name: 'Cửa hàng Phú Sơn', accountantId: 'KT_MINH', password: '123' },
  { id: 'CH_BOMBO', name: 'Cửa hàng BomBo', accountantId: 'KT_YEN', password: '123' },
];

// --- COMPONENT TÌM KIẾM ---
const ProductSearch = ({ onSelect, products }: { onSelect: (p: Product) => void, products: Product[] }) => {
  const [queryVal, setQueryVal] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: any) => {
    const value = e.target.value;
    setQueryVal(value);
    if (value.length > 0) {
      const filtered = products.filter((p) => 
        p.name.toLowerCase().includes(value.toLowerCase()) || p.id.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered.slice(0, 15));
      setIsOpen(true);
    } else setIsOpen(false);
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    setQueryVal('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="w-full p-3 pl-10 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
          placeholder="Tìm mã hoặc tên vật tư..."
          value={queryVal}
          onChange={handleSearch}
          onClick={() => queryVal.length > 0 && setIsOpen(true)}
        />
        <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
      </div>
      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto divide-y divide-gray-100">
          {results.map((product) => (
            <li key={product.id} onClick={() => handleSelect(product)} className="p-3 hover:bg-green-50 cursor-pointer transition-colors flex justify-between items-center">
              <div className="font-medium text-gray-800 text-sm">{product.name}</div>
              <div className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{product.id}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function App() {
  // LOGIN SYSTEM
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState<User | null>(null);
  const [loginRole, setLoginRole] = useState<UserRole>('admin');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [role, setRole] = useState('CUAHANG');
  const [toastMsg, setToastMsg] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isDBReady, setIsDBReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testUserRole, setTestUserRole] = useState<UserRole>('admin');

  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [systemPwd, setSystemPwd] = useState('Manhaa123@');

  const [isMappingAuth, setIsMappingAuth] = useState(false);
  const [inputPwd, setInputPwd] = useState('');

  const [myStoreId, setMyStoreId] = useState('');
  const [myAccId, setMyAccId] = useState('');
  const [isStoreAuth, setIsStoreAuth] = useState(false);
  const [storePwdInput, setStorePwdInput] = useState('');
  const [isAccAuth, setIsAccAuth] = useState(false);
  const [accPwdInput, setAccPwdInput] = useState('');
  const [isSupplyAuth, setIsSupplyAuth] = useState(false);
  const [supplyPwdInput, setSupplyPwdInput] = useState('');

  const [newProdId, setNewProdId] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const fileImportRef = useRef<HTMLInputElement>(null);
  const [currentItems, setCurrentItems] = useState<ReceiptItem[]>([]);
  const [generalNote, setGeneralNote] = useState('');

  const [newAccId, setNewAccId] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccPwd, setNewAccPwd] = useState('');
  const [newStoreId, setNewStoreId] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAccId, setNewStoreAccId] = useState('');
  const [newStorePwd, setNewStorePwd] = useState('');

  // Supplier management
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPwd, setNewSupplierPwd] = useState('');
  const [invoiceRequests, setInvoiceRequests] = useState<any[]>([]);
  const [selectedInvoiceRequest, setSelectedInvoiceRequest] = useState<any>(null);

  const [filterStore, setFilterStore] = useState('');
  const [filterAcc, setFilterAcc] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterReceiptId, setFilterReceiptId] = useState('');
  const [filterReceiptStatus, setFilterReceiptStatus] = useState('');

  // NEW FEATURES
  const [selectedReceiptModal, setSelectedReceiptModal] = useState<Receipt | null>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isChangePasswordModal, setIsChangePasswordModal] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [deleteReceiptId, setDeleteReceiptId] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // SPLIT RECEIPT FEATURE
  const [splitReceiptId, setSplitReceiptId] = useState('');
  const [splitNote, setSplitNote] = useState('');
  const [selectedItemsWithInvoice, setSelectedItemsWithInvoice] = useState<number[]>([]);


  // NOTIFICATION FEATURE
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);

  // RELOAD DATA FEATURE
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  // TRANSACTIONS (CHI/THU) FEATURE
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionType, setTransactionType] = useState<'chi' | 'thu'>('chi');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [keToanTabIndex, setKeToanTabIndex] = useState(0); // 0: Nhập hàng, 1: Chi/Thu
  const [filterTransactionType, setFilterTransactionType] = useState('');

  // Check for existing login on mount
  useEffect(() => {
    const loginData = localStorage.getItem('loginData');
    if (loginData) {
      try {
        const userData = JSON.parse(loginData);
        setLoginUser(userData);
        setIsLoggedIn(true);

        // Auto-navigate and setup based on role
        if (userData.role === 'store_manager') {
          setRole('CUAHANG');
          // Auto-login to store
          const storeId = userData.storeIds?.[0];
          if (storeId) {
            setMyStoreId(storeId);
            setIsStoreAuth(true);
          }
        } else if (userData.role === 'accountant') {
          setRole('KETOAN');
        } else if (userData.role === 'admin') {
          setRole('TRACKING');
        }
      } catch (e) {
        localStorage.removeItem('loginData');
      }
    }
  }, []);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Lỗi Auth:", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubP = onSnapshot(getPublicCol('products'), (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
    });

    const unsubR = onSnapshot(getPublicCol('receipts'), (s) => {
      const l = s.docs.map(d => ({ id: d.id, ...d.data() })) as Receipt[];
      setReceipts(l);
    });

    const unsubS = onSnapshot(getPublicCol('stores'), (s) => {
      setStores(s.docs.map(d => ({ id: d.id, ...d.data() })) as Store[]);
    });

    const unsubA = onSnapshot(getPublicCol('accountants'), (s) => {
      setAccountants(s.docs.map(d => ({ id: d.id, ...d.data() })) as Accountant[]);
    });

    // Listen for suppliers
    const unsubSup = onSnapshot(getPublicCol('suppliers'), (s) => {
      setSuppliers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen for invoice requests
    const unsubInvoiceReq = onSnapshot(getPublicCol('invoiceRequests'), (s) => {
      setInvoiceRequests(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubSys = onSnapshot(getPublicDoc('system', 'config'), (s) => {
      if (s.exists()) setSystemPwd(s.data().adminPassword);
    });

    // Listen for transactions
    const unsubT = onSnapshot(getPublicCol('transactions'), (s) => {
      setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[]);
    });

    // Listen for notifications
    let unsubNotif: any = null;
    if (isMappingAuth && myAccId) {
      unsubNotif = onSnapshot(getPublicCol('notifications'), (s) => {
        const allNotifs = s.docs.map(d => ({ id: d.id, ...d.data() })) as Notification[];
        const myNotifs = allNotifs.filter(n => n.accountantId === myAccId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setNotifications(myNotifs);
        setUnreadCount(myNotifs.filter(n => !n.isRead).length);

        // Show toast for new unread notifications
        const unreadNotif = myNotifs.find(n => !n.isRead);
        if (unreadNotif) setToastNotification(unreadNotif);
      });
    }

    setIsDBReady(true);
    setIsReloading(false);
    return () => { unsubP(); unsubR(); unsubS(); unsubA(); unsubSup(); unsubInvoiceReq(); unsubSys(); unsubT(); unsubNotif && unsubNotif(); };
  }, [user, reloadTrigger]);

  useEffect(() => { if (!myStoreId && stores.length > 0) setMyStoreId(stores[0].id); }, [stores]);
  useEffect(() => { if (!myAccId && accountants.length > 0) setMyAccId(accountants[0].id); }, [accountants]);

  // Auto-auth store_manager when they log in
  useEffect(() => {
    if (loginUser?.role === 'store_manager' && loginUser?.storeIds && loginUser.storeIds.length > 0 && !isStoreAuth) {
      setMyStoreId(loginUser.storeIds[0]);
      setIsStoreAuth(true);
    }
  }, [loginUser, isStoreAuth]);

  // Auto-auth accountant when they log in
  useEffect(() => {
    if (loginUser?.role === 'accountant' && loginUser?.accountantStores && loginUser.accountantStores.length > 0 && !isAccAuth) {
      setMyAccId(loginUser.id);
      setIsAccAuth(true);
    }
  }, [loginUser, isAccAuth]);

  // Auto dismiss toast notification after 5 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 4000); };

  // LOGIN HANDLER
  const handleLogin = () => {
    setLoginError('');
    if (!loginUsername || !loginPassword) {
      setLoginError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    const validatedUser = validateLogin(loginRole, loginUsername, loginPassword);
    if (!validatedUser) {
      setLoginError('Sai tên đăng nhập hoặc mật khẩu!');
      return;
    }

    setLoginUser(validatedUser);
    setIsLoggedIn(true);
    localStorage.setItem('loginData', JSON.stringify(validatedUser));
    setLoginUsername('');
    setLoginPassword('');
    showToast(`✅ Đăng nhập thành công! Xin chào ${validatedUser.name}`);

    // Auto-navigate based on role
    if (validatedUser.role === 'store_manager') {
      setRole('CUAHANG');
      // Auto-login to store
      const storeId = validatedUser.storeIds?.[0];
      if (storeId) {
        const storeName = stores.find(s => s.id === storeId)?.name || '';
        setMyStoreId(storeId);
        setIsStoreAuth(true);
      }
    } else if (validatedUser.role === 'accountant') {
      setRole('KETOAN');
    } else if (validatedUser.role === 'supplier') {
      setRole('QUANLYHOADON');
    } else if (validatedUser.role === 'admin') {
      setRole('TRACKING');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUser(null);
    setLoginRole('admin');
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    setRole('CUAHANG');
    setIsStoreAuth(false);
    localStorage.removeItem('loginData');
    showToast('✅ Đã đăng xuất!');
  };

  const handleMarkNotificationAsRead = async (notifId: string) => {
    if (!user) return;
    try {
      await updateDoc(getPublicDoc('notifications', notifId), { isRead: true });
    } catch (e: any) {
      console.error('Lỗi đánh dấu đã đọc:', e.message);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    if (!user) return;
    try {
      await deleteDoc(getPublicDoc('notifications', notifId));
    } catch (e: any) {
      console.error('Lỗi xóa thông báo:', e.message);
    }
  };

  const handleReloadData = () => {
    setIsReloading(true);
    setReloadTrigger(prev => prev + 1);
    showToast('🔄 Đang tải lại dữ liệu...');
  };

  const handleDeleteReceipt = async (receiptId: string, password: string) => {
    if (password !== systemPwd) {
      alert('❌ Sai mật khẩu Admin!');
      return;
    }
    if (!user) return;
    try {
      await deleteDoc(getPublicDoc('receipts', receiptId));
      setDeleteReceiptId('');
      setDeletePassword('');
      showToast('✅ Xóa phiếu thành công!');
    } catch (e: any) {
      alert('Lỗi xóa phiếu: ' + e.message);
    }
  };

  const handleChangeAdminPassword = async () => {
    if (!newAdminPassword || !confirmAdminPassword) {
      alert('Vui lòng điền đầy đủ mật khẩu!');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      alert('Mật khẩu không khớp!');
      return;
    }
    if (!user) return;
    try {
      await setDoc(getPublicDoc('system', 'config'), { adminPassword: newAdminPassword });
      setSystemPwd(newAdminPassword);
      setIsChangePasswordModal(false);
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      showToast('✅ Đổi mật khẩu Admin thành công!');
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleSplitReceipt = async () => {
    if (selectedItemsWithInvoice.length === 0 || !splitReceiptId || !user) {
      alert('Vui lòng chọn ít nhất 1 mã hàng có H.Đ!');
      return;
    }

    try {
      const originalReceipt = receipts.find(r => r.id === splitReceiptId);
      if (!originalReceipt) return;

      const itemsWithInvoice = originalReceipt.items.filter((_, idx) => selectedItemsWithInvoice.includes(idx));
      const itemsWithoutInvoice = originalReceipt.items.filter((_, idx) => !selectedItemsWithInvoice.includes(idx));

      const now = new Date();
      const currentDateTime = now.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$2-$1');

      const newIdWithInvoice = `${originalReceipt.id}-FULL`;
      const newIdWithoutInvoice = `${originalReceipt.id}-WAITING`;

      // Create receipt with invoices (sử dụng ngày hiện tại)
      await setDoc(getPublicDoc('receipts', newIdWithInvoice), {
        id: newIdWithInvoice,
        date: currentDateTime,
        creator: originalReceipt.creator,
        storeId: originalReceipt.storeId,
        accountantId: originalReceipt.accountantId,
        items: itemsWithInvoice,
        status: 'WAITING_INVOICE',
        accNotes: `[CÓ H.Đ] ${originalReceipt.accNotes || ''}\n📋 ${itemsWithInvoice.length} mã có hoá đơn`,
        generalNote: originalReceipt.generalNote,
        erpId: originalReceipt.erpId
      });

      // Create receipt without invoices (with notes - sử dụng ngày hiện tại)
      await setDoc(getPublicDoc('receipts', newIdWithoutInvoice), {
        id: newIdWithoutInvoice,
        date: currentDateTime,
        creator: originalReceipt.creator,
        storeId: originalReceipt.storeId,
        accountantId: originalReceipt.accountantId,
        items: itemsWithoutInvoice,
        status: 'WAITING_INVOICE',
        accNotes: `[CHƯA CÓ H.Đ] ${splitNote || 'Đang theo dõi'}\n📋 ${itemsWithoutInvoice.length} mã chờ hoá đơn\n📅 Ngày gốc: ${originalReceipt.date}\n📅 Ngày tách: ${currentDateTime}`,
        generalNote: originalReceipt.generalNote,
        erpId: originalReceipt.erpId
      });

      // Delete original receipt
      await deleteDoc(getPublicDoc('receipts', splitReceiptId));

      setSplitReceiptId('');
      setSplitNote('');
      setSelectedItemsWithInvoice([]);
      showToast(`✅ Tách phiếu thành công! ${newIdWithInvoice} (${itemsWithInvoice.length}M) + ${newIdWithoutInvoice} (${itemsWithoutInvoice.length}M) - Phiếu mới sẽ hiện ở trên!`);
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleInitDatabase = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      INITIAL_ACCOUNTANTS.forEach(a => batch.set(getPublicDoc('accountants', a.id), a));
      INITIAL_STORES.forEach(s => batch.set(getPublicDoc('stores', s.id), s));
      await batch.commit();
      showToast("Khởi tạo Database thành công!");
    } catch (e: any) { alert(e.message); }
    setIsSyncing(false);
  };

  const handleLoginMapping = () => {
    if (inputPwd === systemPwd) { setIsMappingAuth(true); setInputPwd(''); } 
    else alert('Sai mật khẩu!');
  };

  const handleAddProduct = async () => {
    if (!user || !newProdId || !newProdName) return;
    await setDoc(getPublicDoc('products', newProdId.toUpperCase()), { id: newProdId.toUpperCase(), name: newProdName });
    setNewProdId(''); setNewProdName('');
    showToast('Đã thêm vật tư');
  };

  const handleAddAccountant = async () => {
    if (!user || !newAccId || !newAccName || !newAccPwd) return;
    await setDoc(getPublicDoc('accountants', newAccId.toUpperCase()), {
      id: newAccId.toUpperCase(), name: newAccName, password: newAccPwd
    });
    setNewAccId(''); setNewAccName(''); setNewAccPwd('');
    showToast('Đã thêm kế toán');
  };

  const handleAddStore = async () => {
    if (!user || !newStoreId || !newStoreName || !newStoreAccId || !newStorePwd) return;
    await setDoc(getPublicDoc('stores', newStoreId.toUpperCase()), {
      id: newStoreId.toUpperCase(), name: newStoreName, accountantId: newStoreAccId, password: newStorePwd
    });
    setNewStoreId(''); setNewStoreName(''); setNewStorePwd('');
    showToast('Đã thêm cửa hàng');
  };

  const handleImportCSV = (e: any) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setIsSyncing(true);

    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      try {
        const text = evt.target.result;
        const rows = text.split(/\r?\n/);
        
        if (rows.length < 2) throw new Error("File quá ngắn hoặc trống.");

        // Tự động phát hiện dấu phân cách là Phẩy (,) hay Chấm phẩy (;)
        const delimiter = rows[0].indexOf(';') > -1 ? ';' : ',';
        const uniqueProducts = new Map();
        let skipped = 0;

        for (let i = 1; i < rows.length; i++) {
          const line = rows[i].trim();
          if (!line) continue;

          let cols = [];
          let curVal = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            let char = line[j];
            if (inQuotes) {
              if (char === '"') {
                if (j + 1 < line.length && line[j + 1] === '"') {
                  curVal += '"';
                  j++;
                } else {
                  inQuotes = false;
                }
              } else {
                curVal += char;
              }
            } else {
              if (char === '"') {
                inQuotes = true;
              } else if (char === delimiter) {
                cols.push(curVal.trim());
                curVal = '';
              } else {
                curVal += char;
              }
            }
          }
          cols.push(curVal.trim());

          if (cols.length >= 2) {
            // LÀM SẠCH MÃ HÀNG: Cực kỳ quan trọng để Firebase không báo lỗi (xóa / \ . và khoảng trắng)
            let id = cols[0].toUpperCase().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^"|"$/g, '').trim();
            id = id.replace(/[\/\\.\s]+/g, '-'); 
            
            // Lấy tên hàng (Gộp lại nếu file có nhiều hơn 2 cột do lỗi dấu phẩy)
            let name = cols.slice(1).join(delimiter).replace(/^"|"$/g, '').trim();
            
            if (id && name) {
              if (uniqueProducts.has(id)) {
                skipped++; // Đếm số dòng bị trùng mã
              }
              uniqueProducts.set(id, { id, name });
            } else {
              skipped++; // Dòng thiếu ID hoặc Tên
            }
          } else {
            skipped++; // Dòng không đủ 2 cột
          }
        }

        let imported = Array.from(uniqueProducts.values());

        if (imported.length > 0) {
          if (imported.length > 2000) {
            alert(`File chứa ${imported.length} mã hợp lệ. Hệ thống chỉ import tối đa 2000 mã/lần.`);
            imported = imported.slice(0, 2000);
          }

          // Xóa danh sách cũ (Chia nhỏ gói 400 để an toàn tuyệt đối với giới hạn của Firebase)
          if (products.length > 0) {
            const deleteChunks = [];
            for (let i = 0; i < products.length; i += 400) {
              deleteChunks.push(products.slice(i, i + 400));
            }
            for (const chunk of deleteChunks) {
              const batch = writeBatch(db);
              chunk.forEach(p => batch.delete(getPublicDoc('products', p.id)));
              await batch.commit();
            }
          }

          // Thêm danh sách mới
          const chunks = [];
          for (let i = 0; i < imported.length; i += 400) {
            chunks.push(imported.slice(i, i + 400));
          }

          for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(p => batch.set(getPublicDoc('products', p.id), p));
            await batch.commit();
          }
          
          alert(`CẬP NHẬT THÀNH CÔNG!\n- Đã tải lên: ${imported.length} mã hàng.\n- Bỏ qua: ${skipped} dòng (do trùng mã hoặc bị trống).`);
          showToast(`Đã ghi đè thành công ${imported.length} mã hàng!`);
        } else {
          alert("Không tìm thấy dữ liệu hợp lệ. Đảm bảo Cột 1 là Mã hàng, Cột 2 là Tên hàng hóa.");
        }
      } catch (err: any) {
        console.error("Lỗi Import:", err);
        alert("Có lỗi xảy ra khi đọc file: " + err.message);
      } finally {
        setIsSyncing(false);
        if (fileImportRef.current) fileImportRef.current.value = '';
      }
    };
    reader.onerror = () => {
      alert("Hệ thống từ chối đọc file này!");
      setIsSyncing(false);
    };
    reader.readAsText(file);
  };

  const handleSubmitReceipt = async () => {
    if (!user || currentItems.length === 0) return;
    const now = new Date();
    const dateStr = now.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const timeMs = now.getTime().toString().slice(-6);
    const newId = `PNH-${timeMs}`;
    const store = stores.find(s => s.id === myStoreId);
    if (!store) return;
    const data = {
      id: newId, date: dateStr, creator: store.name,
      storeId: store.id, accountantId: store.accountantId, items: currentItems,
      status: 'NEW', accNotes: '', generalNote, erpId: '', costs: { transport: 0, handling: 0 }
    };
    await setDoc(getPublicDoc('receipts', newId), data);

    // Create notification for accountant
    const notifId = `notif-${newId}-${Date.now()}`;
    const notifData: Notification = {
      id: notifId,
      accountantId: store.accountantId,
      receiptId: newId,
      storeId: store.id,
      storeName: store.name,
      createdAt: new Date().toLocaleString('vi-VN'),
      isRead: false,
      type: 'NEW_RECEIPT'
    };
    await setDoc(getPublicDoc('notifications', notifId), notifData);

    setCurrentItems([]); setGeneralNote('');
    showToast(`Đã gửi thành công báo cáo ${newId}`);
  };

  const handleSubmitTransaction = async () => {
    if (!user || !transactionAmount || !myStoreId) return;
    const now = new Date();
    const dateStr = now.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const timeMs = now.getTime().toString().slice(-6);
    const newId = `${transactionType === 'chi' ? 'CHI' : 'THU'}-${timeMs}`;
    const store = stores.find(s => s.id === myStoreId);
    if (!store) return;
    const data: Transaction = {
      id: newId,
      type: transactionType,
      amount: parseFloat(transactionAmount),
      note: transactionNote,
      date: dateStr,
      storeId: store.id,
      storeName: store.name,
      creator: store.name
    };
    await setDoc(getPublicDoc('transactions', newId), data);
    setTransactionAmount(''); setTransactionNote('');
    showToast(`✅ Ghi nhận ${transactionType === 'chi' ? 'chi' : 'thu'} ${transactionAmount} thành công!`);
  };

  const handleUpdateReceiptStatus = async (receiptId: string, newStatus: string, erpId: string, accNotes: string) => {
    if (!user) return;
    await updateDoc(getPublicDoc('receipts', receiptId), { status: newStatus, erpId: erpId || '', accNotes: accNotes || '' });
    showToast('Đã lưu thông tin');
  };

  const handleSendInvoice = async (receiptId: string, selectedFile: any) => {
    if (!user || !selectedFile) return;
    setIsSyncing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result;
      await updateDoc(getPublicDoc('receipts', receiptId), { status: 'INVOICE_PROVIDED', invoice: { name: selectedFile.name, url: base64data } });
      showToast(`Đã đính kèm hóa đơn thành công`);
      setIsSyncing(false);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpdateItemQuantity = (idx: number, val: string) => {
    const num = parseInt(val);
    const n = [...currentItems];
    n[idx].quantity = isNaN(num) ? 0 : Math.max(0, num);
    setCurrentItems(n);
  };

  if (!isDBReady) return <div className="flex h-screen items-center justify-center font-medium text-emerald-600"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang kết nối dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-sans pb-10 text-gray-800">
      <style dangerouslySetInnerHTML={{__html: `
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
      `}} />

      {toastMsg && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4" /> <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {toastNotification && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-5 py-4 rounded-xl shadow-xl z-50 flex items-start gap-3 backdrop-blur-sm max-w-sm animate-slideIn">
          <div className="flex-1">
            <div className="text-sm font-bold">📨 Phiếu nhập mới</div>
            <div className="text-xs mt-1 opacity-90">Cửa hàng: <strong>{toastNotification.storeName}</strong></div>
            <div className="text-xs mt-1 opacity-90">Mã: <strong>{toastNotification.receiptId}</strong></div>
          </div>
          <button
            onClick={() => { handleMarkNotificationAsRead(toastNotification.id); setToastNotification(null); setRole('TRACKING'); }}
            className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
          >
            Xem
          </button>
        </div>
      )}

      {/* NOTIFICATION PANEL */}
      {showNotificationPanel && isMappingAuth && (
        <div className="fixed top-20 right-4 w-96 max-h-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <span className="font-bold">Thông báo ({unreadCount})</span>
            </div>
            <button onClick={() => setShowNotificationPanel(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Không có thông báo</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map(notif => (
                <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${notif.isRead ? 'border-gray-300 bg-gray-50' : 'border-blue-500 bg-blue-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-800">📨 Phiếu nhập mới</div>
                      <div className="text-xs text-gray-600 mt-1">Cửa hàng: <strong>{notif.storeName}</strong></div>
                      <div className="text-xs text-gray-600">Mã phiếu: <strong>{notif.receiptId}</strong></div>
                      <div className="text-xs text-gray-500 mt-2">🕒 {notif.createdAt}</div>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {!notif.isRead && (
                      <button
                        onClick={() => { handleMarkNotificationAsRead(notif.id); setShowNotificationPanel(false); setRole('TRACKING'); }}
                        className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        Xem phiếu
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notif.id)}
                      className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOGIN PAGE - Show if not logged in */}
      {!isLoggedIn ? (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-emerald-100">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">KN-Logistics</h1>
                <p className="text-gray-500 text-sm mt-2">Hệ thống quản lý chuỗi cung ứng</p>
              </div>

              {/* Login Form */}
              <div className="space-y-4">
                {/* Role Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
                  <select
                    value={loginRole}
                    onChange={(e) => {
                      setLoginRole(e.target.value as UserRole);
                      setLoginUsername('');
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-800"
                  >
                    <option value="admin">Quản trị viên</option>
                    <option value="accountant">Kế toán</option>
                    <option value="store_manager">Cửa hàng</option>
                    <option value="supplier">Cung ứng</option>
                  </select>
                </div>

                {/* ID Input - New scalable approach */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mã nhân viên / Cửa hàng</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value.toUpperCase())}
                    placeholder="Nhập ID"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-800 uppercase"
                  />
                  {loginUsername && (
                    <div className="mt-2 space-y-1 text-xs">
                      {getIdsByRole(loginRole)
                        .filter(item => item.id.includes(loginUsername))
                        .map(item => (
                          <div
                            key={item.id}
                            onClick={() => setLoginUsername(item.id)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 cursor-pointer rounded border border-emerald-200 transition-colors"
                          >
                            <div className="font-medium text-emerald-700">{item.id}</div>
                            <div className="text-gray-600">{item.name}</div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Nhập mật khẩu"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-gray-800"
                  />
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-700 text-sm font-medium">
                    ❌ {loginError}
                  </div>
                )}

                {/* Login Button */}
                <button
                  onClick={handleLogin}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold hover:shadow-lg transition-all active:scale-95"
                >
                  Đăng Nhập
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* HEADER */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center shadow-md">
              <Package className="w-5 h-5 text-emerald-700" />
            </div>
            KN-Logistics
          </h1>
          <div className="flex overflow-x-auto hide-scrollbar bg-white/10 backdrop-blur-sm rounded-xl p-1.5 space-x-1 border border-white/20">
            {(() => {
              // Determine which tabs to show based on user role
              let visibleTabs: string[] = [];
              if (loginUser?.role === 'admin') {
                visibleTabs = ['TRACKING', 'SOQUY', 'SETTINGS'];
              } else if (loginUser?.role === 'accountant') {
                visibleTabs = ['KETOAN', 'TRACKING', 'SOQUY', 'SETTINGS'];
              } else if (loginUser?.role === 'store_manager') {
                visibleTabs = ['CUAHANG', 'TRACKING', 'SOQUY', 'SETTINGS'];
              } else if (loginUser?.role === 'supplier') {
                visibleTabs = ['CUNGUNG', 'TRACKING', 'SETTINGS'];
              } else {
                visibleTabs = ['CUNGUNG', 'TRACKING', 'SETTINGS'];
              }

              return visibleTabs.map(r => (
                <button
                  key={r}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${role === r ? 'bg-yellow-400 text-emerald-900 shadow-lg scale-105' : 'text-white hover:bg-white/20'}`}
                  onClick={() => setRole(r)}
                >
                  {r === 'SETTINGS' ? 'CÀI ĐẶT' : r === 'TRACKING' ? 'THEO DÕI' : r === 'SOQUY' ? 'SỔ QUỸ' : r === 'CUNGUNG' ? 'HÓA ĐƠN' : r === 'CUAHANG' ? 'CỬA HÀNG' : 'KẾ TOÁN'}
                </button>
              ));
            })()}
          </div>
          {/* RELOAD DATA BUTTON */}
          <button
            onClick={handleReloadData}
            disabled={isReloading}
            className={`p-2 rounded-lg transition-colors text-white ${isReloading ? 'bg-white/30' : 'hover:bg-white/20'}`}
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-5 h-5 ${isReloading ? 'animate-spin' : ''}`} />
          </button>

          {/* NOTIFICATION BUTTON */}
          {isMappingAuth && (
            <div className="relative">
              <button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white relative"
                title="Thông báo"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ADMIN MENU */}
          <div className="relative">
            <button
              onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Menu Admin"
            >
              <Settings className="w-5 h-5" />
            </button>
            {isAdminMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <button
                  onClick={() => {
                    setIsChangePasswordModal(true);
                    setIsAdminMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-50 flex items-center gap-2 font-medium text-sm rounded-lg"
                >
                  <Lock className="w-4 h-4" /> Đổi mật khẩu Admin
                </button>
              </div>
            )}
          </div>

          {/* USER INFO & LOGOUT */}
          {isLoggedIn && loginUser && (
            <div className="flex items-center gap-3 pl-3 border-l border-white/30">
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{loginUser.name}</div>
                <div className="text-xs text-white/80">{loginUser.role === 'admin' ? 'Quản trị viên' : loginUser.role === 'accountant' ? 'Kế toán' : 'Cửa hàng'}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/30 rounded-lg transition-colors text-white"
                title="Đăng xuất"
              >
                <Unlock className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* CẢNH BÁO DB TRỐNG - HIDDEN FOR PERFORMANCE */}

        {/* =======================
            TAB CỬA HÀNG
        ========================= */}
        {role === 'CUAHANG' && (
          <div className="max-w-3xl mx-auto">
            {!isStoreAuth ? (
              <div className="max-w-sm mx-auto bg-white p-8 rounded-2xl shadow-xl border border-emerald-200 mt-10">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg mx-auto mb-3">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Đăng Nhập Kho</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Cửa hàng</label>
                    <select className="w-full p-3 border-2 border-emerald-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white text-gray-800" value={myStoreId} onChange={e => setMyStoreId(e.target.value)}>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Mật khẩu</label>
                    <input type="password" placeholder="Nhập mật khẩu..." className="w-full p-3 border-2 border-emerald-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" value={storePwdInput} onChange={e => setStorePwdInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (stores.find(x => x.id === myStoreId) as any)?.password === storePwdInput ? setIsStoreAuth(true) : null} />
                  </div>
                  <button onClick={() => { const s = stores.find(x => x.id === myStoreId); if (s && s.password === storePwdInput) setIsStoreAuth(true); else alert('Sai mật khẩu!'); }} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-md mt-2">Đăng nhập</button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-green-700 w-5 h-5" />
                    <div>
                      <div className="text-xs text-gray-500">Đang nhập liệu cho</div>
                      <div className="font-bold text-gray-800">{stores.find(s => s.id === myStoreId)?.name}</div>
                    </div>
                  </div>
                  <button onClick={() => { setIsStoreAuth(false); setStorePwdInput(''); }} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-md"><Lock className="w-4 h-4"/> Đăng xuất</button>
                </div>
                
                {/* TAB SELECTION FOR CỬA HÀNG */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setKeToanTabIndex(0)}
                    className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                      keToanTabIndex === 0
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    📦 Nhập Hàng Hóa
                  </button>
                  <button
                    onClick={() => setKeToanTabIndex(1)}
                    className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                      keToanTabIndex === 1
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    💰 Chi/Thu
                  </button>
                </div>

                {/* TAB 0: NHẬP HÀNG HÓA */}
                {keToanTabIndex === 0 && (
                  <>
                <div className="mb-6 relative z-30">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thêm hàng hóa vào phiếu</label>
                  <ProductSearch products={products} onSelect={(p: Product) => setCurrentItems([...currentItems, { product: p, quantity: 1, note: '' }])} />
                </div>

                {currentItems.length > 0 && (
                  <div className="space-y-4 mt-4">
                    {Object.entries(ITEM_CONDITIONS).map(([condKey, condVal]: any) => {
                      const itemsWithCondition = currentItems.filter((item, idx) => (item.condition || 'NORMAL') === condKey);
                      if (itemsWithCondition.length === 0) return null;

                      return (
                        <div key={condKey} className={`border-l-4 rounded-lg overflow-hidden ${condVal.color}`}>
                          <div className={`${condVal.color} px-4 py-2 font-bold text-sm flex items-center gap-2`}>
                            <span className="text-lg">{condVal.icon}</span> {condVal.label} ({itemsWithCondition.length})
                          </div>
                          <div className="space-y-2 p-4 bg-white">
                            {itemsWithCondition.map((item, mapIdx) => {
                              const idx = currentItems.indexOf(item);
                              return (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-800 text-sm">{item.product.name}</div>
                                      <div className="text-xs text-gray-500 font-mono mt-0.5">{item.product.id}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden h-8">
                                        <button onClick={() => handleUpdateItemQuantity(idx, String(item.quantity - 1))} className="px-2 h-full hover:bg-gray-100 text-gray-600 transition-colors text-sm">-</button>
                                        <input type="number" className="w-10 h-full text-center font-medium outline-none text-xs" value={item.quantity} onChange={(e) => handleUpdateItemQuantity(idx, e.target.value)} />
                                        <button onClick={() => handleUpdateItemQuantity(idx, String(item.quantity + 1))} className="px-2 h-full hover:bg-gray-100 text-gray-600 transition-colors text-sm">+</button>
                                      </div>
                                      <button onClick={() => setCurrentItems(currentItems.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                  </div>

                                  {item.note && (
                                    <div className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded mb-2">
                                      📝 {item.note}
                                    </div>
                                  )}

                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1.5">Thay đổi tình trạng</label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {Object.entries(ITEM_CONDITIONS).map(([key, val]: any) => (
                                        <button
                                          key={key}
                                          onClick={() => { const n = [...currentItems]; n[idx].condition = key; setCurrentItems(n); }}
                                          className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                                            (item.condition || 'NORMAL') === key
                                              ? `${val.color} border-current`
                                              : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                          }`}
                                        >
                                          {val.icon}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {item.note && !item.condition?.includes('NORMAL') && (
                                    <input type="text" placeholder="Thêm ghi chú..." className="w-full p-1.5 h-7 border border-gray-300 rounded text-xs outline-none focus:border-green-500 mt-2" value={item.note} onChange={e => { const n = [...currentItems]; n[idx].note = e.target.value; setCurrentItems(n); }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentItems.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú chung cho phiếu nhập</label>
                      <textarea placeholder="VD: Xe tải 93C-123.45, tài xế Hùng..." className="w-full p-3 border border-gray-300 rounded-lg h-20 text-sm outline-none focus:ring-1 focus:ring-green-500" value={generalNote} onChange={e => setGeneralNote(e.target.value)} />
                    </div>
                    <button onClick={handleSubmitReceipt} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium shadow-sm flex justify-center items-center gap-2 transition-colors"><ArrowRight className="w-5 h-5"/> XÁC NHẬN GỬI PHIẾU NHẬP</button>
                  </div>
                )}
                {currentItems.length === 0 && <div className="py-16 text-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-2">Chưa có sản phẩm nào được chọn</div>}
                  </>
                )}

                {/* TAB 1: CHI/THU */}
                {keToanTabIndex === 1 && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span className="text-lg">💰</span> Ghi Nhận Chi/Thu Tiền</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch</label>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setTransactionType('chi')}
                              className={`flex-1 py-3 rounded-lg font-medium transition-all border-2 ${
                                transactionType === 'chi'
                                  ? 'bg-red-500 text-white border-red-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
                              }`}
                            >
                              🔴 Chi (Tiền Ra)
                            </button>
                            <button
                              onClick={() => setTransactionType('thu')}
                              className={`flex-1 py-3 rounded-lg font-medium transition-all border-2 ${
                                transactionType === 'thu'
                                  ? 'bg-green-500 text-white border-green-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                              }`}
                            >
                              🟢 Thu (Tiền Vào)
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền (VNĐ)</label>
                          <input
                            type="number"
                            placeholder="Nhập số tiền..."
                            className="w-full p-3 border-2 border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            value={transactionAmount}
                            onChange={e => setTransactionAmount(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                          <textarea
                            placeholder="VD: Thanh toán tương ứng hoá đơn PNH-123456, tiền công nhân, chi khác..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none"
                            value={transactionNote}
                            onChange={e => setTransactionNote(e.target.value)}
                          />
                        </div>

                        <button
                          onClick={handleSubmitTransaction}
                          disabled={!transactionAmount}
                          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-white ${
                            transactionAmount
                              ? transactionType === 'chi'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {transactionType === 'chi' ? '✂️ Ghi Nhận Chi' : '✓ Ghi Nhận Thu'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =======================
            TAB KẾ TOÁN
        ========================= */}
        {role === 'KETOAN' && (
          <div className="max-w-5xl mx-auto">
            {!isAccAuth ? (
              <div className="max-w-sm mx-auto bg-white p-8 rounded-2xl shadow-md border border-emerald-100 mt-10">
                <div className="text-center mb-6">
                  <FileText className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h2 className="text-xl font-bold text-gray-800">Đăng Nhập Kế Toán</h2>
                </div>
                <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">Tài khoản</label>
                     <select className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-yellow-500 text-sm" value={myAccId} onChange={e => setMyAccId(e.target.value)}>
                      {accountants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Mật khẩu</label>
                    <input type="password" placeholder="Nhập mật khẩu..." className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-yellow-500 text-sm" value={accPwdInput} onChange={e => setAccPwdInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (accountants.find(x => x.id === myAccId) as any)?.password === accPwdInput ? setIsAccAuth(true) : null} />
                  </div>
                  <button onClick={() => { const a = accountants.find(x => x.id === myAccId); if (a && a.password === accPwdInput) setIsAccAuth(true); else alert('Sai mật khẩu!'); }} className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors mt-2">Đăng nhập</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-md border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {accountants.find(a => a.id === myAccId)?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Xin chào, Kế toán</div>
                      <div className="font-bold text-gray-800 text-sm">{accountants.find(a => a.id === myAccId)?.name}</div>
                    </div>
                  </div>
                </div>

                {/* KETOAN TABS */}
                <div className="flex gap-2 border-b border-gray-200 bg-white p-4 rounded-xl">
                  <button
                    onClick={() => setKeToanTabIndex(0)}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                      keToanTabIndex === 0
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    📦 Phiếu Nhập Hàng
                  </button>
                  <button
                    onClick={() => setKeToanTabIndex(1)}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                      keToanTabIndex === 1
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    💰 Giao Dịch Chi/Thu
                  </button>
                  <button
                    onClick={() => setKeToanTabIndex(2)}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                      keToanTabIndex === 2
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    📄 Yêu Cầu Hoá Đơn
                  </button>
                </div>

                {/* TAB 0: NHẬP HÀNG */}
                {keToanTabIndex === 0 && (
                <div className="space-y-4">
                {receipts.filter(r => {
                  const receiptStore = stores.find(s => s.id === r.storeId);
                  return receiptStore?.accountantId === myAccId && r.status !== 'COMPLETED';
                }).map(r => (
                  <div key={r.id} className="bg-white p-5 rounded-2xl shadow-md border border-emerald-100 flex flex-col md:flex-row gap-6 border-l-4 border-l-blue-400">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                           <div className="text-xs text-gray-500 mb-0.5">{r.date}</div>
                           <div 
                             className="font-bold text-emerald-600 text-lg cursor-pointer hover:text-blue-800 hover:underline transition-all inline-block"
                             onClick={() => { setFilterReceiptId(r.id); setRole('TRACKING'); }}
                             title="Xem trên Sổ Theo Dõi"
                           >
                             {r.id}
                           </div>
                           <div className="text-sm text-gray-600 mt-1">Kho: <span className="font-medium text-gray-800">{r.creator}</span></div>
                         </div>
                         <span className={`px-2.5 py-1 rounded text-xs font-medium border ${STATUSES[r.status]?.color || 'bg-gray-100'}`}>{STATUSES[r.status]?.label || 'NEW'}</span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                        <div className="text-xs font-bold text-gray-600 mb-2">DANH SÁCH HÀNG HÓA</div>
                        <ul className="space-y-3">
                          {r.items.map((it: any, i: number) => (
                            <li key={i} className="p-2 bg-white rounded border border-gray-100 text-sm">
                               <div className="flex justify-between items-start mb-1">
                                 <span className="font-medium text-gray-800">{it.product.name}</span>
                                 <span className="font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded shadow-sm text-xs shrink-0">x{it.quantity}</span>
                               </div>
                               {it.note && <div className="text-xs text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded mb-1">📝 {it.note}</div>}
                               {it.condition && (
                                 <div className={`text-xs font-medium px-1.5 py-0.5 rounded border ${ITEM_CONDITIONS[it.condition]?.color}`}>
                                   {ITEM_CONDITIONS[it.condition]?.icon} {ITEM_CONDITIONS[it.condition]?.label}
                                 </div>
                               )}
                               {!it.condition && (
                                 <div className={`text-xs font-medium px-1.5 py-0.5 rounded border ${ITEM_CONDITIONS['NORMAL']?.color}`}>
                                   {ITEM_CONDITIONS['NORMAL']?.icon} {ITEM_CONDITIONS['NORMAL']?.label}
                                 </div>
                               )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {r.generalNote && (
                        <div className="text-sm bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200">
                           <span className="font-bold">Ghi chú chung:</span> {r.generalNote}
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-72 flex flex-col gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-xs font-bold text-gray-600 uppercase border-b border-gray-200 pb-2">Khu vực xử lý</div>
                      
                      {r.invoice && (
                        <div className="bg-white p-2.5 rounded border border-gray-200 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Paperclip className="w-4 h-4 text-blue-500 shrink-0" /> 
                            <a href={r.invoice.url} download={r.invoice.name} className="text-sm font-medium text-emerald-600 hover:underline truncate">{r.invoice.name}</a>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Trạng thái</label>
                        <select className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm bg-white" value={r.status} onChange={e => handleUpdateReceiptStatus(r.id, e.target.value, r.erpId, r.accNotes)}>
                          {Object.values(STATUSES).map((s: any) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Mã ERP</label>
                        <input type="text" className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm font-mono bg-white" placeholder="PN..." value={r.erpId} onChange={e => handleUpdateReceiptStatus(r.id, r.status, e.target.value, r.accNotes)} />
                      </div>

                      <div className="flex-1 flex flex-col">
                        <label className="text-xs text-gray-600 mb-1 block">Ghi chú phản hồi</label>
                        <textarea className="w-full flex-1 min-h-[60px] p-2 border border-gray-300 rounded bg-white outline-none focus:border-blue-500 text-sm resize-none" placeholder="Nội dung cần báo lại kho..." value={r.accNotes} onChange={e => handleUpdateReceiptStatus(r.id, r.status, r.erpId, e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                {receipts.filter(r => {
                  const receiptStore = stores.find(s => s.id === r.storeId);
                  return receiptStore?.accountantId === myAccId && r.status !== 'COMPLETED';
                }).length === 0 && (
                   <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-emerald-100">
                     <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                     <div className="font-medium text-gray-600">Đã hoàn tất mọi chứng từ cần xử lý.</div>
                   </div>
                )}
                </div>
                )}

                {/* TAB 1: CHI/THU TRANSACTIONS */}
                {keToanTabIndex === 1 && (
                <div>
                  <div className="bg-white rounded-2xl shadow-md border border-emerald-100 overflow-hidden">
                    {/* Get all stores for this accountant */}
                    {(() => {
                      const accountantStores = stores.filter(s => s.accountantId === myAccId);
                      const accountantTransactions = transactions.filter(t =>
                        accountantStores.some(s => s.id === t.storeId)
                      );

                      if (accountantTransactions.length === 0) {
                        return (
                          <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-emerald-100">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <div className="font-medium text-gray-500">Chưa có giao dịch chi/thu nào.</div>
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                              <tr>
                                <th className="p-3">Mã Giao Dịch</th>
                                <th className="p-3">Loại</th>
                                <th className="p-3">Cửa Hàng</th>
                                <th className="p-3">Số Tiền</th>
                                <th className="p-3">Thời Gian</th>
                                <th className="p-3">Ghi Chú</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {accountantTransactions.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                                <tr key={t.id} className={`hover:bg-gray-50 ${t.type === 'chi' ? 'bg-red-50' : 'bg-green-50'}`}>
                                  <td className="p-3 font-mono font-bold">{t.id}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                      t.type === 'chi'
                                        ? 'bg-red-100 text-red-700 border-red-300'
                                        : 'bg-green-100 text-green-700 border-green-300'
                                    }`}>
                                      {t.type === 'chi' ? '🔴 Chi' : '🟢 Thu'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-gray-800">{t.storeName}</td>
                                  <td className="p-3 font-bold">{t.amount.toLocaleString('vi-VN')} ₫</td>
                                  <td className="p-3 text-gray-600 text-xs">{t.date}</td>
                                  <td className="p-3 text-gray-600 text-xs max-w-xs truncate">{t.note || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =======================
            TAB HÓA ĐƠN (CUNG ỨNG)
        ========================= */}
        {role === 'CUNGUNG' && (
          <div className="max-w-4xl mx-auto">
            {!isSupplyAuth ? (
              <div className="max-w-sm mx-auto bg-white p-8 rounded-2xl shadow-md border border-emerald-100 mt-10">
                 <div className="text-center mb-6">
                    <FileUp className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
                    <h2 className="text-xl font-bold text-gray-800">Cổng Hóa Đơn</h2>
                 </div>
                 <div className="space-y-4">
                   <input type="password" placeholder="Nhập mã bảo vệ..." className="w-full p-2.5 border border-gray-300 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 text-sm" value={supplyPwdInput} onChange={e => setSupplyPwdInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && supplyPwdInput === '123' ? setIsSupplyAuth(true) : null} />
                   <button onClick={() => supplyPwdInput === '123' ? setIsSupplyAuth(true) : alert('Mã bảo vệ không đúng!')} className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">Đăng nhập</button>
                 </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-md border border-emerald-100">
                   <div className="flex items-center gap-2">
                     <Upload className="w-5 h-5 text-yellow-600"/>
                     <h2 className="font-bold text-gray-800">Cần bổ sung chứng từ</h2>
                   </div>
                   <button onClick={() => { setIsSupplyAuth(false); setSupplyPwdInput(''); }} className="text-gray-500 hover:text-red-500 text-sm font-medium flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"><Lock className="w-4 h-4"/> Thoát</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receipts.filter(r => r.status === 'WAITING_INVOICE').map(r => {
                    const storeName = stores.find(s => s.id === r.storeId)?.name || r.creator;
                    const importDate = r.date.split(' ')[0];
                    return (
                    <div key={r.id} className="bg-white p-5 rounded-2xl shadow-md border border-emerald-100 flex flex-col justify-between group relative">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex-1">
                            <span
                              className="font-bold text-emerald-600 text-lg block cursor-pointer hover:text-blue-800 hover:underline transition-all"
                              onClick={() => setSelectedReceiptModal(r)}
                              title="Click để xem chi tiết hàng hoá"
                            >
                              {r.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-medium bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">CHỜ HÓA ĐƠN</span>
                            <button
                              onClick={() => setSplitReceiptId(r.id)}
                              className="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Tách phiếu (có H.Đ/chưa có H.Đ)"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteReceiptId(r.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Xóa phiếu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mb-3">
                          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400"/> Ngày nhập: <strong>{importDate}</strong></div>
                          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400"/> Cửa hàng: <strong>{storeName}</strong></div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
                          <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Chi tiết vật tư nhập</div>
                          <ul className="space-y-2">
                            {r.items.map((it: any, i: number) => (
                              <li key={i} className="text-sm p-2 bg-white rounded border border-gray-100">
                                 <div className="flex justify-between items-start mb-1">
                                   <span className="text-gray-700 font-medium">{it.product.name}</span>
                                   <span className="font-bold text-gray-800 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-xs shrink-0">x{it.quantity}</span>
                                 </div>
                                 {it.condition && (
                                   <div className={`text-[10px] font-medium px-1 py-0.5 rounded border ${ITEM_CONDITIONS[it.condition]?.color}`}>
                                     {ITEM_CONDITIONS[it.condition]?.icon} {ITEM_CONDITIONS[it.condition]?.label}
                                   </div>
                                 )}
                                 {!it.condition && (
                                   <div className={`text-[10px] font-medium px-1 py-0.5 rounded border ${ITEM_CONDITIONS['NORMAL']?.color}`}>
                                     {ITEM_CONDITIONS['NORMAL']?.icon} {ITEM_CONDITIONS['NORMAL']?.label}
                                   </div>
                                 )}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {r.generalNote && (
                          <div className="text-sm bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200">
                             <span className="font-bold text-xs uppercase block mb-1">Ghi chú (Xe / Tài xế):</span>
                             {r.generalNote}
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center relative hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm font-medium text-yellow-600 block mb-0.5">Tải lên hóa đơn</span>
                        <p className="text-[10px] text-gray-500">JPG, PNG, PDF (Max 1MB)</p>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, image/png, image/jpeg" onChange={(e: any) => handleSendInvoice(r.id, e.target.files[0])} />
                      </div>
                    </div>
                    );
                  })}
                </div>
                {receipts.filter(r => r.status === 'WAITING_INVOICE').length === 0 && (
                   <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-emerald-100">
                     <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                     <div className="font-medium text-gray-500">Không có yêu cầu tải hóa đơn nào.</div>
                   </div>
                )}

                {/* SECTION 2: YÊU CẦU HÓA ĐƠN TỪ KỂ TOÁN */}
                <div className="space-y-4 mt-8">
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-md border border-blue-100">
                     <div className="flex items-center gap-2">
                       <FileText className="w-5 h-5 text-blue-600"/>
                       <h2 className="font-bold text-gray-800">Yêu Cầu Hóa Đơn từ Kế Toán</h2>
                     </div>
                  </div>

                  <div className="space-y-3">
                    {invoiceRequests.filter(req => req.status !== 'submitted' && req.status !== 'completed').map(req => {
                      const storeName = stores.find(s => s.id === req.storeId)?.name || 'Cửa hàng không xác định';
                      const createdDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : '';
                      const statusLabel = req.status === 'submitted' ? 'Đã gửi' : 'Chờ xử lý';
                      return (
                      <div key={req.id} className="bg-white p-5 rounded-2xl shadow-md border border-blue-100 flex flex-col justify-between">
                        <div className="mb-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <span className="font-bold text-blue-600 text-lg block">{req.id}</span>
                              <span className="text-xs text-gray-500">{createdDate}</span>
                            </div>
                            <span className="text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-300 px-2 py-0.5 rounded">YÊU CẦU MỚI</span>
                          </div>

                          <div className="text-sm text-gray-700 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400"/>
                              <strong>Cửa hàng:</strong> {storeName}
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400"/>
                              <strong>Số tiền:</strong> {req.amount?.toLocaleString('vi-VN')} đ
                            </div>
                            {req.note && (
                              <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200 mt-2">
                                <strong>Ghi chú:</strong> {req.note}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-200">
                          <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4"/> Đã gửi hóa đơn
                          </button>
                          <button className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors">
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {invoiceRequests.filter(req => req.status !== 'submitted' && req.status !== 'completed').length === 0 && (
                   <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-blue-100">
                     <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                     <div className="font-medium text-gray-500">Không có yêu cầu hóa đơn nào từ kế toán.</div>
                   </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =======================
            TAB THEO DÕI
        ========================= */}
        {role === 'TRACKING' && (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Sổ Theo Dõi</h2>
                <p className="text-sm text-gray-500 mt-1">Báo cáo lịch sử giao dịch kho</p>
              </div>
              <div className="flex items-center gap-2">
                {(filterReceiptId || filterStore || filterAcc || filterStartDate || filterEndDate || filterReceiptStatus) && (
                  <button onClick={() => { setFilterReceiptId(''); setFilterStore(''); setFilterAcc(''); setFilterStartDate(''); setFilterEndDate(''); setFilterReceiptStatus(''); }} className="text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg font-medium transition-colors">Xóa bộ lọc</button>
                )}
                <button onClick={() => {
                    let csv = "\uFEFFMã Phiếu,Cửa Hàng,Thời Gian,Trạng Thái,Mã ERP\n";
                    receipts.forEach(r => csv += `${r.id},${r.creator},${r.date},${STATUSES[r.status]?.label || 'NEW'},${r.erpId || ''}\n`);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `Bao_cao_Logistics.csv`; a.click();
                  }} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"><Download className="w-4 h-4"/> Xuất Excel</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tìm mã phiếu</label>
                <input type="text" placeholder="Nhập mã..." className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none focus:border-gray-400" value={filterReceiptId} onChange={e => setFilterReceiptId(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Cửa hàng</label>
                <select className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none" value={filterStore} onChange={e => setFilterStore(e.target.value)}><option value="">-- Tất cả --</option>{stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Kế toán</label>
                <select className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none" value={filterAcc} onChange={e => setFilterAcc(e.target.value)}><option value="">-- Tất cả --</option>{accountants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Trạng thái</label>
                <select className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none" value={filterReceiptStatus} onChange={e => setFilterReceiptStatus(e.target.value)}><option value="">-- Tất cả --</option>{Object.values(STATUSES).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Từ ngày</label>
                <input type="date" className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Đến ngày</label>
                <input type="date" className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              </div>
            </div>


            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium"><tr><th className="p-3">Mã Phiếu</th><th className="p-3">Cửa Hàng</th><th className="p-3">Thời Gian</th><th className="p-3">Trạng Thái</th><th className="p-3">Mã ERP</th><th className="p-3 text-center">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filterDataByPermission(receipts, getCurrentUser(), 'storeId').filter(r => {
                      const rDate = r.date.split(' ')[0];
                      const matchId = !filterReceiptId || r.id.toLowerCase().includes(filterReceiptId.toLowerCase());
                      return matchId &&
                             (!filterStore || r.storeId === filterStore) &&
                             (!filterAcc || r.accountantId === filterAcc) &&
                             (!filterReceiptStatus || r.status === filterReceiptStatus) &&
                             (!filterStartDate || rDate >= filterStartDate) &&
                             (!filterEndDate || rDate <= filterEndDate);
                  }).sort((a, b) => b.id.localeCompare(a.id)).map(r => {
                    const storeName = stores.find(s => s.id === r.storeId)?.name || r.creator;
                    const itemCount = r.items.length;
                    const [dateOnly, timeOnly] = r.date.split(' ');
                    return (
                    <tr key={r.id} className={`hover:bg-gray-50 group ${r.accNotes?.includes('CHƯA CÓ H.Đ') ? 'bg-orange-50' : ''}`}>
                      <td className="p-3 font-mono text-xs text-emerald-600 font-bold cursor-pointer hover:text-blue-600 hover:underline" onClick={() => setSelectedReceiptModal(r)} title="Click để xem chi tiết">{r.id}</td>
                      <td className="p-3">
                        <div className="text-gray-800 font-medium text-sm">{storeName}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{itemCount} mặt hàng</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-800 text-sm">{dateOnly}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{timeOnly || 'N/A'}</div>
                      </td>
                      <td className="p-3 space-y-1">
                        <span className={`px-2 py-1 rounded text-xs border block w-fit ${STATUSES[r.status]?.color || 'bg-gray-100'}`}>{STATUSES[r.status]?.label || 'NEW'}</span>
                        {r.accNotes?.includes('CHƯA CÓ H.Đ') && (
                          <div className="text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-1 rounded w-fit" title={r.accNotes}>
                            ⚠️ Chờ H.Đ
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-gray-700">{r.erpId || '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setDeleteReceiptId(r.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          title="Xóa phiếu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {receipts.length === 0 && <div className="p-10 text-center text-gray-400 italic bg-white">Không có dữ liệu phù hợp</div>}
            </div>
          </div>
        )}

        {/* =======================
            TAB SỔ QUỸ (FUND LEDGER)
        ========================= */}
        {role === 'SOQUY' && (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Sổ Quỹ (Fund Ledger)</h2>
                <p className="text-sm text-gray-500 mt-1">Báo cáo giao dịch chi/thu tiền mặt</p>
              </div>
              <div className="flex items-center gap-2">
                {(filterTransactionType) && (
                  <button onClick={() => { setFilterTransactionType(''); }} className="text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg font-medium transition-colors">Xóa bộ lọc</button>
                )}
                <button onClick={() => {
                    let csv = "\uFEFFMã Giao Dịch,Loại,Cửa Hàng,Số Tiền,Thời Gian,Ghi Chú\n";
                    transactions.forEach(t => csv += `${t.id},${t.type === 'chi' ? 'Chi' : 'Thu'},${t.storeName},${t.amount},${t.date},"${(t.note || '').replace(/"/g, '""')}"\n`);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `So_Quy_${new Date().toLocaleDateString('vi-VN')}.csv`; a.click();
                  }} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"><Download className="w-4 h-4"/> Xuất Excel</button>
              </div>
            </div>

            <div className="flex gap-3 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Loại giao dịch</label>
                <select className="p-2 border border-gray-300 rounded bg-white text-sm outline-none" value={filterTransactionType} onChange={e => setFilterTransactionType(e.target.value)}>
                  <option value="">-- Tất cả --</option>
                  <option value="chi">Chi (Tiền Ra)</option>
                  <option value="thu">Thu (Tiền Vào)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <tr>
                    <th className="p-3">Mã Giao Dịch</th>
                    <th className="p-3">Loại</th>
                    <th className="p-3">Cửa Hàng</th>
                    <th className="p-3">Số Tiền (VNĐ)</th>
                    <th className="p-3">Thời Gian</th>
                    <th className="p-3">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filterDataByPermission(transactions, getCurrentUser(), 'storeId').filter(t => {
                      const matchType = !filterTransactionType || t.type === filterTransactionType;
                      return matchType;
                  }).sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                    <tr key={t.id} className={`hover:bg-gray-50 group ${t.type === 'chi' ? 'bg-red-50' : 'bg-green-50'}`}>
                      <td className="p-3 font-mono font-bold text-emerald-600">{t.id}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded text-xs font-medium border ${
                          t.type === 'chi'
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : 'bg-green-100 text-green-700 border-green-300'
                        }`}>
                          {t.type === 'chi' ? '🔴 Chi' : '🟢 Thu'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-800 font-medium text-sm">{t.storeName}</div>
                        <div className="text-gray-500 text-xs mt-0.5">Người ghi: {t.creator}</div>
                      </td>
                      <td className="p-3 font-bold text-lg">{t.amount.toLocaleString('vi-VN')}</td>
                      <td className="p-3">
                        <div className="text-gray-800 text-sm">{t.date.split(' ')[0]}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{t.date.split(' ')[1] || 'N/A'}</div>
                      </td>
                      <td className="p-3 text-gray-600 text-xs max-w-xs truncate" title={t.note}>{t.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(() => {
                const currentUser = getCurrentUser();
                const filteredByPermission = filterDataByPermission(transactions, currentUser, 'storeId');
                return filteredByPermission.filter(t => !filterTransactionType || t.type === filterTransactionType).length === 0;
              })() && (
                <div className="p-10 text-center text-gray-400 italic bg-white">Không có dữ liệu phù hợp</div>
              )}
            </div>

            {/* Summary Section */}
            {transactions.length > 0 && (() => {
              const filtered = filterDataByPermission(transactions, getCurrentUser(), 'storeId');
              const chiTransactions = filtered.filter(t => t.type === 'chi' && (!filterTransactionType || t.type === filterTransactionType));
              const thuTransactions = filtered.filter(t => t.type === 'thu' && (!filterTransactionType || t.type === filterTransactionType));
              const chiAmount = chiTransactions.reduce((sum, t) => sum + t.amount, 0);
              const thuAmount = thuTransactions.reduce((sum, t) => sum + t.amount, 0);
              const net = thuAmount - chiAmount;
              return (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-red-600 text-sm font-medium">Tổng Chi</div>
                    <div className="text-red-700 font-bold text-lg mt-2">
                      {chiAmount.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-green-600 text-sm font-medium">Tổng Thu</div>
                    <div className="text-green-700 font-bold text-lg mt-2">
                      {thuAmount.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                  <div className={`border rounded-lg p-4 text-center ${net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className={`text-sm font-medium ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      Chênh lệch
                    </div>
                    <div className={`font-bold text-lg mt-2 ${net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      {(net >= 0 ? '+' : '') + net.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-purple-600 text-sm font-medium">Tổng giao dịch</div>
                    <div className="text-purple-700 font-bold text-lg mt-2">
                      {filtered.filter(t => !filterTransactionType || t.type === filterTransactionType).length}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* =======================
            TAB CÀI ĐẶT (ADMIN)
        ========================= */}
        {role === 'SETTINGS' && (
          <div className="max-w-5xl mx-auto">
            {!isMappingAuth ? (
              <div className="max-w-sm mx-auto bg-white p-8 rounded-2xl shadow-md border border-emerald-100 mt-10 text-center">
                <Settings className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Cài Đặt Hệ Thống</h2>
                <p className="text-xs text-gray-500 mb-6">Khu vực dành cho Quản trị viên</p>
                <div className="space-y-4">
                  <input type="password" placeholder="Nhập mật khẩu..." className="w-full p-2.5 border border-gray-300 rounded-lg text-center text-sm outline-none focus:ring-1 focus:ring-gray-500" value={inputPwd} onChange={e => setInputPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLoginMapping()} />
                  <button onClick={handleLoginMapping} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors">Truy cập</button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Setting */}
                <div className="bg-gray-800 text-white p-4 rounded-xl shadow-sm">
                   <div className="flex items-center gap-2 font-medium">
                     <Settings className="w-5 h-5 text-gray-300"/> Cấu Hình Hệ Thống
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* QUẢN LÝ VẬT TƯ */}
                  <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100 flex flex-col h-full lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                      <Database className="text-emerald-600 w-5 h-5" />
                      <h3 className="font-bold text-gray-800">Danh Mục Vật Tư</h3>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Thêm thủ công</label>
                        <div className="flex gap-2">
                          <input type="text" placeholder="MÃ (VD: SP01)" className="w-28 p-2 border border-gray-300 rounded bg-white uppercase outline-none focus:border-blue-500 text-sm" value={newProdId} onChange={e => setNewProdId(e.target.value)} />
                          <input type="text" placeholder="Tên hàng hóa..." className="flex-1 p-2 border border-gray-300 rounded bg-white outline-none focus:border-blue-500 text-sm" value={newProdName} onChange={e => setNewProdName(e.target.value)} />
                          <button onClick={handleAddProduct} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 rounded transition-colors"><Plus className="w-4 h-4"/></button>
                        </div>
                      </div>
                      <div className="hidden md:block w-px bg-gray-300"></div>
                      <div className="md:w-56">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Tải từ Excel (Ghi đè)</label>
                        <input type="file" accept=".csv" className="hidden" ref={fileImportRef} onChange={handleImportCSV} />
                        <button onClick={() => fileImportRef.current?.click()} disabled={isSyncing} className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 p-2 rounded flex gap-2 items-center justify-center transition-colors disabled:opacity-50 text-sm">
                          <Upload className="w-4 h-4"/> {isSyncing ? 'Đang đọc...' : 'Import CSV (Tối đa 2000)'}
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden flex-1 flex flex-col">
                      <div className="bg-gray-100 p-2.5 flex justify-between items-center text-xs font-medium text-gray-600 border-b border-gray-200">
                         <span>Danh sách hàng hóa</span>
                         <span className="bg-white px-2 py-0.5 rounded border border-gray-200">{products.length} mã</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white">
                        {products.map(p => (
                          <div key={p.id} className="p-3 flex justify-between items-center hover:bg-gray-50 group">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded w-20 text-center border border-gray-200">{p.id}</span>
                              <span className="text-gray-800 text-sm">{p.name}</span>
                            </div>
                            <button onClick={() => deleteDoc(getPublicDoc('products', p.id))} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                        {products.length === 0 && <div className="p-10 text-center text-gray-400 text-sm">Trống</div>}
                      </div>
                    </div>
                  </div>

                  {/* QUẢN LÝ KẾ TOÁN */}
                  <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                      <UserPlus className="text-emerald-600 w-5 h-5"/>
                      <h3 className="font-bold text-gray-800">Kế Toán</h3>
                    </div>
                    
                    <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Mã định danh</label>
                        <input type="text" placeholder="VD: KT_HOA" className="w-full p-2 border border-gray-300 rounded outline-none uppercase text-sm" value={newAccId} onChange={e => setNewAccId(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Tên nhân viên</label>
                        <input type="text" placeholder="Nguyễn Thị Hoa" className="w-full p-2 border border-gray-300 rounded outline-none text-sm" value={newAccName} onChange={e => setNewAccName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Mật khẩu</label>
                        <input type="text" placeholder="..." className="w-full p-2 border border-gray-300 rounded outline-none text-sm" value={newAccPwd} onChange={e => setNewAccPwd(e.target.value)} />
                      </div>
                      <button onClick={handleAddAccountant} className="w-full py-2 mt-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-medium text-sm transition-colors">Thêm Mới</button>
                    </div>

                    <div className="flex-1 overflow-auto max-h-60 border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b border-gray-200"><tr className="text-left text-gray-600 font-medium text-xs"><th className="p-2 pl-3">Mã</th><th className="p-2">Nhân viên</th><th className="p-2 text-center w-10"></th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                          {accountants.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50 group">
                              <td className="p-2 pl-3 font-mono text-xs">{a.id}</td>
                              <td className="p-2 text-gray-800">{a.name}</td>
                              <td className="p-2 text-center">
                                <button onClick={() => deleteDoc(getPublicDoc('accountants', a.id))} className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* QUẢN LÝ CỬA HÀNG */}
                  <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-100 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                      <MapPin className="text-yellow-600 w-5 h-5"/>
                      <h3 className="font-bold text-gray-800">Cửa Hàng</h3>
                    </div>

                    <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Mã trạm</label>
                          <input type="text" placeholder="CH_01" className="w-full p-2 border border-gray-300 rounded outline-none uppercase text-sm" value={newStoreId} onChange={e => setNewStoreId(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Tên hiển thị</label>
                          <input type="text" placeholder="Tên..." className="w-full p-2 border border-gray-300 rounded outline-none text-sm" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Kế toán phụ trách</label>
                        <select className="w-full p-2 border border-gray-300 rounded outline-none bg-white text-sm" value={newStoreAccId} onChange={e => setNewStoreAccId(e.target.value)}>
                          <option value="">-- Chọn Kế toán --</option>
                          {accountants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Mật khẩu</label>
                        <input type="text" placeholder="..." className="w-full p-2 border border-gray-300 rounded outline-none text-sm" value={newStorePwd} onChange={e => setNewStorePwd(e.target.value)} />
                      </div>
                      <button onClick={handleAddStore} className="w-full py-2 mt-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-medium text-sm transition-colors">Thêm Mới</button>
                    </div>

                    <div className="flex-1 overflow-auto max-h-60 border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b border-gray-200"><tr className="text-left text-gray-600 font-medium text-xs"><th className="p-2 pl-3">Cửa hàng</th><th className="p-2">Phụ trách</th><th className="p-2 text-center w-10"></th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                          {stores.map(s => {
                            const assignedAcc = accountants.find(a => a.id === s.accountantId);
                            return (
                            <tr key={s.id} className="hover:bg-gray-50 group">
                              <td className="p-2 pl-3 text-gray-800">{s.name} <span className="block text-[10px] text-gray-400 font-mono">{s.id}</span></td>
                              <td className="p-2 text-xs">
                                {assignedAcc ? (
                                  <span className="text-gray-700 font-medium">{assignedAcc.name}</span>
                                ) : (
                                  <span className="text-red-400 italic">Trống</span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <button onClick={() => deleteDoc(getPublicDoc('stores', s.id))} className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUẢN LÝ HÓA ĐƠN TAB - SUPPLIER ONLY (renamed from QUANLYHOADON) */}
                {/* Quản lý Kế toán */}
                <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus className="w-5 h-5"/> Kế Toán</h3>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="space-y-3 mb-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">Tên nhân viên</label>
                        <input type="text" placeholder="Nguyễn Thị Hoa" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={newAccName} onChange={e => setNewAccName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">Mật khẩu</label>
                        <input type="password" placeholder="Nhập mật khẩu" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={newAccPwd} onChange={e => setNewAccPwd(e.target.value)} />
                      </div>
                      <button onClick={handleAddAccountant} className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4"/> Thêm Mới
                      </button>
                    </div>

                    <div className="border-t pt-4 flex-1">
                      <h4 className="text-xs font-bold text-gray-600 mb-3 uppercase">Danh sách ({accountants.length})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {accountants.map(a => (
                          <div key={a.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start justify-between group hover:bg-blue-100 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 text-sm truncate">{a.name}</div>
                              <div className="text-xs text-gray-600 font-mono mt-1">{a.id}</div>
                            </div>
                            <button onClick={() => deleteDoc(getPublicDoc('accountants', a.id))} className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </div>
                        ))}
                        {accountants.length === 0 && <div className="text-center text-gray-400 text-sm py-6">Chưa có kế toán</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quản lý Cửa hàng */}
                <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><MapPin className="w-5 h-5"/> Cửa Hàng</h3>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="space-y-3 mb-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">Tên cửa hàng</label>
                        <input type="text" placeholder="Cửa hàng ABC" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">Kế toán phụ trách</label>
                        <select className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm" value={newStoreAccId} onChange={e => setNewStoreAccId(e.target.value)}>
                          <option value="">-- Chọn kế toán --</option>
                          {accountants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">Mật khẩu</label>
                        <input type="password" placeholder="Nhập mật khẩu" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm" value={newStorePwd} onChange={e => setNewStorePwd(e.target.value)} />
                      </div>
                      <button onClick={handleAddStore} className="w-full py-2.5 mt-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4"/> Thêm Mới
                      </button>
                    </div>

                    <div className="border-t pt-4 flex-1">
                      <h4 className="text-xs font-bold text-gray-600 mb-3 uppercase">Danh sách ({stores.length})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {stores.map(s => {
                          const assignedAcc = accountants.find(a => a.id === s.accountantId);
                          return (
                            <div key={s.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200 group hover:bg-amber-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-800 text-sm truncate">{s.name}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {assignedAcc ? (
                                      <span>📊 Kế toán: <strong>{assignedAcc.name}</strong></span>
                                    ) : (
                                      <span className="text-red-500">⚠️ Chưa gán kế toán</span>
                                    )}
                                  </div>
                                </div>
                                <button onClick={() => deleteDoc(getPublicDoc('stores', s.id))} className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="w-4 h-4"/>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {stores.length === 0 && <div className="text-center text-gray-400 text-sm py-6">Chưa có cửa hàng</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Điều chỉnh gán Kế toán cho Cửa hàng */}
                <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus className="w-5 h-5"/> Điều Chỉnh Gán</h3>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-xs text-gray-600 mb-4">Phân bổ lại kế toán cho cửa hàng</p>

                    <div className="space-y-4 flex-1">
                      {stores.map(s => (
                        <div key={s.id} className="p-3 border border-green-200 rounded-lg bg-green-50">
                          <label className="text-xs font-semibold text-gray-700 block mb-2">{s.name}</label>
                          <select
                            value={s.accountantId || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                updateDoc(getPublicDoc('stores', s.id), { accountantId: e.target.value });
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm"
                          >
                            <option value="">-- Chọn kế toán --</option>
                            {accountants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600">
                            {s.accountantId ? (
                              <span>✓ Gán: <strong>{accountants.find(a => a.id === s.accountantId)?.name}</strong></span>
                            ) : (
                              <span className="text-red-500">✗ Chưa gán</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {stores.length === 0 && <div className="text-center text-gray-400 text-sm py-6">Tạo cửa hàng trước</div>}
                    </div>
                  </div>
                </div>

                {/* Quản lý Cung ứng */}
                <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><UserPlus className="w-5 h-5"/> Cung Ứng</h3>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="space-y-3 mb-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">Tên nhà cung cấp</label>
                        <input type="text" placeholder="Nhập tên cung ứng" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">Mật khẩu</label>
                        <input type="password" placeholder="Nhập mật khẩu" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm" value={newSupplierPwd} onChange={e => setNewSupplierPwd(e.target.value)} />
                      </div>
                      <button onClick={() => {
                        if (newSupplierName.trim() && newSupplierPwd.trim()) {
                          const supplierId = `SUP_${Date.now()}`;
                          setDoc(getPublicDoc('suppliers', supplierId), {
                            name: newSupplierName,
                            password: newSupplierPwd,
                            createdAt: new Date().toISOString(),
                          });
                          setNewSupplierName('');
                          setNewSupplierPwd('');
                          showToast('✅ Thêm cung ứng thành công!');
                        } else {
                          showToast('❌ Vui lòng điền đầy đủ thông tin!');
                        }
                      }} className="w-full py-2.5 mt-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4"/> Thêm Mới
                      </button>
                    </div>

                    <div className="border-t pt-4 flex-1">
                      <h4 className="text-xs font-bold text-gray-600 mb-3 uppercase">Danh sách ({suppliers.length})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {suppliers.map(sup => (
                          <div key={sup.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex items-start justify-between group hover:bg-purple-100 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 text-sm truncate">{sup.name}</div>
                              <div className="text-xs text-gray-600 font-mono mt-1">{sup.id}</div>
                            </div>
                            <button onClick={() => deleteDoc(getPublicDoc('suppliers', sup.id))} className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </div>
                        ))}
                        {suppliers.length === 0 && <div className="text-center text-gray-400 text-sm py-6">Chưa có cung ứng</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUẢN LÝ HÓA ĐƠN TAB - SUPPLIER ONLY */}
        {role === 'QUANLYHOADON' && loginUser?.role === 'supplier' && (
          <div className="max-w-6xl mx-auto p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-xl shadow-lg">
                <FileText className="w-6 h-6"/>
                <div>
                  <h2 className="text-2xl font-bold">Quản Lý Hoá Đơn</h2>
                  <p className="text-sm text-purple-100">Xử lý yêu cầu hoá đơn từ kế toán</p>
                </div>
              </div>

              {/* Invoice Requests Table */}
              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
                  <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5"/> Yêu Cầu Hoá Đơn ({invoiceRequests.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700">ID</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700">Cửa Hàng</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700">Số Tiền</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700">Ghi Chú</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700">Trạng Thái</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceRequests.map(req => (
                        <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-gray-800">{req.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{stores.find(s => s.id === req.storeId)?.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-800">{req.amount?.toLocaleString('vi-VN')} đ</td>
                          <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{req.note || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              req.status === 'Đã gửi'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {req.status || 'Chờ xử lý'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => setSelectedInvoiceRequest(req)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <FileUp className="w-3 h-3"/> Gửi HĐ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {invoiceRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                      <p>Chưa có yêu cầu hoá đơn</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SUBMIT INVOICE */}
        {selectedInvoiceRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><FileUp className="w-5 h-5"/> Gửi Hoá Đơn</h3>
                <button onClick={() => setSelectedInvoiceRequest(null)} className="text-white hover:bg-white/20 rounded p-1">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-2">Yêu cầu từ</p>
                  <p className="font-bold text-gray-800">{stores.find(s => s.id === selectedInvoiceRequest.storeId)?.name}</p>
                  <p className="text-xs text-gray-600 mt-2">Số tiền: <strong>{selectedInvoiceRequest.amount?.toLocaleString('vi-VN')} đ</strong></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú hoá đơn</label>
                  <textarea
                    placeholder="Nhập ghi chú..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 text-center cursor-pointer hover:bg-purple-50 transition-colors">
                  <Paperclip className="w-6 h-6 text-purple-600 mx-auto mb-2"/>
                  <p className="text-sm font-medium text-gray-700">Đính kèm file hoá đơn</p>
                  <p className="text-xs text-gray-500">PDF, Excel hoặc ảnh</p>
                  <input type="file" className="hidden" accept=".pdf,.xlsx,.xls,.jpg,.png" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSelectedInvoiceRequest(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      updateDoc(getPublicDoc('invoiceRequests', selectedInvoiceRequest.id), {
                        status: 'Đã gửi',
                        submittedAt: new Date().toISOString(),
                      });
                      setSelectedInvoiceRequest(null);
                      showToast('✅ Gửi hoá đơn thành công!');
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4"/> Gửi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: XEM CHI TIẾT HÀNG HÓA */}
        {selectedReceiptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-96 overflow-auto">
              <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex justify-between items-center border-b">
                <h3 className="text-xl font-bold">Phiếu: {selectedReceiptModal.id}</h3>
                <button onClick={() => setSelectedReceiptModal(null)} className="text-white hover:bg-white/20 rounded p-1">✕</button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b">
                  <div>
                    <div className="text-xs text-gray-500">Ngày nhập</div>
                    <div className="font-medium text-gray-800">{selectedReceiptModal.date}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Cửa hàng</div>
                    <div className="font-medium text-gray-800">{stores.find(s => s.id === selectedReceiptModal.storeId)?.name || selectedReceiptModal.creator}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Trạng thái</div>
                    <div className={`text-sm font-medium px-2 py-1 rounded border w-fit ${STATUSES[selectedReceiptModal.status]?.color}`}>{STATUSES[selectedReceiptModal.status]?.label}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Mã ERP</div>
                    <div className="font-medium text-gray-800">{selectedReceiptModal.erpId || '-'}</div>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-4 h-4"/> Danh sách hàng hóa</h4>
                  <div className="space-y-3">
                    {selectedReceiptModal.items.map((it, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm">{it.product.name}</div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{it.product.id}</div>
                          </div>
                          <div className="font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded text-sm ml-4 shrink-0">x{it.quantity}</div>
                        </div>
                        {it.note && <div className="text-xs text-yellow-700 bg-yellow-50 p-1 rounded mb-2">📝 Ghi chú: {it.note}</div>}
                        {it.condition && it.condition !== 'NORMAL' && (
                          <div className={`text-xs font-medium px-2 py-1 rounded border ${ITEM_CONDITIONS[it.condition]?.color}`}>
                            {ITEM_CONDITIONS[it.condition]?.icon} {ITEM_CONDITIONS[it.condition]?.label}
                          </div>
                        )}
                        {(!it.condition || it.condition === 'NORMAL') && (
                          <div className={`text-xs font-medium px-2 py-1 rounded border ${ITEM_CONDITIONS['NORMAL']?.color}`}>
                            {ITEM_CONDITIONS['NORMAL']?.icon} {ITEM_CONDITIONS['NORMAL']?.label}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedReceiptModal.generalNote && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm">
                    <span className="font-bold text-yellow-900">🚗 Xe/Tài xế:</span> {selectedReceiptModal.generalNote}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ĐỔI MẬT KHẨU ADMIN */}
        {isChangePasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><Lock className="w-5 h-5"/> Đổi mật khẩu Admin</h3>
                <button onClick={() => { setIsChangePasswordModal(false); setNewAdminPassword(''); setConfirmAdminPassword(''); }} className="text-white hover:bg-white/20 rounded p-1">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={newAdminPassword}
                    onChange={e => setNewAdminPassword(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmAdminPassword}
                    onChange={e => setConfirmAdminPassword(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setIsChangePasswordModal(false); setNewAdminPassword(''); setConfirmAdminPassword(''); }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleChangeAdminPassword}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TÁCH PHIẾU */}
        {splitReceiptId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center sticky top-0">
                <h3 className="text-xl font-bold flex items-center gap-2"><ArrowRight className="w-5 h-5"/> Tách Phiếu</h3>
                <button onClick={() => { setSplitReceiptId(''); setSplitNote(''); setSelectedItemsWithInvoice([]); }} className="text-white hover:bg-white/20 rounded p-1">✕</button>
              </div>

              <div className="p-6 space-y-6">
                {receipts.find(r => r.id === splitReceiptId) && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-800 mb-3">Chọn mã hàng nào có hoá đơn?</h4>
                      <p className="text-sm text-gray-600 mb-4">✅ Sẽ tạo 2 phiếu: 1 phiếu có H.Đ + 1 phiếu chờ H.Đ</p>

                      <div className="space-y-2">
                        {receipts.find(r => r.id === splitReceiptId)?.items.map((item, idx) => (
                          <label key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedItemsWithInvoice.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItemsWithInvoice([...selectedItemsWithInvoice, idx]);
                                } else {
                                  setSelectedItemsWithInvoice(selectedItemsWithInvoice.filter(i => i !== idx));
                                }
                              }}
                              className="w-4 h-4 mt-1 cursor-pointer accent-blue-600"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{item.product.name}</div>
                              <div className="text-xs text-gray-500 font-mono">ID: {item.product.id}</div>
                              <div className="text-xs text-gray-600 mt-1">Số lượng: <strong>x{item.quantity}</strong></div>
                            </div>
                            <div className="text-blue-600 font-bold text-lg">✓</div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-800 mb-3">Ghi chú cho phiếu chờ H.Đ</h4>
                      <textarea
                        placeholder="VD: Nhà cung cấp chưa gửi H.Đ, dự kiến 25/4/2026&#10;hoặc: Chủ cửa hàng chưa thanh toán&#10;hoặc: Đang chờ từ bộ phận kế toán"
                        value={splitNote}
                        onChange={e => setSplitNote(e.target.value)}
                        className="w-full p-3 border border-orange-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-2">💡 Ghi chú sẽ giúp các bên biết tại sao chưa có H.Đ</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setSplitReceiptId(''); setSplitNote(''); setSelectedItemsWithInvoice([]); }}
                        className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSplitReceipt}
                        disabled={selectedItemsWithInvoice.length === 0}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✓ Tách Phiếu ({selectedItemsWithInvoice.length}/{receipts.find(r => r.id === splitReceiptId)?.items.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: XÁC NHẬN XÓA PHIẾU */}
        {deleteReceiptId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Xóa phiếu?</h3>
                <button onClick={() => { setDeleteReceiptId(''); setDeletePassword(''); }} className="text-white hover:bg-white/20 rounded p-1">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ⚠️ Bạn sắp xóa phiếu <strong>{deleteReceiptId}</strong>. Hành động này không thể hoàn tác!
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nhập mật khẩu Admin để xác nhận</label>
                  <input
                    type="password"
                    placeholder="Mật khẩu Admin"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDeleteReceipt(deleteReceiptId, deletePassword)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setDeleteReceiptId(''); setDeletePassword(''); }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleDeleteReceipt(deleteReceiptId, deletePassword)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
        </>
      )}
    </div>
  );
}