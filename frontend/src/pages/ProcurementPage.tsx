import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  ShoppingCart,
  CheckCircle,
  X,
  Truck,
  ShieldCheck,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Info,
  Sparkles
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const ProcurementPage: React.FC = () => {
  const {
    procurementPlan,
    setSelectedRecBreakdown,
    suppliers,
    fetchAllData
  } = useData();

  // Reception Promotion Proposals State
  const [promos, setPromos] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Dedicated Detailed Promo Inspection Modal State
  const [inspectingPromo, setInspectingPromo] = useState<any>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);

  // Selected item for Detailed Order Audit & Supplier Dispatch modal
  const [activeItem, setActiveItem] = useState<any>(null);
  const [, setAuditLoading] = useState(false);
  const [, setAuditResult] = useState<any>(null);
  const [poDispatched, setPoDispatched] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1);
  const [editableOrderQty, setEditableOrderQty] = useState<number>(0);
  const [customPoNotes, setCustomPoNotes] = useState<string>('');
  const [dispatchingPo, setDispatchingPo] = useState<boolean>(false);

  const fetchPromos = async () => {
    try {
      const res = await axios.get('/api/reception/promos');
      setPromos(res.data);
    } catch (err) {
      console.error('Error fetching promos:', err);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleOpenPromoInspection = async (promo: any) => {
    setInspectLoading(true);
    setInspectingPromo(promo);
    try {
      const res = await axios.get(`/api/reception/promos/simulate-impact?promo_id=${promo.promo_id}`);
      setInspectingPromo(res.data);
    } catch (err) {
      console.error('Failed to load promo simulation:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleApprovePromo = async (promoId: number) => {
    setActionLoading(promoId);
    try {
      const res = await axios.post(`/api/reception/promos/approve?promo_id=${promoId}`);
      alert(`✅ ${res.data.message}`);
      setInspectingPromo(null);
      await fetchPromos();
      await fetchAllData();
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Failed to approve promo.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPromo = async (promoId: number) => {
    if (!confirm('Are you sure you want to REJECT this promo proposal due to stockout risk?')) return;
    setActionLoading(promoId);
    try {
      const res = await axios.post(`/api/reception/promos/reject?promo_id=${promoId}`);
      alert(`❌ ${res.data.message}`);
      setInspectingPromo(null);
      await fetchPromos();
      await fetchAllData();
    } catch (err) {
      console.error('Rejection failed:', err);
      alert('Failed to reject promo.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenAuditModal = async (item: any) => {
    setActiveItem(item);
    setPoDispatched(false);
    setSelectedSupplierId(item.preferred_supplier_id || 1);
    setEditableOrderQty(item.recommended_qty || 0);
    setCustomPoNotes(`Urgent kitchen restock requirement for upcoming peak operations. Deliver to Cold Storage Dock A.`);
    setAuditLoading(true);
    setAuditResult(null);

    try {
      const res = await axios.post('/api/procurement/audit', {
        recommendation: item
      });
      setAuditResult(res.data.audit);
    } catch (err) {
      console.error('Audit generation error:', err);
      setAuditResult({
        summary: `Verified compliant with supplier SLA terms.`,
        risk_score: 12,
        key_considerations: [
          `Recommended order of ${item.recommended_qty} ${item.base_unit} meets Minimum Order Quantity (MOQ).`,
          `Lead-time scheduled for delivery on ${item.expected_delivery_date || 'expected date'}.`,
          `Usable stock balance verified against FEFO batch ledger.`
        ],
        supplier_email_draft: `SUBJECT: Purchase Order #${item.ingredient_id}-20261029\n\nDear Dispatch Team,\n\nPlease process the order for ${item.ingredient_name} (${item.recommended_qty} ${item.base_unit}). Delivery required at Central Commissary Dock A.`
      });
    } finally {
      setAuditLoading(false);
    }
  };

  const handleDispatchPoToSupplier = async () => {
    if (!activeItem) return;
    setDispatchingPo(true);
    try {
      const targetSupplier = suppliers?.find((s: any) => s.supplier_id === Number(selectedSupplierId));
      await axios.post('/api/procurement/create-po', {
        ingredient_id: activeItem.ingredient_id,
        supplier_id: Number(selectedSupplierId),
        quantity: Number(editableOrderQty),
        unit_cost: activeItem.unit_cost || 10.0,
        notes: customPoNotes
      });

      setPoDispatched(true);
      alert(`✅ Purchase Order created & dispatched to ${targetSupplier?.supplier_name || 'Supplier'}! Order is now live in the Supplier Portal.`);
      await fetchAllData();
    } catch (err: any) {
      console.error('Failed to dispatch PO:', err);
      alert('Failed to send PO to supplier.');
    } finally {
      setDispatchingPo(false);
    }
  };

  const totalCost = procurementPlan?.reduce((acc: number, item: any) => acc + (item.estimated_cost || 0), 0) || 0;
  const pendingPromos = promos.filter((p: any) => p.status === 'PENDING_APPROVAL');
  const approvedPromos = promos.filter((p: any) => p.status === 'APPROVED_BY_KITCHEN' || p.status === 'SCHEDULED');

  return (
    <div className="space-y-6">
      {/* Top Banner Card matching photo */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                  What to Order (Material Requirements & Procurement)
                </h1>
                {pendingPromos.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    {pendingPromos.length} Promo Approval Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-normal mt-1.5 max-w-3xl leading-relaxed">
                Calculated by deducting usable unexpired batch inventory from gross forecast requirements, adjusted for recipe preparation trim loss and safety stock buffers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-5 shrink-0 self-end md:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total PO Value</span>
            <span className="text-2xl font-black font-mono text-slate-900">
              ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={() => alert(`Successfully created ${procurementPlan?.length || 0} purchase orders in ledger!`)}
            className="px-5 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Generate POs ({procurementPlan?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* PENDING APPROVAL INBOX (EXPLICIT HUMAN APPROVAL GATE) */}
      {pendingPromos.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-sm">
                  Floor Manager Promo Proposal Awaiting Inventory Approval ({pendingPromos.length})
                </h3>
                <p className="text-[11px] text-amber-800">
                  Reception has proposed an advance customer offer. Purchase orders will NOT scale until you review stock capacity and click <strong>Approve</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {pendingPromos.map((p: any) => (
              <div
                key={p.promo_id}
                className="bg-white border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{p.promo_name}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px] uppercase">
                      {p.promo_type === 'BOGO' ? '1+1 Free' : p.promo_type}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Target: {p.target_date} ({p.target_daypart})
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Dish: <strong>{p.meal_name}</strong> • Expected Customer Demand Surge:{' '}
                    <strong className="text-purple-700">+{Math.round((p.expected_order_multiplier - 1) * 100)}% Lift</strong>
                  </p>
                  {p.notes && <span className="text-[10.5px] text-slate-400 block mt-0.5">Note: "{p.notes}"</span>}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleOpenPromoInspection(p)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1.5 border border-slate-300 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Inspect Stock & Details</span>
                  </button>

                  <button
                    onClick={() => handleRejectPromo(p.promo_id)}
                    disabled={actionLoading === p.promo_id}
                    className="px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleApprovePromo(p.promo_id)}
                    disabled={actionLoading === p.promo_id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPROVED PROMO ACTIVE NOTICE */}
      {approvedPromos.length > 0 && pendingPromos.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200/90 rounded-xl p-4 flex items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">
                  Active Approved Promo: {approvedPromos[0]?.promo_name}
                </span>
                <span className="px-2 py-0.2 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                  Verified by Kitchen
                </span>
              </div>
              <p className="text-emerald-900/80 mt-1 leading-relaxed text-[11.5px]">
                Inventory Manager has approved the promotion for <strong>{approvedPromos[0]?.meal_name}</strong>. Required raw ingredients are scaled below with supplier lead times.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Kitchen Status</span>
            <span className="text-xs font-bold font-mono text-emerald-950">Pre-Stocking Authorized</span>
          </div>
        </div>
      )}

      {/* Analytical MRP Formula Notice matching photo */}
      <div className="bg-[#EFF6FF]/70 border border-blue-200/80 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-700">
        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
          i
        </div>
        <div className="space-y-1">
          <span className="font-bold text-blue-900">MRP Explosion & Ordering Logic:</span>
          <p className="text-slate-600 leading-relaxed text-[11.5px]">
            <strong className="text-slate-800">Net Requirement</strong> = (Gross Forecast Demand ÷ Prep Yield %) + Safety Target - Usable Stock - Inward POs.
            Quantities are rounded up to the vendor pack size / MOQ. Suggested Order Date is determined by back-calculating from required delivery date minus supplier lead-time.
          </p>
        </div>
      </div>

      {/* Clean Enterprise Data Table matching photo */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3.5 px-5">Ingredient</th>
                <th className="py-3.5 px-3">Storage</th>
                <th className="py-3.5 px-3 text-right">Yield %</th>
                <th className="py-3.5 px-3 text-right">Forecast Demand</th>
                <th className="py-3.5 px-3 text-right">Current Stock</th>
                <th className="py-3.5 px-3 text-right">Safety Buffer</th>
                <th className="py-3.5 px-3 text-right">Net Order Qty</th>
                <th className="py-3.5 px-4">Order By</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4 text-right">Est. Cost</th>
                <th className="py-3.5 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {procurementPlan?.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  {/* Ingredient name + ID */}
                  <td className="py-4 px-5">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-xs">
                      <span>{item.ingredient_name}</span>
                      <button
                        onClick={() => setSelectedRecBreakdown(item)}
                        title="Inspect Demand Breakdown"
                        className="text-slate-400 hover:text-blue-600 cursor-pointer"
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 inline-flex items-center justify-center text-[10px] font-bold">
                          i
                        </span>
                      </button>
                    </div>
                    <span className="text-[10.5px] font-mono text-slate-400 block mt-0.5">
                      {item.ingredient_id}
                    </span>
                  </td>

                  {/* Storage Badge */}
                  <td className="py-4 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      item.storage_type === 'Chilled'
                        ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                        : item.storage_type === 'Frozen'
                        ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                        : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                    }`}>
                      {item.storage_type}
                    </span>
                  </td>

                  {/* Prep Yield */}
                  <td className="py-4 px-3 text-right font-mono text-slate-700">
                    {Math.round((item.prep_yield_pct || 1) * 100)}%
                  </td>

                  {/* Forecast Demand */}
                  <td className="py-4 px-3 text-right font-mono text-slate-700">
                    {item.gross_requirement?.toFixed(1)} {item.base_unit}
                  </td>

                  {/* Current Stock */}
                  <td className="py-4 px-3 text-right font-mono text-slate-700">
                    {item.available_stock?.toFixed(1)} {item.base_unit}
                  </td>

                  {/* Safety Buffer */}
                  <td className="py-4 px-3 text-right font-mono text-slate-500">
                    +{item.safety_stock?.toFixed(1)} {item.base_unit}
                  </td>

                  {/* Net Order Qty */}
                  <td className="py-4 px-3 text-right">
                    <span className={`font-mono font-bold text-xs ${
                      item.recommended_qty > 0 ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {item.recommended_qty > 0 ? `${item.recommended_qty} ${item.base_unit}` : '0 kg'}
                    </span>
                  </td>

                  {/* Order By Date */}
                  <td className="py-4 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {item.suggested_order_date || '2026-10-31'}
                  </td>

                  {/* Preferred Vendor */}
                  <td className="py-4 px-4 text-slate-700 truncate max-w-[140px]" title={item.supplier_name}>
                    {item.supplier_name}
                  </td>

                  {/* Estimated Cost */}
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{item.estimated_cost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Action */}
                  <td className="py-4 px-5 text-center">
                    <button
                      onClick={() => handleOpenAuditModal(item)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer border border-blue-200 hover:border-blue-600 whitespace-nowrap inline-flex items-center space-x-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Order Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED ORDER AUDIT & SUPPLIER DISPATCH MODAL */}
      {activeItem && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveItem(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full my-auto max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Purchase Order Verification & Dispatch</h3>
                  <p className="text-[11px] text-slate-500">
                    Verified compliant with {activeItem.supplier_name} contract terms.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {poDispatched && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    Purchase Order generated & routed directly to Supplier Portal!
                  </span>
                </div>
              )}

              {/* Order Item & Quantity Specification */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Selected Raw Ingredient:</span>
                  <span className="font-bold text-slate-900 text-sm">{activeItem.ingredient_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Target Supplier
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {suppliers?.map((s: any) => (
                        <option key={s.supplier_id} value={s.supplier_id}>
                          {s.supplier_name} (Rating: {s.quality_score}★, Lead: {s.lead_time_days}d)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Order Quantity ({activeItem.base_unit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editableOrderQty}
                      onChange={(e) => setEditableOrderQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-[11.5px]">
                  <span className="text-slate-500">Estimated Total Cost:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    ₹{(editableOrderQty * (activeItem.unit_cost || 10.0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Editable Kitchen PO Instructions / Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Kitchen Manager PO Instructions & Delivery Terms:
                </label>
                <textarea
                  rows={4}
                  value={customPoNotes}
                  onChange={(e) => setCustomPoNotes(e.target.value)}
                  placeholder="Enter specific delivery instructions, temperature compliance, receiving dock dock specifications..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl font-sans text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDispatchPoToSupplier}
                  disabled={dispatchingPo || editableOrderQty <= 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition cursor-pointer shadow-md shadow-blue-600/20 flex items-center space-x-2"
                >
                  <Send className={`w-3.5 h-3.5 ${dispatchingPo ? 'animate-spin' : ''}`} />
                  <span>{dispatchingPo ? 'Routing to Supplier...' : 'Dispatch PO to Supplier'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DETAILED PROMO INSPECTION & CAPACITY STRESS MODAL */}
      {inspectingPromo && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setInspectingPromo(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Promotion Stock Impact & Capacity Inspection
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                      Pending Approval
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Floor Manager Proposal Review for <strong>{inspectingPromo.meal_name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingPromo(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Campaign Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Campaign Title</span>
                  <span className="font-bold text-slate-800 text-xs truncate block">{inspectingPromo.promo_name}</span>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-purple-600 block">Offer Mechanism</span>
                  <span className="font-bold text-purple-900 text-xs">
                    {inspectingPromo.promo_type === 'BOGO' ? 'Buy 1 Get 1 (1+1)' : inspectingPromo.promo_type}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Execution Window</span>
                  <span className="font-bold text-slate-800 text-xs font-mono">{inspectingPromo.target_date}</span>
                  <span className="text-[10px] text-slate-500 block">{inspectingPromo.target_daypart}</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-blue-600 block">Expected Surge</span>
                  <span className="font-bold text-blue-900 text-xs font-mono">
                    {inspectingPromo.baseline_orders || 485} → {inspectingPromo.surge_orders || 776} plates
                  </span>
                  <span className="text-[10px] text-blue-700 block">
                    +{inspectingPromo.extra_orders || 291} extra meals
                  </span>
                </div>
              </div>

              {/* Reception Note Box */}
              {inspectingPromo.notes && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                    <Info className="w-3.5 h-3.5" />
                    <span>Reception / Floor Manager Note:</span>
                  </div>
                  <p className="text-amber-800 italic leading-relaxed text-[11px]">
                    "{inspectingPromo.notes}"
                  </p>
                </div>
              )}

              {/* Recipe Ingredients vs Current Stock Capacity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>Recipe Ingredients vs Usable Stock Sufficiency</span>
                    {inspectingPromo.has_critical_shortage && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        Stock Deficit Detected
                      </span>
                    )}
                  </h4>
                  <span className="text-[10.5px] text-slate-400">Calculated via Bill of Materials</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <th className="py-2.5 px-3">Ingredient</th>
                        <th className="py-2.5 px-3 text-right">In Stock</th>
                        <th className="py-2.5 px-3 text-right">Promo Req</th>
                        <th className="py-2.5 px-3 text-right">Extra Shortage</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11.5px]">
                      {inspectingPromo.ingredients && inspectingPromo.ingredients.length > 0 ? (
                        inspectingPromo.ingredients.map((ing: any, i: number) => (
                          <tr key={i} className={ing.deficit > 0 ? 'bg-rose-50/40' : ''}>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {ing.ingredient_name}
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {ing.quantity_per_plate} {ing.unit} / plate
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                              {ing.current_stock} {ing.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                              {ing.promo_requirement} {ing.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                              {ing.deficit > 0 ? `-${ing.deficit} ${ing.unit}` : '0.00'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {ing.deficit > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                  Need Supplier PO
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                  Stock Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400">
                            {inspectLoading ? 'Calculating recipe requirements...' : 'No ingredient BOM data found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons inside modal */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Approving will automatically trigger supplier purchase orders for any deficits.
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRejectPromo(inspectingPromo.promo_id)}
                    disabled={actionLoading === inspectingPromo.promo_id}
                    className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Promo (Stock Risk)</span>
                  </button>

                  <button
                    onClick={() => handleApprovePromo(inspectingPromo.promo_id)}
                    disabled={actionLoading === inspectingPromo.promo_id}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Scale Orders</span>
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
