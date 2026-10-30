import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  ChefHat,
  Boxes,
  Truck,
  Sparkles,
  ReceiptText,
  Plus,
  Bell,
  Calendar,
  X,
  ChevronDown,
  UserCheck,
  Check,
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    showTxModal,
    setShowTxModal,
    txForm,
    setTxForm,
    handleCreateTransaction,
    ingredients,
    selectedRecBreakdown,
    setSelectedRecBreakdown,
    loading,
    fetchAllData
  } = useData();

  // Active Role Persona state: 'INVENTORY' | 'RECEPTION' | 'SUPPLIER'
  const [activeRole, setActiveRole] = useState<'INVENTORY' | 'RECEPTION' | 'SUPPLIER'>(() => {
    if (location.pathname.startsWith('/reception')) return 'RECEPTION';
    if (location.pathname.startsWith('/supplier-portal')) return 'SUPPLIER';
    return 'INVENTORY';
  });

  // Live Notification Badge for Supplier Incoming POs
  const [supplierPendingCount, setSupplierPendingCount] = useState<number>(0);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  const fetchSupplierNotifications = async () => {
    try {
      const res = await axios.get('/api/supplier-portal/orders');
      const pending = res.data.filter((o: any) => o.status !== 'DELIVERED_VERIFIED').length;
      setSupplierPendingCount(pending);
    } catch {
      // quiet fallback
    }
  };

  // Fetch on mount or role change, no aggressive polling loop
  useEffect(() => {
    fetchSupplierNotifications();
  }, [location.pathname]);

  const handleSwitchRole = (newRole: 'INVENTORY' | 'RECEPTION' | 'SUPPLIER') => {
    setActiveRole(newRole);
    if (newRole === 'RECEPTION') {
      navigate('/reception');
    } else if (newRole === 'SUPPLIER') {
      navigate('/supplier-portal');
    } else {
      navigate('/');
    }
  };

  // Dynamic Navigation Tabs by Active Role Persona
  const getNavTabsForRole = () => {
    if (activeRole === 'RECEPTION') {
      return [
        { path: '/reception', label: 'Reception & Sales Dashboard', icon: LayoutDashboard },
        { path: '/forecast', label: 'Daypart Demand Forecast', icon: TrendingUp },
        { path: '/recipes', label: 'Dishes on Menu', icon: ChefHat },
      ];
    }

    if (activeRole === 'SUPPLIER') {
      return [
        { path: '/supplier-portal', label: 'Incoming Purchase Orders', icon: ShoppingCart },
        { path: '/suppliers', label: 'Supplier Terms & SLA', icon: Truck },
        { path: '/transactions', label: 'Delivery Receipts & Ledger', icon: ReceiptText },
      ];
    }

    // Default: INVENTORY / KITCHEN MANAGER
    return [
      { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
      { path: '/procurement', label: 'What to Order', icon: ShoppingCart, badge: '23 Items' },
      { path: '/forecast', label: 'Demand Forecast', icon: TrendingUp },
      { path: '/recipes', label: 'Dishes & Recipes', icon: ChefHat, badge: '52 Dishes' },
      { path: '/inventory', label: 'Current Stock & Expiry', icon: Boxes, badge: 'FEFO Stock' },
      { path: '/suppliers', label: 'Suppliers', icon: Truck },
      { path: '/rescue', label: 'Save Expiring Food', icon: Sparkles, badge: 'AI Chef' },
      { path: '/transactions', label: 'Stock History & Waste', icon: ReceiptText },
    ];
  };

  const navTabs = getNavTabsForRole();

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#0F172A] font-sans antialiased flex flex-col">
      
      {/* Premium Apple / Vercel Glassmorphism Executive Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6">
          
          {/* Top Brand & Utility Tier */}
          <div className="h-14 flex items-center justify-between gap-4 border-b border-slate-100/80">
            {/* Left: Brand Identity & Location Switcher */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-900 text-white flex items-center justify-center font-black text-sm shadow-sm ring-1 ring-black/10">
                S
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  SmartSupply<span className="text-blue-600">.ai</span>
                </span>
                <span className="text-slate-300 font-light text-sm">/</span>
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 hover:bg-slate-200/70 text-xs font-bold text-slate-800 cursor-pointer transition border border-slate-200/60 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Main Kitchen Hub #55</span>
                  <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
                </div>
              </div>
            </div>

            {/* Active Workspace Persona Pill (Compact Indicator) */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-100/90 border border-slate-200/70 text-xs">
              <span className="text-slate-400 font-medium">Active Workspace:</span>
              <span className={`font-bold flex items-center gap-1.5 ${
                activeRole === 'RECEPTION'
                  ? 'text-purple-700'
                  : activeRole === 'SUPPLIER'
                  ? 'text-emerald-700'
                  : 'text-blue-700'
              }`}>
                {activeRole === 'RECEPTION' ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Reception & Dining Floor</span>
                  </>
                ) : activeRole === 'SUPPLIER' ? (
                  <>
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Supplier Logistics Portal</span>
                  </>
                ) : (
                  <>
                    <Boxes className="w-3.5 h-3.5 text-blue-600" />
                    <span>Main Kitchen & Cold Store</span>
                  </>
                )}
              </span>
            </div>

            {/* Right: Operational Status, Alerts & Quick Actions */}
            <div className="flex items-center space-x-2.5 text-xs shrink-0">
              <div className="hidden sm:flex items-center space-x-2 bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl text-slate-700 font-semibold shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-mono text-[11px] font-bold">Next 7 Days Plan</span>
              </div>

              <button
                onClick={fetchAllData}
                title="Refresh All Numbers"
                disabled={loading}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-blue-600 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => alert('Operational Alerts: Active 1+1 Promo scheduled, 4 batches near expiry, POs waiting for supplier fulfillment.')}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 relative transition flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full"></span>
              </button>

              {/* Quick Action Button for Inventory */}
              {activeRole === 'INVENTORY' && (
                <button
                  onClick={() => setShowTxModal(true)}
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all duration-150 cursor-pointer shadow-blue-500/20 hover:shadow-blue-500/30 ring-1 ring-blue-500/30"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>Record Stock Tx</span>
                </button>
              )}

              {/* Quick Action Button for Reception */}
              {activeRole === 'RECEPTION' && (
                <button
                  onClick={() => navigate('/reception')}
                  className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New 1+1 Offer</span>
                </button>
              )}

              {/* Interactive Profile Role Switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`h-9 px-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all duration-150 cursor-pointer ring-2 ring-white hover:opacity-95 ${
                    activeRole === 'RECEPTION'
                      ? 'bg-gradient-to-tr from-purple-700 to-indigo-600'
                      : activeRole === 'SUPPLIER'
                      ? 'bg-gradient-to-tr from-emerald-700 to-teal-600'
                      : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 shadow-blue-500/20'
                  }`}
                >
                  <span className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center text-[11px] font-black">
                    {activeRole === 'RECEPTION' ? 'R' : activeRole === 'SUPPLIER' ? 'S' : 'H'}
                  </span>
                  <span className="hidden sm:inline font-semibold text-[11px] text-white/90">
                    {activeRole === 'RECEPTION' ? 'Reception' : activeRole === 'SUPPLIER' ? 'Supplier' : 'Chef/Manager'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile & Role Selection Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                      {/* User Account Info Header */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-2 flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs ${
                          activeRole === 'RECEPTION'
                            ? 'bg-gradient-to-tr from-purple-700 to-indigo-600'
                            : activeRole === 'SUPPLIER'
                            ? 'bg-gradient-to-tr from-emerald-700 to-teal-600'
                            : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 shadow-blue-500/20'
                        }`}>
                          {activeRole === 'RECEPTION' ? 'R' : activeRole === 'SUPPLIER' ? 'S' : 'H'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 text-xs truncate">Head Chef / Commissary Admin</h4>
                          <span className="text-[10.5px] text-slate-500 block truncate">chef.hub55@smartsupply.example</span>
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Verified Session
                          </span>
                        </div>
                      </div>

                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Switch Operational Role
                      </div>

                      {/* Role Options */}
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleSwitchRole('INVENTORY');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                            activeRole === 'INVENTORY'
                              ? 'bg-blue-50 border border-blue-200/80 text-blue-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <Boxes className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-xs block text-slate-900">Inventory Manager</span>
                              <span className="text-[10px] text-slate-500 block">Cold store, stock FEFO & waste ledger</span>
                            </div>
                          </div>
                          {activeRole === 'INVENTORY' && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleSwitchRole('RECEPTION');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                            activeRole === 'RECEPTION'
                              ? 'bg-purple-50 border border-purple-200/80 text-purple-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-xs block text-slate-900">Reception / Sales Floor</span>
                              <span className="text-[10px] text-slate-500 block">Point of Sale, 1+1 offers & dine-in rush</span>
                            </div>
                          </div>
                          {activeRole === 'RECEPTION' && (
                            <Check className="w-4 h-4 text-purple-600" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleSwitchRole('SUPPLIER');
                            setShowProfileMenu(false);
                          }}
                          className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                            activeRole === 'SUPPLIER'
                              ? 'bg-emerald-50 border border-emerald-200/80 text-emerald-950 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900">Supplier Logistics Portal</span>
                                {supplierPendingCount > 0 && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white">
                                    {supplierPendingCount} New
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block">Dispatch orders, thermal bills & SLA</span>
                            </div>
                          </div>
                          {activeRole === 'SUPPLIER' && (
                            <Check className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Pill Strip */}
          <div className="py-1.5">
            <nav className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    end={tab.path === '/' || tab.path === '/reception' || tab.path === '/supplier-portal'}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3.5 py-1.5 text-xs font-bold transition-all duration-150 rounded-xl whitespace-nowrap cursor-pointer ${
                        isActive
                          ? (activeRole === 'RECEPTION'
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm ring-1 ring-purple-600 shadow-purple-500/25'
                              : activeRole === 'SUPPLIER'
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm ring-1 ring-emerald-600 shadow-emerald-500/25'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm ring-1 ring-blue-600 shadow-blue-500/25')
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                        {tab.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Page Workspace */}
      <main key={location.pathname} className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-5 page-transition-enter">
        <Outlet />
      </main>

      {/* Modal: Record Used or Wasted Stock (Simple English) */}
      {showTxModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowTxModal(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md my-auto p-6 shadow-2xl relative text-xs animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTxModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-black" />
              <span>Record Kitchen Stock Movement</span>
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Log ingredients cooked today, delivery received, or preparation trim loss.
            </p>

            <form onSubmit={handleCreateTransaction} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Ingredient</label>
                <select
                  value={txForm.ingredient_id}
                  onChange={(e) => {
                    const ing = ingredients.find((i: any) => i.ingredient_id === e.target.value);
                    setTxForm({ ...txForm, ingredient_id: e.target.value, unit: ing?.base_unit || 'kg' });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  {ingredients.map((ing: any) => (
                    <option key={ing.ingredient_id} value={ing.ingredient_id}>
                      {ing.ingredient_name} ({ing.storage_type} • {ing.base_unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Movement Type</label>
                  <select
                    value={txForm.transaction_type}
                    onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    <option value="CONSUMED">Used for Cooking</option>
                    <option value="WASTAGE">Food Waste / Spoiled</option>
                    <option value="RECEIVED">Received from Supplier</option>
                    <option value="ADJUSTMENT">Stock Count Correction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity ({txForm.unit})</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={txForm.quantity}
                    onChange={(e) => setTxForm({ ...txForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Where was it used? (Optional note)</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner service rush, Chicken trimming waste, etc."
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs transition cursor-pointer"
                >
                  Save Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Why do we need this much? (Procurement Recommendation Breakdown) */}
      {selectedRecBreakdown && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedRecBreakdown(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl my-auto p-6 shadow-2xl relative text-xs animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedRecBreakdown(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Order Breakdown: {selectedRecBreakdown.ingredient_name}
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Here is exactly why the platform recommends buying {selectedRecBreakdown.recommended_qty} {selectedRecBreakdown.base_unit}.
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Expected Customer Demand for Next 7 Days:</span>
                <span className="font-mono font-bold text-slate-900">{selectedRecBreakdown.gross_requirement} {selectedRecBreakdown.base_unit}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">After Peeling & Cutting Loss (Prep Yield):</span>
                <span className="font-mono font-bold text-slate-900">{selectedRecBreakdown.yield_adjusted_requirement} {selectedRecBreakdown.base_unit}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Safety Buffer Target:</span>
                <span className="font-mono font-bold text-emerald-700">+{selectedRecBreakdown.safety_stock} {selectedRecBreakdown.base_unit}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Good Unexpired Stock in Kitchen:</span>
                <span className="font-mono font-bold text-rose-600">-{selectedRecBreakdown.available_stock} {selectedRecBreakdown.base_unit}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-900">Net Quantity Missing:</span>
                <span className="font-mono text-blue-700">{selectedRecBreakdown.net_requirement} {selectedRecBreakdown.base_unit}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
              <strong>Supplier Order Terms:</strong> Rounded up to <strong>{selectedRecBreakdown.recommended_qty} {selectedRecBreakdown.base_unit}</strong> to meet {selectedRecBreakdown.supplier_name}'s minimum pack size. Delivery lead time is scheduled so food arrives fresh.
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedRecBreakdown(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
