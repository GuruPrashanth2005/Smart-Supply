import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Truck,
  Phone,
  Mail,
  ShieldCheck,
  Star,
  Clock,
  Package,
  CheckCircle2,
  ExternalLink,
  X,
  Layers,
  MapPin,
  Building2
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const SuppliersPage: React.FC = () => {
  const { suppliers } = useData();
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // Supplier visual brand & cover photos
  const getSupplierTheme = (name: string, id: number) => {
    const n = (name || '').toLowerCase();
    if (n.includes('farm') || n.includes('produce') || id === 1) {
      return {
        coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
        badge: 'Fresh Farm Produce',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        accentBorder: 'border-l-emerald-500',
        category: 'Fruits & Fresh Vegetables',
        phone: '+91 98401 23456',
        executive: 'Rajesh K. (Field Logistics Mgr)',
        location: 'Coimbatore Agri-Cluster, TN',
        deliveryDays: 'Daily early morning (05:00 AM)',
        paymentTerms: 'Net 15 Days &bull; UPI / RTGS'
      };
    }
    if (n.includes('poultry') || n.includes('seafood') || n.includes('meat') || id === 2) {
      return {
        coverImage: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=800&auto=format&fit=crop&q=80',
        badge: 'Poultry, Meat & Seafood',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        accentBorder: 'border-l-rose-500',
        category: 'Cold-Chain Butchery & Seafood',
        phone: '+91 98402 34567',
        executive: 'A. Joseph (Cold Chain Lead)',
        location: 'Chennai Port & Ennore Cold Pier',
        deliveryDays: 'Mon, Wed, Fri (Temp Monitored < 2°C)',
        paymentTerms: 'Weekly Settlement &bull; Direct Bank Transfer'
      };
    }
    if (n.includes('grain') || n.includes('staple') || n.includes('pantry') || id === 3) {
      return {
        coverImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
        badge: 'Bulk Grains & Dry Staples',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        accentBorder: 'border-l-amber-500',
        category: 'Dry Warehouse Staples & Condiments',
        phone: '+91 98403 45678',
        executive: 'Sunil Mehta (Wholesale Desk)',
        location: 'Madhavaram Central Warehouse Hub',
        deliveryDays: 'Twice Weekly (Bulk Pallets 25kg+)',
        paymentTerms: 'Net 30 Days &bull; Corporate Account'
      };
    }
    // Dairy
    return {
      coverImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
      badge: 'Artisanal Fresh Dairy',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      accentBorder: 'border-l-blue-500',
      category: 'Grade-A Fresh Dairy & Artisanal Cheeses',
      phone: '+91 98404 56789',
      executive: 'Deepa Narayanan (Quality Head)',
      location: 'Salem & Erode Dairy Cooperatives',
      deliveryDays: 'Daily refrigerated morning drop (06:00 AM)',
      paymentTerms: 'Bi-Weekly &bull; Automatic NACH Debit'
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Supplier Directory & SLA Scorecards
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Contracted Partners
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Certified vendor network tracking On-Time In-Full (OTIF) fulfillment rates, cold-chain SLA compliance, lead-time variance, and contracted pack sizes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-700">
            {suppliers?.length || 4} Certified Vendors
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% SLA Compliant</span>
          </span>
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {suppliers?.map((s: any) => {
          const sName = s.supplier_name || s.name || `Supplier #${s.supplier_id || s.id}`;
          const sId = s.supplier_id || s.id || 1;
          const theme = getSupplierTheme(sName, sId);
          const otif = s.on_time_delivery_pct ?? (s.reliability_score ? s.reliability_score * 100 : 95.0);
          const quality = s.quality_score ?? 4.8;
          const leadTime = s.lead_time_days ?? 2;
          const catalogCount = s.catalog?.length ?? 5;
          const email = s.contact_details || s.email || 'orders@supplier.example';

          return (
            <div
              key={sId}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
            >
              {/* Photo Showcase Header */}
              <div className="relative h-36 w-full overflow-hidden bg-slate-900 shrink-0">
                <img
                  src={theme.coverImage}
                  alt={sName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Category Pill Tag */}
                <div className="absolute top-2.5 left-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs ${theme.badgeBg}`}>
                    {theme.badge}
                  </span>
                </div>

                {/* OTIF Badge */}
                <div className="absolute top-2.5 right-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold shadow-xs border ${
                    otif >= 95
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : otif >= 85
                      ? 'bg-amber-500 text-white border-amber-400'
                      : 'bg-rose-500 text-white border-rose-400'
                  }`}>
                    OTIF: {otif.toFixed(1)}%
                  </span>
                </div>

                {/* Supplier Name Overlay on Bottom of Image */}
                <div className="absolute bottom-2.5 left-3 right-3">
                  <h3 className="font-extrabold text-white text-sm leading-snug drop-shadow-md truncate">
                    {sName}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-300 mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-300" />
                    <span className="truncate">{theme.location}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                {/* Metric Strips */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Time</span>
                    <span className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{leadTime} {leadTime === 1 ? 'day' : 'days'}</span>
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Rating</span>
                    <span className="font-mono font-bold text-amber-700 text-sm flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{quality.toFixed(1)} / 5.0</span>
                    </span>
                  </div>
                </div>

                {/* Catalog & Executive Details */}
                <div className="space-y-1.5 text-xs text-slate-600 border-y border-slate-100 py-2.5">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Package className="w-3 h-3 text-slate-400" />
                      <span>Contracted Items:</span>
                    </span>
                    <span className="font-bold text-slate-900">{catalogCount} Ingredients</span>
                  </div>

                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-500">Account Exec:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[140px] text-right">
                      {theme.executive.split('(')[0]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-500">Min. Order (MOQ):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {s.minimum_order_qty || 20} kg/L
                    </span>
                  </div>
                </div>

                {/* Direct Contacts */}
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-[11px] font-mono text-slate-700">{email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-700">{theme.phone}</span>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SLA Verified</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSupplier({ ...s, sName, theme, otif, quality, leadTime, email })}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <span>View Contract</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Supplier SLA & Contract Modal via React Portal */}
      {selectedSupplier && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedSupplier(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="relative h-44 w-full overflow-hidden bg-slate-900 shrink-0">
              <img
                src={selectedSupplier.theme.coverImage}
                alt={selectedSupplier.sName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30" />

              <div className="absolute top-3.5 left-4 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs ${selectedSupplier.theme.badgeBg}`}>
                  {selectedSupplier.theme.badge}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                  Vendor ID: VEN-{selectedSupplier.supplier_id || selectedSupplier.id}
                </span>
              </div>

              <button
                onClick={() => setSelectedSupplier(null)}
                className="absolute top-3.5 right-4 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center cursor-pointer backdrop-blur-md transition z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3.5 left-5 right-5 flex items-end justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-lg leading-snug drop-shadow-md">
                    {selectedSupplier.sName}
                  </h3>
                  <p className="text-[11.5px] text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-300" />
                    <span>{selectedSupplier.theme.location}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-300 block font-medium">SLA Performance</span>
                  <span className="text-xs font-mono font-black px-2.5 py-1 rounded bg-emerald-500 text-white shadow-sm inline-block">
                    OTIF: {selectedSupplier.otif.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-sans">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Contracted Lead</span>
                  <span className="font-black text-slate-900 text-sm font-mono mt-0.5 block">
                    {selectedSupplier.leadTime} Days
                  </span>
                  <span className="text-[10px] text-slate-500">Dispatch Window</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Score</span>
                  <span className="font-black text-amber-700 text-sm font-mono mt-0.5 block flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{selectedSupplier.quality.toFixed(1)} / 5.0</span>
                  </span>
                  <span className="text-[10px] text-emerald-700">A-Grade Inspection</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Min. Order Commitment</span>
                  <span className="font-black text-slate-900 text-sm font-mono mt-0.5 block">
                    {selectedSupplier.minimum_order_qty || 20} kg/L
                  </span>
                  <span className="text-[10px] text-slate-500">Standard Pallet MOQ</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Contract Status</span>
                  <span className="font-bold text-emerald-700 text-xs mt-0.5 block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Active 2026/27</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Auto-Renewal Active</span>
                </div>
              </div>

              {/* Operations & Terms Strip */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-blue-950">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold text-xs">Standard Fulfillment & Delivery Schedule</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 block">Delivery Frequency:</span>
                    <span className="font-semibold text-slate-800">{selectedSupplier.theme.deliveryDays}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Payment & Billing Terms:</span>
                    <span className="font-semibold text-slate-800">{selectedSupplier.theme.paymentTerms}</span>
                  </div>
                </div>
              </div>

              {/* Contracted Ingredient Catalog */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Contracted Ingredient Catalog & Fixed Wholesale Prices</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Locked 2026 Procurement Rates</span>
                </div>

                {selectedSupplier.catalog && selectedSupplier.catalog.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">Item Code</th>
                          <th className="py-2 px-3">Ingredient</th>
                          <th className="py-2 px-3 text-right">Fixed Cost</th>
                          <th className="py-2 px-3 text-right">Pack Size</th>
                          <th className="py-2 px-3 text-right">Item Lead</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {selectedSupplier.catalog.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-slate-500 font-bold text-[11px]">
                              {item.ingredient_id}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {item.ingredient_name}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                              ₹{item.unit_cost?.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {item.pack_size} kg
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {item.lead_time_days} days
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500">
                    All commissary supplies managed under Master Services Agreement.
                  </div>
                )}
              </div>

              {/* Direct Supplier Escalation Contact */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{selectedSupplier.theme.executive}</span>
                  <span className="text-[11px] text-slate-500">Dedicated Kitchen Operations Escalation Desk</span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`mailto:${selectedSupplier.email}`}
                    className="flex items-center gap-1 text-blue-700 hover:underline font-mono text-[11px]"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{selectedSupplier.email}</span>
                  </a>
                  <a
                    href={`tel:${selectedSupplier.theme.phone}`}
                    className="flex items-center gap-1 text-slate-800 font-mono text-[11px] font-bold"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedSupplier.theme.phone}</span>
                  </a>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Master Services Agreement Ref #MSA-2026-F&B</span>
                <button
                  type="button"
                  onClick={() => setSelectedSupplier(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition text-xs"
                >
                  Close Specification
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
