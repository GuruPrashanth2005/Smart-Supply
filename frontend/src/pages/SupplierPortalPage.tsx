import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  PackageCheck,
  Send
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const SupplierPortalPage: React.FC = () => {
  const { suppliers, fetchAllData } = useData();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | 'ALL'>('ALL');
  const [, setLoading] = useState(false);

  // Modal State for Dispatching Order with Invoice
  const [activeDispatchPO, setActiveDispatchPO] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [inwardLoading, setInwardLoading] = useState<string | null>(null);

  const fetchSupplierOrders = async () => {
    setLoading(true);
    try {
      const url = selectedSupplierId === 'ALL'
        ? '/api/supplier-portal/orders'
        : `/api/supplier-portal/orders?supplier_id=${selectedSupplierId}`;
      const res = await axios.get(url);
      setOrders(res.data);
    } catch (err) {
      console.error('Error loading supplier portal orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierOrders();
  }, [selectedSupplierId]);

  const handleOpenDispatch = (po: any) => {
    setActiveDispatchPO(po);
    setInvoiceNumber(`INV-${po.order_id?.replace('PO-', '')}-${Math.floor(1000 + Math.random() * 9000)}`);
    setDispatchSuccess(null);
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispatchPO) return;

    try {
      const res = await axios.post('/api/supplier-portal/dispatch', {
        po_id: activeDispatchPO.order_id,
        invoice_number: invoiceNumber,
        dispatched_qty: activeDispatchPO.quantity
      });

      setDispatchSuccess(res.data.message || 'Order dispatched successfully!');
      await fetchSupplierOrders();
      await fetchAllData();

      setTimeout(() => {
        setActiveDispatchPO(null);
        setDispatchSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to dispatch PO:', err);
      alert('Error dispatching PO.');
    }
  };

  const handleVerifyInward = async (poId: string) => {
    setInwardLoading(poId);
    try {
      const res = await axios.post(`/api/supplier-portal/verify-inward?po_id=${poId}`);
      alert(`✅ Success: ${res.data.message}`);
      await fetchSupplierOrders();
      await fetchAllData();
    } catch (err) {
      console.error('Error inwarding stock:', err);
      alert('Failed to inward stock.');
    } finally {
      setInwardLoading(null);
    }
  };

  const totalValue = orders.reduce((acc, o) => acc + (o.total_cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                Supplier Order Fulfillment Portal
              </h1>
              <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">
                Vendor dispatch view: Receive kitchen purchase orders, generate electronic delivery invoices, and track inward verification.
              </p>
            </div>
          </div>
        </div>

        {/* Filter by Supplier */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right mr-2 hidden sm:block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Active Orders</span>
            <span className="text-lg font-bold font-mono text-slate-900">₹{totalValue.toLocaleString()}</span>
          </div>
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">All Vendor Partners</option>
            {suppliers.map((s: any) => (
              <option key={s.supplier_id} value={s.supplier_id}>
                {s.supplier_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Double-Entry Audit Notice */}
      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-950">
        <div className="flex items-center space-x-2">
          <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Closed-Loop Supply Chain:</strong> Supplier dispatches with an invoice number $\rightarrow$ Kitchen Manager accepts and verifies into FEFO storage $\rightarrow$ Automatically audited across both portals.
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200 shrink-0">
          Live Verification
        </span>
      </div>

      {/* 3. Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Incoming Purchase Orders from Kitchen Commissary</h3>
            <p className="text-xs text-slate-500">Live order allocation waiting for dispatch and delivery.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-mono">
            {orders.length} Purchase Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">PO Number & Item</th>
                <th className="py-3 px-3">Supplier Partner</th>
                <th className="py-3 px-3 text-right">Order Qty</th>
                <th className="py-3 px-3 text-right">PO Total</th>
                <th className="py-3 px-3">Target Delivery</th>
                <th className="py-3 px-3 text-center">Fulfillment Status</th>
                <th className="py-3 px-4 text-center">Vendor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((po, idx) => {
                const isDispatched = po.status === 'DISPATCHED';
                const isVerified = po.status === 'DELIVERED_VERIFIED';

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{po.ingredient_name}</span>
                        {po.is_new_order && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-black text-[9px] uppercase border border-purple-200 animate-pulse">
                            New PO Alert
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-mono block mt-0.5">{po.order_id} • {po.delivery_zone}</span>
                      {po.notes && (
                        <span className="text-[10.5px] text-blue-700 italic block mt-0.5 font-medium">
                          Note: "{po.notes}"
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{po.supplier_name}</div>
                      <span className="text-[10px] text-slate-400">Vendor #{po.supplier_id}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {po.quantity} {po.unit}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">
                      ₹{po.total_cost?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {po.expected_delivery_date}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Audited & Inwarded
                        </span>
                      ) : isDispatched ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Truck className="w-3 h-3" />
                          In Transit (Dispatched)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending Dispatch
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isVerified ? (
                        <span className="text-[11px] text-slate-400 font-medium">Complete</span>
                      ) : isDispatched ? (
                        <button
                          onClick={() => handleVerifyInward(po.order_id)}
                          disabled={inwardLoading === po.order_id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {inwardLoading === po.order_id ? 'Inwarding...' : 'Kitchen Verify Stock'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenDispatch(po)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1 mx-auto"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Order</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH ORDER MODAL WITH INVOICE NUMBER */}
      {activeDispatchPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Fulfill & Dispatch Order</h3>
                  <p className="text-[11px] text-slate-500">{activeDispatchPO.order_id}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmDispatch} className="p-6 space-y-4 text-xs">
              {dispatchSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{dispatchSuccess}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-bold text-slate-900">{activeDispatchPO.ingredient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-mono font-bold text-slate-900">{activeDispatchPO.quantity} {activeDispatchPO.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="text-slate-700">{activeDispatchPO.delivery_zone}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendor Invoice / Challan Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveDispatchPO(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Generate Invoice & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
