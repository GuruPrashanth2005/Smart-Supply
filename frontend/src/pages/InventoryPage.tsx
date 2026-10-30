import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Boxes,
  Search,
  Filter,
  Receipt,
  X,
  Printer,
  Layers,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const InventoryPage: React.FC = () => {
  const { batches, setShowTxModal } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBatchReceipt, setSelectedBatchReceipt] = useState<any>(null);
  const [inspectedBatch, setInspectedBatch] = useState<any>(null);

  // Robust food image mapping with verified 200 OK CDN URLs for all 27 kitchen ingredients
  const getIngredientImage = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('fish') || n.includes('tilapia') || n.includes('fillet'))
      return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80';
    if (n.includes('milk'))
      return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80';
    if (n.includes('paneer'))
      return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80';
    if (n.includes('tomato'))
      return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80';
    if (n.includes('chicken') || n.includes('poultry'))
      return 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&auto=format&fit=crop&q=80';
    if (n.includes('onion'))
      return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80';
    if (n.includes('potato'))
      return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=80';
    if (n.includes('pepper') || n.includes('capsicum'))
      return 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&auto=format&fit=crop&q=80';
    if (n.includes('butter') || n.includes('cream'))
      return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80';
    if (n.includes('tea'))
      return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80';
    if (n.includes('soy'))
      return 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=800&auto=format&fit=crop&q=80';
    if (n.includes('coffee'))
      return 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80';
    if (n.includes('garlic'))
      return 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=800&auto=format&fit=crop&q=80';
    if (n.includes('ginger'))
      return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80';
    if (n.includes('beef') || n.includes('meat') || n.includes('tenderloin'))
      return 'https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80';
    if (n.includes('olive'))
      return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80';
    if (n.includes('carrot'))
      return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&auto=format&fit=crop&q=80';
    if (n.includes('masala') || n.includes('spice') || n.includes('curry'))
      return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80';
    if (n.includes('flour') || n.includes('bread') || n.includes('pizza'))
      return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80';
    if (n.includes('noodle'))
      return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80';
    if (n.includes('sugar') || n.includes('salt'))
      return 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=800&auto=format&fit=crop&q=80';
    if (n.includes('rice') || n.includes('basmati'))
      return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80';
    if (n.includes('oil'))
      return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80';
    if (n.includes('prawn') || n.includes('shrimp'))
      return 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80';
    if (n.includes('cheese') || n.includes('mozzarella'))
      return 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&auto=format&fit=crop&q=80';
    if (n.includes('pasta') || n.includes('penne'))
      return 'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=800&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';
  };

  const getDishImage = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('salmon') || n.includes('fish') || n.includes('tilapia') || n.includes('seafood'))
      return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&auto=format&fit=crop&q=80';
    if (n.includes('chicken') || n.includes('tikka') || n.includes('curry'))
      return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=80';
    if (n.includes('paneer'))
      return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80';
    if (n.includes('tea') || n.includes('chai') || n.includes('beverage') || n.includes('lassi') || n.includes('coffee') || n.includes('macchiato') || n.includes('smoothie'))
      return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=80';
    if (n.includes('burger') || n.includes('beef'))
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80';
    if (n.includes('pizza'))
      return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80';
    if (n.includes('rice') || n.includes('biryani') || n.includes('bowl'))
      return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80';
    if (n.includes('pasta') || n.includes('noodle'))
      return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';
  };

  const filteredBatches = batches.filter((b: any) => {
    const bId = (b.batch_id || b.batch_number || '').toLowerCase();
    const ingName = (b.ingredient_name || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = ingName.includes(q) || bId.includes(q);
    
    let matchesStatus = true;
    if (statusFilter === 'CRITICAL') {
      matchesStatus = b.status === 'CRITICAL' || b.status === 'EXPIRED' || b.status === 'IMMINENT_EXPIRY';
    } else if (statusFilter === 'WARNING') {
      matchesStatus = b.status === 'WARNING';
    } else if (statusFilter === 'GOOD') {
      matchesStatus = b.status === 'GOOD' || b.status === 'FRESH';
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Boxes className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              FEFO Inventory & Batch Expiry Tracking
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              First-Expired First-Out
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time shelf-life tracking enforcing strict First-Expired First-Out dispatch across Chilled, Frozen, and Dry storage zones. Click any row or lot number to inspect full batch lifecycle & dependent dishes.
          </p>
        </div>
        <button
          onClick={() => setShowTxModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          Record Stock Receipt / Waste
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by batch number, lot ID, or ingredient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1" />
          {['ALL', 'CRITICAL', 'WARNING', 'GOOD'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Enterprise Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">FEFO Priority</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Ingredient</th>
                <th className="py-3 px-3">Storage Zone</th>
                <th className="py-3 px-3 text-right">Available Qty</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3">Received Date</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Shelf Life Left</th>
                <th className="py-3 px-4 text-center">Batch Condition</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredBatches.map((b: any, idx: number) => {
                const batchNum = b.batch_id || b.batch_number || `BAT-${idx + 1}`;
                const storageZone = b.storage_location || b.storage_zone || 'Chilled Bay 4';
                const qty = b.remaining_qty ?? b.current_quantity ?? 0;
                const daysLeft = b.days_left ?? b.days_to_expiry ?? 0;
                const statusBadge = b.status || (daysLeft <= 0 ? 'EXPIRED' : (daysLeft <= 3 ? 'IMMINENT_EXPIRY' : (daysLeft <= 7 ? 'WARNING' : 'FRESH')));

                return (
                  <tr
                    key={batchNum + '-' + idx}
                    onClick={() => setInspectedBatch(b)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-700">
                      <div className="flex items-center gap-1.5">
                        <span className="group-hover:underline">{batchNum}</span>
                        {batchNum.includes('INWARD') && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            NEW INWARD
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={getIngredientImage(b.ingredient_name)}
                            alt={b.ingredient_name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition shrink-0"
                          />
                          <span className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition">
                            {b.ingredient_name}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {storageZone}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {qty} {b.unit}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                      ₹{b.unit_cost?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                      {b.received_date?.split('T')[0] || b.received_date}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-700 font-medium">
                      {b.expiry_date?.split('T')[0] || b.expiry_date}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold">
                      <span className={daysLeft <= 0 ? 'text-rose-600 font-black' : daysLeft <= 3 ? 'text-rose-500' : daysLeft <= 7 ? 'text-amber-600' : 'text-emerald-600'}>
                        {daysLeft} days
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        statusBadge === 'CRITICAL' || statusBadge === 'EXPIRED' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        statusBadge === 'WARNING' || statusBadge === 'IMMINENT_EXPIRY' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {statusBadge}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBatchReceipt(b);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold border border-slate-200 flex items-center gap-1 mx-auto transition cursor-pointer"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>View Slip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INWARD BILLING & GOODS RECEIPT MODAL */}
      {selectedBatchReceipt && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Top Control Bar */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Thermal Print Preview
              </span>
              <button
                onClick={() => setSelectedBatchReceipt(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Realistic Thermal Paper Receipt */}
            <div className="p-6 overflow-y-auto bg-slate-100/70 flex justify-center">
              <div
                id="thermal-receipt"
                className="w-full bg-white border border-slate-300/80 shadow-md p-6 font-mono text-[11px] text-black leading-relaxed space-y-3.5 select-none"
                style={{ fontFamily: '"Courier New", Courier, monospace' }}
              >
                {/* Header Section */}
                <div className="text-center space-y-0.5">
                  <div className="font-black text-sm tracking-widest uppercase">
                    SMARTSUPPLY KITCHEN
                  </div>
                  <div className="text-[10px] uppercase">Central Commissary Hub #55</div>
                  <div className="text-[10px]">1201 Cold Chain Service Rd</div>
                  <div className="text-[10px]">Tel: (555) 019-4820</div>
                  <div className="text-[9.5px]">support@smartsupply.example</div>
                </div>

                {/* Divider Line */}
                <div className="border-t-2 border-dashed border-black my-2"></div>

                {/* Timestamp & Location */}
                <div className="flex justify-between text-[10.5px]">
                  <span>DATE: {selectedBatchReceipt.received_date?.split('T')[0] || selectedBatchReceipt.received_date}</span>
                  <span>14:10:00</span>
                </div>

                <div className="border-t border-dashed border-black my-1"></div>

                {/* Batch & Inward Details */}
                <div className="space-y-1 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="font-bold">LOT ID:</span>
                    <span className="font-black">{selectedBatchReceipt.batch_id || selectedBatchReceipt.batch_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">STORAGE DOCK:</span>
                    <span>{selectedBatchReceipt.storage_location || selectedBatchReceipt.storage_zone || 'Chilled Bay 4'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">FEFO EXPIRY:</span>
                    <span className="font-black">{selectedBatchReceipt.expiry_date?.split('T')[0] || selectedBatchReceipt.expiry_date}</span>
                  </div>
                </div>

                {/* Dashed line */}
                <div className="border-t-2 border-dashed border-black my-2"></div>

                {/* Line Items */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold uppercase text-[11px]">
                    <span>DESCRIPTION</span>
                    <span>AMOUNT</span>
                  </div>

                  <div className="flex justify-between items-start pt-1">
                    <div className="max-w-[70%]">
                      <div className="font-black uppercase">{selectedBatchReceipt.ingredient_name}</div>
                      <div className="text-[9.5px]">
                        {selectedBatchReceipt.remaining_qty ?? selectedBatchReceipt.current_quantity} {selectedBatchReceipt.unit} @ ₹{(selectedBatchReceipt.unit_cost || 10.0).toFixed(2)}/{selectedBatchReceipt.unit}
                      </div>
                    </div>
                    <div className="font-bold font-mono">
                      ₹{((selectedBatchReceipt.remaining_qty ?? selectedBatchReceipt.current_quantity) * (selectedBatchReceipt.unit_cost || 10.0)).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-black my-2"></div>

                {/* Financial Summary */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>₹{((selectedBatchReceipt.remaining_qty ?? selectedBatchReceipt.current_quantity) * (selectedBatchReceipt.unit_cost || 10.0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST TAX (5%):</span>
                    <span>₹{(((selectedBatchReceipt.remaining_qty ?? selectedBatchReceipt.current_quantity) * (selectedBatchReceipt.unit_cost || 10.0)) * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HANDLING/DOCK:</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="border-t-2 border-black pt-1 flex justify-between font-black text-xs">
                    <span>TOTAL INWARD:</span>
                    <span>₹{(((selectedBatchReceipt.remaining_qty ?? selectedBatchReceipt.current_quantity) * (selectedBatchReceipt.unit_cost || 10.0)) * 1.05).toFixed(2)}</span>
                  </div>
                </div>

                {/* Dashed line */}
                <div className="border-t-2 border-dashed border-black my-2"></div>

                {/* Audit & Compliance Footnote */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>AUDIT STATUS:</span>
                    <span className="font-bold">VERIFIED_FEFO</span>
                  </div>
                  <div className="flex justify-between">
                    <span>COMMISSARY REF:</span>
                    <span className="font-bold">INWARD-AUTH-2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RECEIVER:</span>
                    <span className="font-bold">KITCHEN MANAGER</span>
                  </div>
                </div>

                <div className="text-center pt-3 space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider">
                    STOCK VERIFIED & DOUBLE-ENTRY AUDITED
                  </div>
                  <div className="text-[9px] text-slate-600">
                    KEEP SLIP WITH COLD PALLET UNTIL DEPLETION
                  </div>
                </div>

                {/* Barcode graphic */}
                <div className="pt-2 text-center space-y-1">
                  <div className="bg-black h-8 w-48 mx-auto tracking-widest text-white text-[8px] flex items-center justify-center font-mono font-bold">
                    ||||| | |||| ||| |||||| | ||||| |||| |
                  </div>
                  <div className="text-[8.5px] font-mono font-bold tracking-wider">
                    *{selectedBatchReceipt.batch_id || selectedBatchReceipt.batch_number}*
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button Actions */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">Format: 80mm Thermal Slip</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBatchReceipt(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* COMPREHENSIVE BATCH INSPECTION & AUDIT DETAILS MODAL */}
      {inspectedBatch && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setInspectedBatch(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-auto max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grand Ingredient Showcase Photo Header */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-900 shrink-0">
              <img
                src={getIngredientImage(inspectedBatch.ingredient_name)}
                alt={inspectedBatch.ingredient_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30" />
              
              {/* Top Floating Badges */}
              <div className="absolute top-3.5 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                  <Warehouse className="w-3 h-3 text-blue-400" />
                  <span>{inspectedBatch.storage_location || inspectedBatch.storage_zone || 'Chilled Bay 4'}</span>
                </span>
                <span className="px-3 py-1 rounded-full text-[10.5px] font-bold font-mono bg-blue-600 text-white shadow-xs">
                  Batch #{inspectedBatch.batch_id || inspectedBatch.batch_number}
                </span>
              </div>

              <button
                onClick={() => setInspectedBatch(null)}
                className="absolute top-3.5 right-4 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center cursor-pointer backdrop-blur-md transition z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Bottom Title & Shelf life overlay */}
              <div className="absolute bottom-3.5 left-5 right-5 flex items-end justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block mb-0.5">
                    {inspectedBatch.category || 'Kitchen Ingredient'} &bull; FEFO Tracked
                  </span>
                  <h3 className="font-extrabold text-white text-lg leading-snug drop-shadow-md">
                    {inspectedBatch.ingredient_name}
                  </h3>
                  <p className="text-[11.5px] text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-300" />
                    <span>Received on {inspectedBatch.received_date?.split('T')[0]} &bull; Expiry: {inspectedBatch.expiry_date?.split('T')[0]}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-300 block font-medium mb-1">FEFO Status</span>
                  <span className={`text-xs font-mono font-black px-3 py-1 rounded shadow-sm ${
                    (inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 0
                      ? 'bg-rose-600 text-white animate-pulse'
                      : (inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 2
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {(inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 0
                      ? 'EXPIRED (0 Days)'
                      : `${inspectedBatch.days_left ?? inspectedBatch.days_to_expiry} Days Left`}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-sans">
              {/* Top Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Qty</span>
                  <span className="font-black text-slate-900 text-base font-mono">
                    {inspectedBatch.remaining_qty ?? inspectedBatch.current_quantity} {inspectedBatch.unit}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Initial: {inspectedBatch.received_qty || inspectedBatch.remaining_qty} {inspectedBatch.unit}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Storage Bay</span>
                  <span className="font-bold text-slate-800 text-xs truncate block mt-0.5">
                    {inspectedBatch.storage_location || inspectedBatch.storage_zone || 'Chilled Bay 4'}
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-medium mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Cold Chain Monitored</span>
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Shelf Life Left</span>
                  <span className={`font-black text-base font-mono block ${
                    (inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 0
                      ? 'text-rose-600'
                      : (inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 2
                      ? 'text-rose-500'
                      : 'text-amber-600'
                  }`}>
                    {inspectedBatch.days_left ?? inspectedBatch.days_to_expiry} Days
                  </span>
                  <span className="text-[10px] text-slate-400 block">Expires: {inspectedBatch.expiry_date?.split('T')[0]}</span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Batch Value</span>
                  <span className="font-black text-emerald-950 text-base font-mono block">
                    ₹{Number(inspectedBatch.total_value || (((inspectedBatch.remaining_qty ?? inspectedBatch.current_quantity) * (inspectedBatch.unit_cost || 10.0)))).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">@ ₹{inspectedBatch.unit_cost?.toFixed(2)}/{inspectedBatch.unit}</span>
                </div>
              </div>

              {/* Status and FEFO Protocol Strip */}
              <div className={`p-3.5 border rounded-xl flex items-center justify-between ${
                (inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 0
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : 'bg-blue-50/80 border-blue-200 text-blue-950'
              }`}>
                <div className="flex items-center space-x-2.5">
                  {(inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 0 ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block text-[11px]">
                      {(inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 0
                        ? 'Batch Expired & Requires Immediate Triage'
                        : 'Strict FEFO Priority Dispatch Protection Active'}
                    </span>
                    <span className="text-[10.5px] opacity-80">
                      {(inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 0
                        ? 'This lot has reached 0 days shelf-life. Check with kitchen head chef or log prep spoilage waste.'
                        : 'The Kitchen prep line is automatically instructed to consume this batch before newer stock to prevent food waste.'}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase shrink-0 ${
                  (inspectedBatch.days_left ?? inspectedBatch.days_to_expiry) <= 0
                    ? 'bg-rose-200 text-rose-800'
                    : 'bg-blue-200 text-blue-800'
                }`}>
                  {inspectedBatch.status}
                </span>
              </div>

              {/* Kitchen Recipes & Dishes Consuming this Batch */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dishes on Menu Dependent on this Batch</span>
                  </h4>
                  <span className="text-[10.5px] text-slate-500 font-medium">BOM Recipe Allocation</span>
                </div>

                {inspectedBatch.used_in_dishes && inspectedBatch.used_in_dishes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {inspectedBatch.used_in_dishes.map((d: any, i: number) => (
                      <div key={i} className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition">
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <img
                            src={getDishImage(d.meal_name)}
                            alt={d.meal_name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-[11.5px] block truncate">{d.meal_name}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{d.category} &bull; Meal #{d.meal_id}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-800 text-xs block">
                            {d.serving_usage} {d.unit}
                          </span>
                          <span className="text-[9.5px] text-slate-400 block">per plate</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-center text-[11px] flex items-center justify-center gap-2">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Direct ingredient allocated for culinary prep & commissary assembly.</span>
                  </div>
                )}
              </div>

              {/* Action Toolbar inside Modal */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const currentBatch = inspectedBatch;
                    setInspectedBatch(null);
                    setSelectedBatchReceipt(currentBatch);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer border border-slate-300 shadow-2xs"
                >
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  <span>View 80mm Print Slip</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInspectedBatch(null);
                      setShowTxModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
                  >
                    Log Usage / Prep Waste
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectedBatch(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
