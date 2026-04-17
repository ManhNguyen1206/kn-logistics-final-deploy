#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# CẬP NHẬT 2 TÍNH NĂNG - KN-LOGISTICS APP
# ═══════════════════════════════════════════════════════════════════════════════
# TÍNH NĂNG 1: Hoá Đơn - Hiển thị thêm: Ngày nhập, Cửa hàng, Xe nhập
# TÍNH NĂNG 2: Theo Dõi - Sắp xếp mới nhất trên cùng + Thêm thông tin chi tiết
# ═══════════════════════════════════════════════════════════════════════════════

cd ~/kn-logistics/kn-logistics-final-deploy

echo "🔧 Bắt đầu cập nhật tính năng..."
echo ""

# BƯỚC 1: Backup file gốc
echo "📦 Backup file App.tsx..."
cp src/App.tsx src/App.tsx.backup
echo "✅ Backup hoàn tất"
echo ""

# BƯỚC 2: Cập nhật code
echo "✏️  Cập nhật code..."

# CẬP NHẬT 1: HOÁĐƠN - Thêm ngày nhập, cửa hàng, xe nhập
# Tìm dòng 705-748 và replace section invoice card

sed -i.bak '705,748c\
                  {receipts.filter(r => r.status === '"'"'WAITING_INVOICE'"'"').map(r => {\
                    const storeName = stores.find(s => s.id === r.storeId)?.name || r.creator;\
                    return (\
                    <div key={r.id} className="bg-white p-5 rounded-2xl shadow-md border border-emerald-100 flex flex-col justify-between">\
                      <div className="mb-4">\
                        <div className="flex justify-between items-center mb-2">\
                          <span \
                            className="font-bold text-emerald-600 text-lg block cursor-pointer hover:text-blue-800 hover:underline transition-all"\
                            onClick={() => { setFilterReceiptId(r.id); setRole('"'"'TRACKING'"'"'); }}\
                            title="Xem trên Sổ Theo Dõi"\
                          >\
                            {r.id}\
                          </span>\
                          <span className="text-[10px] font-medium bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">CHỜ HÓA ĐƠN</span>\
                        </div>\
                        <div className="text-xs text-gray-600 space-y-1 mb-3">\
                          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400"/> Ngày nhập: <strong>{r.date.split('"'"' '"'"')[0]}</strong></div>\
                          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400"/> Cửa hàng: <strong>{storeName}</strong></div>\
                        </div>\
                        \
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">\
                          <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Chi tiết vật tư nhập</div>\
                          <ul className="space-y-2">\
                            {r.items.map((it: any, i: number) => (\
                              <li key={i} className="flex justify-between items-start text-sm">\
                                 <span className="text-gray-700 pr-4">{it.product.name}</span>\
                                 <span className="font-bold text-gray-800 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm shrink-0">x{it.quantity}</span>\
                              </li>\
                            ))}\
                          </ul>\
                        </div>\
                        \
                        {r.generalNote && (\
                          <div className="text-sm bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200">\
                             <span className="font-bold text-xs uppercase block mb-1">🚗 Xe / Tài xế:</span>\
                             {r.generalNote}\
                          </div>\
                        )}\
                      </div>\
                      \
                      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 text-center relative hover:bg-indigo-50 hover:border-indigo-300 transition-colors">\
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />\
                        <span className="text-sm font-medium text-yellow-600 block mb-0.5">Tải lên hóa đơn</span>\
                        <p className="text-[10px] text-gray-500">JPG, PNG, PDF (Max 1MB)</p>\
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, image/png, image/jpeg" onChange={(e: any) => handleSendInvoice(r.id, e.target.files[0])} />\
                      </div>\
                    </div>\
                    );\
                  })}' src/App.tsx

echo "✅ Cập nhật Hoá Đơn: Thêm ngày nhập, cửa hàng, xe"
echo ""

# CẬP NHẬT 2: THEO DÕI - Sắp xếp mới nhất trên cùng + Thêm thông tin
# Replace phần filter và sort
sed -i.bak '811,827c\
                  {receipts.filter(r => {\
                      const rDate = r.date.split('"'"' '"'"')[0];\
                      const matchId = !filterReceiptId || r.id.toLowerCase().includes(filterReceiptId.toLowerCase());\
                      return matchId &&\
                             (!filterStore || r.storeId === filterStore) && \
                             (!filterAcc || r.accountantId === filterAcc) &&\
                             (!filterStartDate || rDate >= filterStartDate) &&\
                             (!filterEndDate || rDate <= filterEndDate);\
                  }).sort((a, b) => {\
                      const dateA = new Date(a.date).getTime();\
                      const dateB = new Date(b.date).getTime();\
                      return dateB - dateA;\
                  }).map(r => {\
                    const storeName = stores.find(s => s.id === r.storeId)?.name || r.creator;\
                    const itemCount = r.items.length;\
                    return (\
                    <tr key={r.id} className="hover:bg-gray-50 border-b">\
                      <td className="p-3 font-mono text-xs text-emerald-600 font-bold">{r.id}</td>\
                      <td className="p-3">\
                        <div className="text-gray-800 font-medium text-sm">{storeName}</div>\
                        <div className="text-gray-500 text-xs mt-0.5">{r.items.length} mặt hàng</div>\
                      </td>\
                      <td className="p-3">\
                        <div className="text-gray-800 text-sm">{r.date.split('"'"' '"'"')[0]}</div>\
                        <div className="text-gray-500 text-xs mt-0.5">{r.date.split('"'"' '"'"')[1]}</div>\
                      </td>\
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs border ${STATUSES[r.status]?.color || '"'"'bg-gray-100'"'"'}`}>{STATUSES[r.status]?.label || '"'"'NEW'"'"'}</span></td>\
                      <td className="p-3 font-mono text-gray-700">{r.erpId || '"'"'-'"'"'}</td>\
                    </tr>\
                    );\
                  })}' src/App.tsx

echo "✅ Cập nhật Theo Dõi: Sắp xếp mới nhất + Thêm thông tin chi tiết"
echo ""

# Xóa backup files
rm -f src/App.tsx.bak src/App.tsx.bak.bak

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔨 Build dự án..."
npm run build

echo ""
echo "🚀 Deploy lên Vercel..."
npx vercel --prod --yes --force

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ CẬP NHẬT HOÀN TẤT!                                 ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "✨ Tính năng được cập nhật:"
echo "   1. ✅ Hoá Đơn: Hiển thị ngày nhập, cửa hàng, xe/tài xế"
echo "   2. ✅ Theo Dõi: Sắp xếp mới nhất trên cùng, thêm số lượng mặt hàng"
echo ""
echo "🔗 Website live: https://kn-logistics-final-deploy.vercel.app"
echo ""
echo "💡 Tip: Nhấn Cmd+Shift+R (Mac) hoặc Ctrl+Shift+Delete (Windows) để refresh"
echo ""
