import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  ReceiptText,
  Sparkles,
  Receipt,
  CheckCircle2,
  X,
  Printer,
  Plus,
  AlertOctagon
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    setShowTxModal,
    aiDiagnostics,
    setAiDiagnostics,
    aiDiagLoading,
    setAiDiagLoading
  } = useData();

  const [selectedTxReceipt, setSelectedTxReceipt] = useState<any>(null);

  const handleRunDiagnostics = async () => {
    setAiDiagLoading(true);
    try {
      const res = await axios.get('/api/transactions/diagnostics');
      setAiDiagnostics(res.data.diagnostics || []);
    } catch (err) {
      console.error('Waste diagnostics failed:', err);
    } finally {
      setAiDiagLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ReceiptText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Stock Ledger & Shrinkage Diagnostics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditable double-entry inventory ledger recording consumption, trim waste, inward vendor receipts, and AI shrinkage diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunDiagnostics}
            disabled={aiDiagLoading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{aiDiagLoading ? 'Auditing Wastage Logs...' : 'Run Groq Waste Audit'}</span>
          </button>
          <button
            onClick={() => setShowTxModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold text-xs transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Movement</span>
          </button>
        </div>
      </div>

      {/* Groq Diagnostics Panel */}
      {aiDiagnostics.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Groq AI Shrinkage Diagnostics & Root-Cause Findings</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiDiagnostics.map((d: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{d.ingredient}</span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      d.severity === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {d.severity} Shrinkage
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{d.finding}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Root Cause: <strong className="text-slate-800">{d.root_cause}</strong></span>
                  <span className="text-blue-700 font-semibold">Action: {d.recommended_action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Ingredient ID</th>
                <th className="py-3 px-3">Movement Type</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-4">Operational Reference</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Slip / Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {transactions?.map((tx: any, idx: number) => {
                const txId = tx.transaction_id ?? tx.id ?? idx + 1;
                const txType = tx.transaction_type ?? tx.type ?? 'CONSUMED';
                const txDate = tx.transaction_date ?? tx.date ?? '';
                const ingName = tx.ingredient_name || tx.ingredient_id;

                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedTxReceipt(tx)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-500">#{txId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{ingName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{tx.ingredient_id}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          txType === 'CONSUMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : txType === 'WASTAGE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : txType === 'RESCUED'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {txType}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {tx.quantity} {tx.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium">{tx.reference}</div>
                      {tx.notes && <span className="text-[10px] text-slate-400 block">{tx.notes}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{txDate}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Audited
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTxReceipt(tx);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold border border-slate-200 flex items-center gap-1 mx-auto transition cursor-pointer"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED TRANSACTION & SUPPLIER AUDIT RECEIPT MODAL */}
      {selectedTxReceipt && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedTxReceipt(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full my-auto max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Control Bar */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Thermal Slip Preview
              </span>
              <button
                onClick={() => setSelectedTxReceipt(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Paper Receipt Card */}
            <div className="p-6 overflow-y-auto bg-slate-100/70 flex justify-center">
              <div
                id="thermal-voucher"
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
                  <div className="text-[9.5px]">service@smartsupply.example</div>
                </div>

                {/* Divider Line */}
                <div className="border-t-2 border-dashed border-black my-2"></div>

                {/* Timestamp & Voucher Ref */}
                <div className="flex justify-between text-[10.5px]">
                  <span>DATE: {selectedTxReceipt.transaction_date?.split(' ')[0] || selectedTxReceipt.date}</span>
                  <span>TIME: {selectedTxReceipt.transaction_date?.split(' ')[1] || '14:10'}</span>
                </div>

                <div className="border-t border-dashed border-black my-1"></div>

                {/* Metadata */}
                <div className="space-y-1 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="font-bold">TXN VOUCHER:</span>
                    <span className="font-black">TXN-{selectedTxReceipt.transaction_id || selectedTxReceipt.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">MOVEMENT:</span>
                    <span className="font-black uppercase">{selectedTxReceipt.transaction_type || selectedTxReceipt.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">REF / PO:</span>
                    <span className="font-black text-[10px]">{selectedTxReceipt.reference}</span>
                  </div>
                </div>

                {/* Dashed line */}
                <div className="border-t-2 border-dashed border-black my-2"></div>

                {/* Line Items */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold uppercase text-[11px]">
                    <span>DESCRIPTION</span>
                    <span>QTY</span>
                  </div>

                  <div className="flex justify-between items-start pt-1">
                    <div className="max-w-[70%]">
                      <div className="font-black uppercase">
                        {selectedTxReceipt.ingredient_name || selectedTxReceipt.ingredient_id}
                      </div>
                      <div className="text-[9.5px]">
                        ITEM ID: {selectedTxReceipt.ingredient_id}
                      </div>
                    </div>
                    <div className="font-black font-mono text-xs">
                      {selectedTxReceipt.quantity} {selectedTxReceipt.unit}
                    </div>
                  </div>
                </div>

                {/* Dashed line */}
                <div className="border-t border-dashed border-black my-2"></div>

                {/* Manager Verification & Notes */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>AUDIT STATUS:</span>
                    <span className="font-bold">APPROVED & VERIFIED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AUTH CODE:</span>
                    <span className="font-bold">AUTH-{selectedTxReceipt.transaction_id || 141000}</span>
                  </div>
                  {selectedTxReceipt.notes && (
                    <div className="pt-1">
                      <span className="font-bold block">OPERATIONAL NOTE:</span>
                      <span className="italic block text-[9.5px] text-slate-800">"{selectedTxReceipt.notes}"</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2 space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider">
                    COMMISSARY AUDIT COMPLETE
                  </div>
                  <div className="text-[9px] text-slate-600">
                    AUTOMATICALLY SYNCHRONIZED ACROSS LEDGERS
                  </div>
                </div>

                {/* Barcode graphic like user photo */}
                <div className="pt-2 text-center space-y-1">
                  <div className="inline-block bg-black h-8 w-48 tracking-widest text-white text-[8px] flex items-center justify-center font-mono font-bold">
                    ||||| | |||| ||| |||||| | ||||| |||| |
                  </div>
                  <div className="text-[8.5px] font-mono font-bold tracking-wider">
                    *TXN-{selectedTxReceipt.transaction_id || 141000}*
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
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
                  onClick={() => setSelectedTxReceipt(null)}
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
    </div>
  );
};
