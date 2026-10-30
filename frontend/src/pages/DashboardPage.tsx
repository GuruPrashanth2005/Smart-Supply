import React, { useState } from 'react';
import {
  Soup,
  Leaf,
  ShoppingCart,
  AlertTriangle,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Package,
  Milk,
  Drumstick,
  Carrot,
  ChefHat
} from 'lucide-react';
import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [activeDish, setActiveDish] = useState<any>(null);
  // 1. Dual Line Demand Trend (W141 to W144)
  const demandForecastTrend = [
    { week: 'Week 141', actual: 4800, predicted: 5200 },
    { week: 'Week 142', actual: 6100, predicted: 6600 },
    { week: 'Week 143', actual: 7000, predicted: 7600 },
    { week: 'Week 144', actual: 7900, predicted: 8450 }
  ];

  // 2. Category Share Data
  const categoryRequirementData = [
    { name: 'Fresh Vegetables', value: 32, color: '#10B981' },
    { name: 'Grains & Rice', value: 18, color: '#F59E0B' },
    { name: 'Poultry & Meat', value: 15, color: '#EF4444' },
    { name: 'Dairy & Milk', value: 12, color: '#06B6D4' },
    { name: 'Spices & Masala', value: 10, color: '#8B5CF6' },
    { name: 'Cooking Oil', value: 8, color: '#F97316' },
    { name: 'Others', value: 5, color: '#64748B' }
  ];

  // 3. Stock Status Overview
  const stockStatusOverview = [
    { name: 'Tomato', current: 195, safety: 140 },
    { name: 'Onion', current: 162, safety: 110 },
    { name: 'Chicken', current: 88, safety: 170 },
    { name: 'Rice', current: 215, safety: 175 },
    { name: 'Milk', current: 138, safety: 115 }
  ];

  // 4. Top 5 High-Demand Meals (Rich culinary photos & kitchen prep details)
  const topMeals = [
    { rank: 1, name: 'Butter Chicken Biryani', category: 'Biryani', orders: 1250, change: '+22%', prepTime: '35m', revenue: '₹ 3,75,000', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80' },
    { rank: 2, name: 'Grilled Chicken Bowl', category: 'Rice Bowl', orders: 980, change: '+18%', prepTime: '20m', revenue: '₹ 2,74,400', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80' },
    { rank: 3, name: 'Fiery Chicken Penne Arrabbiata', category: 'Pasta', orders: 720, change: '+12%', prepTime: '18m', revenue: '₹ 2,01,600', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=80' },
    { rank: 4, name: 'Italian Pesto Chicken Sandwich', category: 'Sandwich', orders: 640, change: '+10%', prepTime: '15m', revenue: '₹ 1,53,600', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80' },
    { rank: 5, name: 'Golden Sesame Prawn Crackers', category: 'Snacks', orders: 580, change: '+8%', prepTime: '12m', revenue: '₹ 1,16,000', img: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&auto=format&fit=crop&q=80' }
  ];

  // 5. 7-Day Purchasing Requirement Table with rich product photos
  const procurementTableItems = [
    {
      id: 'ING-TOM',
      name: 'Fresh Farm Tomatoes',
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80',
      category: 'Produce',
      reqQty: '120 kg',
      availStock: '25 kg',
      recOrder: '100 kg',
      cost: '₹ 4,000',
      vendor: 'Fresh Farms Produce',
      status: 'CRITICAL'
    },
    {
      id: 'ING-CHK',
      name: 'Chicken Breast Fillet',
      img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&auto=format&fit=crop&q=80',
      category: 'Meat & Poultry',
      reqQty: '80 kg',
      availStock: '10 kg',
      recOrder: '80 kg',
      cost: '₹ 12,800',
      vendor: 'Meat World Packers',
      status: 'CRITICAL'
    },
    {
      id: 'ING-ONI',
      name: 'Red Cooking Onions',
      img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&auto=format&fit=crop&q=80',
      category: 'Produce',
      reqQty: '90 kg',
      availStock: '40 kg',
      recOrder: '60 kg',
      cost: '₹ 2,400',
      vendor: 'Green Veggies Co.',
      status: 'WARNING'
    },
    {
      id: 'ING-MLK',
      name: 'Whole Dairy Milk',
      img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop&q=80',
      category: 'Dairy',
      reqQty: '70 L',
      availStock: '5 L',
      recOrder: '70 L',
      cost: '₹ 5,600',
      vendor: 'Dairy Best Co.',
      status: 'CRITICAL'
    },
    {
      id: 'ING-RCE',
      name: 'Royal Basmati Rice',
      img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop&q=80',
      category: 'Grains & Staples',
      reqQty: '200 kg',
      availStock: '120 kg',
      recOrder: '80 kg',
      cost: '₹ 3,200',
      vendor: 'Apex Staples Group',
      status: 'NORMAL'
    }
  ];

  // 6. Plain English Kitchen Alerts
  const urgentAlerts = [
    { title: 'Tomatoes running very low', detail: 'Only 25 kg left in stock (need 50 kg)', action: 'Order Now', link: '/procurement', severity: 'danger' },
    { title: 'Milk will spoil in 2 days', detail: '10 Liters left in fridge B20261020', action: 'Make Special', link: '/rescue', severity: 'danger' },
    { title: 'Chicken will finish in 4 days', detail: 'Supplier needs 3 days to deliver', action: 'Order Soon', link: '/procurement', severity: 'warning' },
    { title: 'Too many carrots in cold store', detail: '60 kg sitting idle for > 5 days', action: 'Use in Dishes', link: '/rescue', severity: 'info' }
  ];

  // 7. Items Expiring Soon (Simple English)
  const nearExpiryBatches = [
    { name: 'Fresh Milk', iconType: 'dairy', batchId: 'B20261018', expiry: '22 Oct (2 days left)', remaining: '10 L', daysLeft: 2, zone: 'Fridge' },
    { name: 'Chicken Fillets', iconType: 'poultry', batchId: 'C20261019', expiry: '23 Oct (3 days left)', remaining: '15 kg', daysLeft: 3, zone: 'Freezer' },
    { name: 'Fresh Cabbage', iconType: 'veg', batchId: 'V20261017', expiry: '24 Oct (4 days left)', remaining: '8 kg', daysLeft: 4, zone: 'Fridge' },
    { name: 'Fresh Tomatoes', iconType: 'veg', batchId: 'V20261016', expiry: '25 Oct (5 days left)', remaining: '12 kg', daysLeft: 5, zone: 'Dry Store' }
  ];

  // 8. Chef Specials to Save Food (High Margin Waste Prevention)
  const rescueCards = [
    {
      title: 'Creamy Tomato Soup Special',
      badge: 'High Margin',
      badgeColor: 'bg-emerald-500 text-white',
      rescuedIngredient: '12 kg Vine Tomatoes',
      servings: '80 Bowls',
      prepTime: '30 mins',
      savings: '₹ 9,600',
      posDiscount: '15% Off Flash Deal',
      img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80'
    },
    {
      title: 'Spicy Chicken Curry Bowl',
      badge: 'High Volume',
      badgeColor: 'bg-amber-500 text-white',
      rescuedIngredient: '15 kg Chicken Breast',
      servings: '60 Plates',
      prepTime: '40 mins',
      savings: '₹ 14,400',
      posDiscount: '20% Off Lunch Special',
      img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80'
    }
  ];

  // 9. Suppliers
  const supplierScores = [
    { name: 'Fresh Farms Produce', otif: '98%', leadTime: '2 days', rating: '4.8', item: 'Vegetables' },
    { name: 'Dairy Best Co.', otif: '95%', leadTime: '1 day', rating: '4.5', item: 'Milk & Butter' },
    { name: 'Meat World Packers', otif: '92%', leadTime: '3 days', rating: '4.3', item: 'Fresh Chicken' },
    { name: 'Spice Hub Wholesale', otif: '96%', leadTime: '2 days', rating: '4.6', item: 'Rice & Spices' }
  ];

  // Helper to render professional React Lucide icons instead of emojis
  const renderIngredientIcon = (type: string) => {
    switch (type) {
      case 'veg':
        return (
          <span className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          </span>
        );
      case 'poultry':
        return (
          <span className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <Drumstick className="w-3.5 h-3.5 text-amber-600" />
          </span>
        );
      case 'dairy':
        return (
          <span className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Milk className="w-3.5 h-3.5 text-blue-600" />
          </span>
        );
      case 'grain':
        return (
          <span className="w-6 h-6 rounded-md bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
            <Package className="w-3.5 h-3.5 text-orange-600" />
          </span>
        );
      default:
        return (
          <span className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            <Carrot className="w-3.5 h-3.5 text-slate-600" />
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* =========================================================================
          TIER 1: 6 SUPER SIMPLE KITCHEN NUMBERS
          ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1 - Indigo / Blue */}
        <div className="glass-surface rounded-xl p-4 shadow-xs hover-lift cursor-pointer border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/40 via-white/80 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900/80">Dishes on Menu</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center">
              <Soup className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">51</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full">+2 new</span>
          </div>
          <span className="text-xs text-slate-500 block mt-1">Active recipes cooked</span>
        </div>

        {/* Card 2 - Emerald */}
        <div className="glass-surface rounded-xl p-4 shadow-xs hover-lift cursor-pointer border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/40 via-white/80 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900/80">Raw Ingredients</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">27</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full">Items</span>
          </div>
          <span className="text-xs text-emerald-700 font-medium block mt-1">Stocked in cold storage</span>
        </div>

        {/* Card 3 - Purple / Violet */}
        <div className="glass-surface rounded-xl p-4 shadow-xs hover-lift cursor-pointer border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/40 via-white/80 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900/80">To Buy This Week</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100/80 text-purple-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-purple-950 font-mono tracking-tight">₹ 1,24,500</span>
          </div>
          <span className="text-xs text-slate-500 block mt-1">Total shopping cost</span>
        </div>

        {/* Card 4 - Amber / Warning */}
        <div className="glass-surface rounded-xl p-4 shadow-xs hover-lift cursor-pointer border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 via-white/80 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900/80">Running Low</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-600 font-mono tracking-tight">6</span>
            <span className="text-xs text-amber-800 font-bold bg-amber-100/90 px-2 py-0.5 rounded-full">Order Fast</span>
          </div>
          <span className="text-xs text-amber-700 font-medium block mt-1">Stock below safety level</span>
        </div>

        {/* Card 5 - Rose / Danger */}
        <div className="glass-surface rounded-xl p-4 shadow-xs hover-lift cursor-pointer border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-50/50 via-white/80 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900/80">Expiring Soon</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-600 font-mono tracking-tight">4</span>
            <span className="text-xs text-rose-800 font-bold bg-rose-100/90 px-2 py-0.5 rounded-full">Batches</span>
          </div>
          <span className="text-xs text-rose-700 font-medium block mt-1">Spoils in ≤ 3 days</span>
        </div>

        {/* Card 6 - Cyan / Growth */}
        <div className="glass-surface rounded-xl p-4 shadow-xs hover-lift cursor-pointer border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50/40 via-white/80 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-900/80">Expected Orders</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-100/80 text-cyan-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">8,450</span>
            <span className="text-xs text-cyan-800 font-bold bg-cyan-100/80 px-2 py-0.5 rounded-full">+15%</span>
          </div>
          <span className="text-xs text-slate-500 block mt-1">Plates for next week</span>
        </div>
      </div>

      {/* =========================================================================
          PRIORITY ACTION NOTIFICATION SECTION (EXPANDED & HIGH VISIBILITY)
          ========================================================================= */}
      <div className="glass-surface rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-black bg-rose-600 text-white uppercase tracking-wider shadow-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Action Needed
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Critical Kitchen Alerts & Priority Tasks</h2>
              <p className="text-xs text-slate-500">Requires immediate manager attention to prevent stockouts and food wastage</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {urgentAlerts.length} Action Items Pending
          </span>
        </div>

        {/* 4 Spacious, Fully Readable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {urgentAlerts.map((a, idx) => {
            const isDanger = a.severity === 'danger';
            const isWarning = a.severity === 'warning';
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md ${
                  isDanger
                    ? 'bg-rose-50/60 border-rose-200/80 hover:border-rose-300'
                    : isWarning
                    ? 'bg-amber-50/60 border-amber-200/80 hover:border-amber-300'
                    : 'bg-blue-50/60 border-blue-200/80 hover:border-blue-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
                        isDanger
                          ? 'bg-rose-200/70 text-rose-800'
                          : isWarning
                          ? 'bg-amber-200/70 text-amber-900'
                          : 'bg-blue-200/70 text-blue-900'
                      }`}
                    >
                      {isDanger ? 'Urgent Risk' : isWarning ? 'Lead Time Warning' : 'Overstock Notice'}
                    </span>
                    {isDanger ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : isWarning ? (
                      <Clock className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Leaf className="w-4 h-4 text-blue-600" />
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1">
                    {a.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {a.detail}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">
                    {isDanger ? 'Stockout Risk' : isWarning ? 'Reorder Window' : 'Prep Excess'}
                  </span>
                  <Link
                    to={a.link}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shadow-xs ${
                      isDanger
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : isWarning
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <span>{a.action}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TIER 2: VISUAL CHARTS (SIMPLE TITLES)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1 */}
        <div className="glass-surface rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Customer Orders Trend</h3>
              <p className="text-xs text-slate-500">Past Orders vs Expected Orders</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Last Orders
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Expected
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandForecastTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="week" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 10000]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    padding: '6px 10px'
                  }}
                />
                <Line type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} />
                <Line type="monotone" dataKey="predicted" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: '#F59E0B' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Forecast System: <strong className="text-slate-800">Smart AI Forecaster</strong></span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">+15% More Orders Expected</span>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="glass-surface rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Food Needed by Category</h3>
              <p className="text-xs text-slate-500">Total 1,250 kg needed for all dishes</p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
              7 Types
            </span>
          </div>

          <div className="flex items-center h-56">
            <div className="w-1/2 h-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryRequirementData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={74}
                    paddingAngle={2.5}
                  >
                    {categoryRequirementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-extrabold text-slate-900 font-mono">1,250</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">kg Food</span>
              </div>
            </div>

            <div className="w-1/2 space-y-1.5 pl-2 text-xs">
              {categoryRequirementData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 truncate">{item.name}</span>
                  </div>
                  <span className="font-bold font-mono text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Extra added for peeling & cutting:</span>
            <span className="font-mono font-bold text-slate-800">5% to 20% Extra</span>
          </div>
        </div>

        {/* Chart 3 */}
        <div className="glass-surface rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Stock in Store vs Minimum Needed</h3>
              <p className="text-xs text-slate-500">Blue bar should be higher than red dotted line</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> In Store
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-3 border-b-2 border-dashed border-rose-500"></span> Minimum Safe
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stockStatusOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 250]} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value} kg`,
                    name === 'current' ? 'In Store' : 'Minimum Safe Stock'
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    padding: '6px 10px'
                  }}
                />
                <Bar dataKey="current" name="current" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Line
                  type="monotone"
                  dataKey="safety"
                  name="safety"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#EF4444', strokeWidth: 1 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Chicken Shortage Warning:</span>
            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">82 kg Below Minimum</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TIER 3: CORE DATA TABLES (SIMPLE HEADERS)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top 5 Dishes - Interactive Culinary Cards */}
        <div className="lg:col-span-5 glass-surface rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Top 5 High-Demand Menu Dishes</h3>
              </div>
              <p className="text-xs text-slate-500">Predicted favorites for next week - click or hover to inspect</p>
            </div>
            <Link to="/forecast" className="text-xs font-bold text-blue-600 hover:text-blue-800">
              See All &rarr;
            </Link>
          </div>

          {/* Active Featured Dish Spotlight Hero - Grand Cinematic Showcase */}
          {(() => {
            const current = activeDish || topMeals[0];
            return (
              <div className="mb-4 rounded-2xl overflow-hidden relative shadow-md group border border-slate-200">
                {/* Grand Food Image with Gradient Overlay */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={current.img}
                    alt={current.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <span>★</span> Rank #{current.rank} Customer Favorite
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {current.category}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500 text-white shadow-sm">
                      {current.change} vs Last Week
                    </span>
                  </div>

                  {/* Hero Bottom Info Overlay */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h4 className="font-extrabold text-lg text-white drop-shadow-md leading-tight">
                        {current.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-200">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> {current.prepTime} kitchen prep
                        </span>
                        <span>•</span>
                        <span className="font-mono text-emerald-300 font-bold">
                          {current.revenue} est. weekly revenue
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/recipes"
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                    >
                      <span>Inspect Recipe</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Sub-bar Quick Insights */}
                <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-xs text-slate-300 border-t border-white/10">
                  <span className="text-slate-400">Projected Next 7 Days:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-extrabold text-sm">{current.orders} Plates</span>
                    <span className="text-[11px] text-slate-400">needed in kitchen</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* List of Top Dishes with Mini Interactive Thumbs */}
          <div className="space-y-1.5 overflow-y-auto max-h-56 pr-1">
            {topMeals.map((m) => {
              const isSelected = (activeDish?.rank || topMeals[0].rank) === m.rank;
              return (
                <div
                  key={m.rank}
                  onMouseEnter={() => setActiveDish(m)}
                  onClick={() => setActiveDish(m)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 shadow-2xs'
                      : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-400 w-4 text-center shrink-0">
                      #{m.rank}
                    </span>
                    <img
                      src={m.img}
                      alt={m.name}
                      className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-bold text-slate-900 text-xs block truncate leading-snug">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {m.category} &bull; {m.prepTime}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="font-mono font-bold text-slate-900 text-xs block">
                      {m.orders}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      {m.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day What to Order Table */}
        <div className="lg:col-span-7 glass-surface rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">What to Buy for the Next 7 Days</h3>
              <p className="text-xs text-slate-500">Only orders what you don't already have in stock</p>
            </div>
            <Link to="/procurement" className="text-xs font-bold text-blue-600 hover:text-blue-800">
              Open Shopping List →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="pb-2">Ingredient</th>
                  <th className="pb-2">Supplier</th>
                  <th className="pb-2 text-right">Total Needed</th>
                  <th className="pb-2 text-right">In Fridge</th>
                  <th className="pb-2 text-right text-rose-600 font-bold">You Must Buy</th>
                  <th className="pb-2 text-right">Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {procurementTableItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition group">
                    <td className="py-2.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 text-xs block group-hover:text-blue-600 transition truncate">
                            {item.name}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-mono block">
                            {item.id} &bull; {item.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-600 text-xs font-medium">{item.vendor}</td>
                    <td className="py-2.5 text-right font-mono text-slate-700 text-xs">{item.reqQty}</td>
                    <td className="py-2.5 text-right font-mono text-slate-700 text-xs">{item.availStock}</td>
                    <td className="py-2.5 text-right">
                      <span className="font-mono font-extrabold text-rose-600 text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        {item.recOrder}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900 text-xs">
                      {item.cost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TIER 4: ITEMS EXPIRING SOON & SAVE FOOD
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Expiring Soon */}
        <div className="lg:col-span-4 glass-surface rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Food Expiring Soon (Use First!)</h3>
              <p className="text-xs text-slate-500">Cook these batches before they spoil</p>
            </div>
            <Link to="/inventory" className="text-xs font-bold text-blue-600 hover:text-blue-800">See All →</Link>
          </div>

          <div className="space-y-2">
            {nearExpiryBatches.map((b, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="flex items-center space-x-2 font-bold text-slate-900 text-xs">
                    {renderIngredientIcon(b.iconType)}
                    <span>{b.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Storage: <strong className="text-slate-700">{b.zone}</strong> • Batch #{b.batchId}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 text-xs block">{b.remaining} left</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${
                    b.daysLeft <= 2 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {b.daysLeft} days left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Expiring Food Specials - Grand Culinary Promo Cards */}
        <div className="lg:col-span-5 glass-surface rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Chef Specials to Save Expiring Food</h3>
              </div>
              <p className="text-xs text-slate-500">Formulated by AI to rescue near-expiry stock with high-margin customer deals</p>
            </div>
            <Link to="/rescue" className="text-xs font-bold text-purple-600 hover:text-purple-800">
              Open Engine &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {rescueCards.map((rc, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Delicious Food Image Banner with Floating Badges */}
                  <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                    <img
                      src={rc.img}
                      alt={rc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    {/* Top Floating Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold shadow-xs ${rc.badgeColor}`}>
                        {rc.badge}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                        +{rc.savings} Saved
                      </span>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <h4 className="text-xs font-bold text-white leading-tight drop-shadow-sm truncate">
                        {rc.title}
                      </h4>
                    </div>
                  </div>

                  {/* Operational Details */}
                  <div className="p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Rescues at-risk:</span>
                      <strong className="text-rose-700 font-semibold">{rc.rescuedIngredient}</strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                      <span>Prepares: <strong>{rc.servings}</strong></span>
                      <span>{rc.prepTime} cook</span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        {rc.posDiscount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Link */}
                <div className="p-3 pt-0">
                  <Link
                    to="/rescue"
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Launch Campaign in POS</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suppliers */}
        <div className="lg:col-span-3 glass-surface rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Suppliers On-Time Score</h3>
              <p className="text-xs text-slate-500">How reliable your food delivery is</p>
            </div>
            <Link to="/suppliers" className="text-xs font-bold text-blue-600 hover:text-blue-800">Vendors →</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="pb-2">Supplier</th>
                  <th className="pb-2 text-center">On-Time %</th>
                  <th className="pb-2 text-right">Days to Deliver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {supplierScores.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 font-bold text-slate-900 text-xs truncate max-w-[120px]">{s.name}</td>
                    <td className="py-2 text-center font-mono font-bold text-emerald-700 text-xs">{s.otif}</td>
                    <td className="py-2 text-right font-mono text-slate-600 text-xs">{s.leadTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Verified Suppliers:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">All 4 Active</span>
          </div>
        </div>
      </div>

    </div>
  );
};
