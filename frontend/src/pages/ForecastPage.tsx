import React, { useState } from 'react';
import {
  TrendingUp,
  Sliders,
  CloudRain,
  Sun,
  Flame,
  Sparkles,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  FlameKindling
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import { useData } from '../context/DataContext';

export const ForecastPage: React.FC = () => {
  const {
    forecastData,
    whatIfDemand,
    simulationResult,
    runWhatIfSimulation,
    selectedWeather,
    setSelectedWeather,
    selectedEvent,
    setSelectedEvent,
    applyDemandShock
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const forecastsList: any[] = forecastData?.forecasts || [];

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(forecastsList.map((f: any) => f.category).filter(Boolean)))];

  // Filtered forecasts table
  const filteredForecasts = forecastsList.filter((f: any) => {
    const matchesSearch = (f.meal_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.cuisine || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || f.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Top 10 for bar chart
  const chartData = [...forecastsList]
    .sort((a, b) => (b.predicted_orders || 0) - (a.predicted_orders || 0))
    .slice(0, 10)
    .map((f: any) => ({
      name: f.meal_name?.length > 20 ? f.meal_name.substring(0, 18) + '...' : f.meal_name || `Meal #${f.meal_id}`,
      predicted: Math.round(f.predicted_orders || 0),
      baseline: Math.round(f.baseline_orders || 0),
      category: f.category,
      cuisine: f.cuisine
    }));

  // Aggregate Metrics
  const totalPredictedOrders = forecastsList.reduce((acc, f) => acc + (f.predicted_orders || 0), 0);
  const totalBaselineOrders = forecastsList.reduce((acc, f) => acc + (f.baseline_orders || 0), 0);
  const growthRate = totalBaselineOrders > 0
    ? (((totalPredictedOrders - totalBaselineOrders) / totalBaselineOrders) * 100).toFixed(1)
    : '0.0';

  // Category aggregations
  const categoryStats: Record<string, { count: number; orders: number }> = {};
  forecastsList.forEach((f: any) => {
    const cat = f.category || 'Other';
    if (!categoryStats[cat]) categoryStats[cat] = { count: 0, orders: 0 };
    categoryStats[cat].count += 1;
    categoryStats[cat].orders += Math.round(f.predicted_orders || 0);
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Step-by-Step Explanation Guide */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Demand Forecaster</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Predicts next week's meal demand so the kitchen knows exactly how much food to prepare and ingredients to buy.
                </p>
              </div>
            </div>
          </div>

          {/* Model Accuracy Badge */}
          <div className="flex items-center space-x-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs shrink-0">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Accuracy (R²)</span>
              <span className="font-mono font-bold text-blue-700 text-sm">88.4%</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Forecast Horizon</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">Next 7 Days</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Expected Orders</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{Math.round(totalPredictedOrders).toLocaleString()} plates</span>
            </div>
          </div>
        </div>

        {/* Visual Workflow Steps (Explaining What Happens Here) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-start space-x-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <span className="font-bold text-blue-950 block">AI Predicts Customer Orders</span>
              <p className="text-[11px] text-blue-800/80 mt-0.5 leading-snug">
                Analyzes past ordering trends, weekday rushes, and discounts to estimate plates per dish.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-purple-50/60 rounded-xl border border-purple-100">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <span className="font-bold text-purple-950 block">Recipe Breakdown (BOM)</span>
              <p className="text-[11px] text-purple-800/80 mt-0.5 leading-snug">
                Multiplies plates by raw portions (chicken, rice, oil) adding kitchen trimming waste.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <span className="font-bold text-emerald-950 block">Calculates "What to Order"</span>
              <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-snug">
                Deducts current fridge stock so kitchen buys only what is missing without overstocking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Top 10 Chart & Weather/Festival Shock Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualizer Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Top 10 Most Ordered Dishes (Next 7 Days)
              </h3>
              <p className="text-xs text-slate-500">
                Highest volume meals driving 70% of kitchen raw ingredient requirements.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{growthRate}% vs Last Week</span>
            </div>
          </div>

          <div className="w-full h-80 min-h-[300px] mt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" tickLine={false} interval={0} height={50} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} plates`, 'Predicted Demand']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      color: '#0f172a'
                    }}
                  />
                  <Bar dataKey="predicted" name="Predicted Orders" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#1d4ed8' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading forecast data...
              </div>
            )}
          </div>
        </div>

        {/* Weather & Event Shock Controller */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Weather & Event Demand Shock</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Simulate sudden disruptions. Graphs and "What to Order" quantities adapt immediately.
            </p>

            <div className="space-y-4 text-xs">
              {/* Weather Buttons */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Weather Condition</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setSelectedWeather('normal');
                      applyDemandShock('normal', selectedEvent);
                    }}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                      selectedWeather === 'normal'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Normal</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWeather('rain');
                      applyDemandShock('rain', selectedEvent);
                    }}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                      selectedWeather === 'rain'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CloudRain className="w-4 h-4 text-blue-500" />
                    <span>Rain (+40% Soups)</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWeather('heatwave');
                      applyDemandShock('heatwave', selectedEvent);
                    }}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                      selectedWeather === 'heatwave'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>Heatwave (+50% Drinks)</span>
                  </button>
                </div>
              </div>

              {/* Event Buttons */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Special Occasion / Event</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedEvent('none');
                      applyDemandShock(selectedWeather, 'none');
                    }}
                    className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                      selectedEvent === 'none'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Regular Week
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEvent('festival');
                      applyDemandShock(selectedWeather, 'festival');
                    }}
                    className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                      selectedEvent === 'festival'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Festival Rush (+35%)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Changing shocks automatically recalculates missing stock in "What to Order".</span>
          </div>
        </div>
      </div>

      {/* 3. Category Volume Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(categoryStats).slice(0, 6).map(([catName, stats]) => (
          <div key={catName} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              {catName}
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
              {stats.orders.toLocaleString()}
            </span>
            <span className="text-[10.5px] text-slate-500 mt-0.5 block">
              {stats.count} dishes on menu
            </span>
          </div>
        ))}
      </div>

      {/* 4. Complete Detailed Dish-by-Dish Forecast Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Complete Dish-by-Dish Demand Forecast Table</h3>
            <p className="text-xs text-slate-500">
              Detailed plate predictions for every dish on the menu with trend variance.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search dish or cuisine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {categories.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Dish Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Cuisine</th>
                <th className="py-3 px-3 text-right">Past Sales (Avg)</th>
                <th className="py-3 px-3 text-right">Next 7-Days Forecast</th>
                <th className="py-3 px-3 text-right">Trend Shift</th>
                <th className="py-3 px-4 text-center">Kitchen Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredForecasts.map((f: any, idx: number) => {
                const growth = f.growth_pct || 0;
                const isHighVolume = (f.predicted_orders || 0) >= 300;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">{f.meal_name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">Meal ID #{f.meal_id}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] border border-slate-200">
                        {f.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{f.cuisine}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {Math.round(f.baseline_orders || 0)} plates
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-xs">
                      {Math.round(f.predicted_orders || 0)} plates
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex items-center text-xs font-semibold ${
                        growth >= 0 ? 'text-emerald-700' : 'text-slate-500'
                      }`}>
                        {growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {growth > 0 ? `+${growth}%` : `${growth}%`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isHighVolume ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <FlameKindling className="w-3 h-3" />
                          High Prep Load
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Regular Service</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. What-If Business Stress Tester Slider */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                What-If Scenario Simulator: "What if customer rush increases?"
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag slider to test kitchen stock buffer resilience and emergency budget requirement.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Simulated Customer Surge:</span>
            <span className="font-mono font-bold text-sm px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {whatIfDemand > 0 ? `+${whatIfDemand}%` : `${whatIfDemand}%`}
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="py-3">
          <input
            type="range"
            min="-30"
            max="50"
            step="5"
            value={whatIfDemand}
            onChange={(e) => runWhatIfSimulation(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
            <span>-30% Slow Week</span>
            <span>0% Normal Forecast</span>
            <span>+25% Weekend Rush</span>
            <span>+50% Extreme Festival Rush</span>
          </div>
        </div>

        {/* Simulation Output Cards */}
        {simulationResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-semibold uppercase">Ingredients Running Out</span>
              <span className={`font-mono font-bold text-lg ${simulationResult.stockout_count > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {simulationResult.stockout_count} Ingredients Risk
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Stock drops below zero during surge</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-semibold uppercase">Extra Budget Needed</span>
              <span className="font-mono font-bold text-lg text-slate-900">
                ${simulationResult.extra_cost_total?.toFixed(2)}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Additional emergency procurement cost</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] font-semibold uppercase">Most Vulnerable Item</span>
              <span className="font-semibold text-slate-900 truncate block text-sm">
                {simulationResult.items?.find((i: any) => i.stockout_risk)?.ingredient_name || 'All Items Safe'}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Requires advance supplier booking</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
