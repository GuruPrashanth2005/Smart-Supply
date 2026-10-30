import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Clock,
  Sparkles,
  Tag,
  Gift,
  Plus,
  CheckCircle2,
  Bell,
  X,
  XCircle,
  Eye,
  Info,
  Wand2
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const ReceptionPage: React.FC = () => {
  const { recipes, fetchAllData } = useData();

  const [dayparts, setDayparts] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);

  // Detailed Modal for inspecting promo details
  const [inspectedPromo, setInspectedPromo] = useState<any>(null);

  // Modal State for Scheduling an Advance Promo
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<number>(recipes[0]?.meal_id || 1902);
  const [promoType, setPromoType] = useState<string>('BOGO');
  const [promoName, setPromoName] = useState<string>('Weekend Biryani 1+1 Bonanza');
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 days in advance
  );
  const [targetDaypart, setTargetDaypart] = useState<string>('LUNCH');
  const [complimentaryMealId, setComplimentaryMealId] = useState<number | null>(null);
  const [discountPct] = useState<number>(50);
  const [promoNotes, setPromoNotes] = useState<string>('Expected dinner/lunch surge. Alert kitchen for chicken & rice buffer.');
  const [savingPromo, setSavingPromo] = useState(false);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);

  // AI Suggestion State
  const [aiGenerating, setAiGenerating] = useState(false);

  const fetchReceptionData = async () => {
    try {
      const [dpRes, prRes] = await Promise.all([
        axios.get('/api/reception/dayparts'),
        axios.get('/api/reception/promos')
      ]);
      setDayparts(dpRes.data);
      setPromos(prRes.data);
    } catch (err) {
      console.error('Error loading reception data:', err);
    }
  };

  useEffect(() => {
    fetchReceptionData();
  }, []);

  // SMART AI SUGGESTION GENERATOR FOR RECEPTION NOTES & CAMPAIGN SETUP
  const handleGenerateAiSuggestion = (targetField?: 'TITLE' | 'NOTES' | 'ALL') => {
    setAiGenerating(true);
    const matchedMeal = recipes.find((r: any) => r.meal_id === Number(selectedMealId)) || { meal_name: 'Biryani', category: 'Rice Bowl' };
    const daypartLabel = targetDaypart === 'LUNCH' ? 'Lunch Service (12:30-03:30 PM)' : (targetDaypart === 'NIGHT' ? 'Dinner Feast (07:30-11:30 PM)' : `${targetDaypart} Window`);

    setTimeout(() => {
      let smartTitle = '';
      let smartNotes = '';

      if (promoType === 'BOGO') {
        smartTitle = `Special 1+1 Bonanza: ${matchedMeal.meal_name}`;
        smartNotes = `Advance table bookings show heavy surge during ${daypartLabel}. Anticipated customer orders +110%. Kitchen mise-en-place instruction: Pre-portion protein, marination batches and grain base 48 hours early. Verify cold-room safety buffer for dairy/produce to prevent middle-of-service stockouts.`;
      } else if (promoType === 'FLAT_DISCOUNT') {
        smartTitle = `Flash Offer: Flat 40% Off on ${matchedMeal.meal_name}`;
        smartNotes = `Family dining rush anticipated for ${daypartLabel}. Projected +60% order volume spike. Kitchen prep alert: Allocate secondary burner capacity and alert morning shift for vegetable chopping & gravy base simmering.`;
      } else {
        const compMeal = recipes.find((r: any) => r.meal_id === Number(complimentaryMealId));
        const compName = compMeal ? compMeal.meal_name : 'Cold Beverage / Dessert';
        smartTitle = `Exclusive Combo: ${matchedMeal.meal_name} + Complimentary ${compName}`;
        smartNotes = `Cross-station promotion scheduled for ${daypartLabel}. Kitchen instruction: Ensure chiller stations are stocked with chilled glasses, dairy and syrups for complimentary ${compName}. Alert floor runners for rapid order assembly.`;
      }

      if (targetField === 'TITLE') {
        setPromoName(smartTitle);
      } else if (targetField === 'NOTES') {
        setPromoNotes(smartNotes);
      } else {
        setPromoName(smartTitle);
        setPromoNotes(smartNotes);
      }
      setAiGenerating(false);
    }, 450);
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPromo(true);
    setPromoMsg(null);

    try {
      const payload = {
        meal_id: Number(selectedMealId),
        promo_type: promoType,
        promo_name: promoName,
        target_date: targetDate,
        target_daypart: targetDaypart,
        complimentary_meal_id: complimentaryMealId ? Number(complimentaryMealId) : null,
        discount_pct: Number(discountPct),
        notes: promoNotes
      };

      const res = await axios.post('/api/reception/promos', payload);
      setPromoMsg(res.data.message || 'Promotion submitted to Kitchen for Approval!');
      await fetchReceptionData();
      await fetchAllData();

      setTimeout(() => {
        setShowPromoModal(false);
        setPromoMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create promo:', err);
      alert('Failed to schedule promotion.');
    } finally {
      setSavingPromo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                Reception & Sales Operations Portal
              </h1>
              <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">
                Floor Manager control: Track daypart meal sales, schedule advance 1+1 offers, and monitor Inventory Manager approval status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowPromoModal(true)}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition cursor-pointer flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule 1+1 / Flash Offer</span>
          </button>
        </div>
      </div>

      {/* 2. Process Sync Strip */}
      <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 rounded-xl text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5 text-purple-950 font-medium">
          <Bell className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Two-Way Kitchen Alignment:</strong> When you propose an offer, Inventory Manager reviews kitchen stock capacity. Once they click <strong>Approve</strong>, orders scale and stock is pre-booked!
          </span>
        </div>
        <button
          onClick={fetchReceptionData}
          className="text-[11px] font-bold text-purple-700 px-2.5 py-1 rounded-lg bg-purple-100 border border-purple-200 hover:bg-purple-200 transition cursor-pointer shrink-0"
        >
          Refresh Status
        </button>
      </div>

      {/* 3. Daypart Order Velocity (Morning, Brunch, Lunch, Evening, Night) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daypart Meal Velocity & Timings</h3>
            <p className="text-xs text-slate-500">Sales breakdown across service windows to plan kitchen staffing and fresh batch cooking.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">Today's Operating Cycle</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {dayparts.map((dp) => (
            <div key={dp.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-purple-300 transition">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10.5px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase">
                    {dp.id}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-1">{dp.name}</h4>
                <span className="text-[10px] text-slate-400 font-mono block">{dp.hours}</span>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Orders:</span>
                    <span className="font-bold font-mono text-slate-900">{dp.avg_orders} plates</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Revenue:</span>
                    <span className="font-bold font-mono text-emerald-700">₹{dp.revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Top Selling Items</span>
                  <div className="space-y-1">
                    {dp.top_dishes?.slice(0, 2).map((dish: string, i: number) => (
                      <span key={i} className="text-[11px] text-slate-700 font-medium block truncate">
                        • {dish}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Scheduled Promotional Campaigns (1+1, Combos, Discounts) with Details Modal */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Scheduled Advance Offers & Promotions (Floor Plan)</h3>
            <p className="text-xs text-slate-500">Click any row to inspect complete recipe impact, kitchen response, and stock status.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
            {promos.length} Floor Campaigns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Promotion Name</th>
                <th className="py-3 px-3">Offer Type</th>
                <th className="py-3 px-3">Target Dish</th>
                <th className="py-3 px-3">Date & Daypart</th>
                <th className="py-3 px-3 text-right">Expected Demand Surge</th>
                <th className="py-3 px-4 text-center">Inventory Manager Approval</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promos.length > 0 ? (
                promos.map((p, idx) => {
                  const isApproved = p.status === 'APPROVED_BY_KITCHEN' || p.status === 'SCHEDULED';
                  const isPending = p.status === 'PENDING_APPROVAL';

                  return (
                    <tr
                      key={idx}
                      onClick={() => setInspectedPromo(p)}
                      className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{p.promo_name}</div>
                        <span className="text-[10.5px] text-slate-400">{p.notes || 'Floor campaign'}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Tag className="w-3 h-3" />
                          {p.promo_type === 'BOGO' ? 'Buy 1 Get 1 Free (1+1)' : (p.promo_type === 'FLAT_DISCOUNT' ? 'Flat % Off' : p.promo_type)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {p.meal_name}
                        {p.complimentary_meal_name && (
                          <span className="text-[11px] text-emerald-700 block">+ Free {p.complimentary_meal_name}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        <div className="font-bold">{p.target_date}</div>
                        <span className="text-[10.5px] text-slate-400 font-sans">{p.target_daypart}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-purple-700">
                        +{Math.round((p.expected_order_multiplier - 1) * 100)}% Surge
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved by Kitchen
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            Awaiting Kitchen Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Rejected (Stock Deficit)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedPromo(p);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No advance offers currently scheduled. Click 'Schedule 1+1 / Flash Offer' to set up a campaign.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROMOTION DETAILS MODAL (CLICK TO VIEW FULL DETAILS) */}
      {inspectedPromo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-purple-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{inspectedPromo.promo_name}</h3>
                  <p className="text-[11px] text-slate-500">Proposal #{inspectedPromo.promo_id} • Created {inspectedPromo.created_at}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedPromo(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Approval Status Banner */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                inspectedPromo.status === 'APPROVED_BY_KITCHEN' || inspectedPromo.status === 'SCHEDULED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : inspectedPromo.status === 'PENDING_APPROVAL'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center space-x-2">
                  {inspectedPromo.status === 'APPROVED_BY_KITCHEN' || inspectedPromo.status === 'SCHEDULED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : inspectedPromo.status === 'PENDING_APPROVAL' ? (
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block text-xs">
                      {inspectedPromo.status === 'APPROVED_BY_KITCHEN' || inspectedPromo.status === 'SCHEDULED'
                        ? 'Approved by Inventory Manager'
                        : inspectedPromo.status === 'PENDING_APPROVAL'
                        ? 'Awaiting Kitchen Stock Approval'
                        : 'Rejected by Inventory Manager'}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {inspectedPromo.status === 'APPROVED_BY_KITCHEN' || inspectedPromo.status === 'SCHEDULED'
                        ? 'Raw ingredients have been scaled in "What to Order" and pre-booked with suppliers.'
                        : inspectedPromo.status === 'PENDING_APPROVAL'
                        ? 'Inventory Manager is reviewing stock availability in the kitchen store.'
                        : 'Kitchen cannot support this rush due to raw ingredient stockout risks.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Campaign Specifications */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Target Dish:</span>
                  <span className="font-bold text-slate-900">{inspectedPromo.meal_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Offer Type:</span>
                  <span className="font-semibold text-purple-700">
                    {inspectedPromo.promo_type === 'BOGO' ? 'Buy 1 Get 1 Free (1+1)' : inspectedPromo.promo_type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Scheduled Service Date:</span>
                  <span className="font-mono font-bold text-slate-800">{inspectedPromo.target_date} ({inspectedPromo.target_daypart})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Demand Lift Multiplier:</span>
                  <span className="font-mono font-bold text-purple-700">+{Math.round((inspectedPromo.expected_order_multiplier - 1) * 100)}% Surge</span>
                </div>
                {inspectedPromo.notes && (
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <span className="text-slate-500 block text-[10.5px]">Reception Note for Kitchen:</span>
                    <p className="text-slate-700 italic mt-0.5">"{inspectedPromo.notes}"</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Role Separation:</strong> Floor Manager proposes promotions. Inventory Manager verifies raw ingredient stock. Once approved, supplier purchase orders scale automatically.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end bg-slate-50/60">
              <button
                onClick={() => setInspectedPromo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE 1+1 / ADVANCE PROMO */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-purple-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Schedule Advance Offer / 1+1 Campaign</h3>
                  <p className="text-[11px] text-slate-500">
                    Schedules ahead of time. Inventory manager automatically receives stock pre-ordering alerts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPromoModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {promoMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{promoMsg}</span>
                </div>
              )}

              {/* Offer Mechanism & Target Dish */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Offer Mechanism</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="BOGO">Buy 1 Get 1 Free (1+1)</option>
                    <option value="FLAT_DISCOUNT">Flat % Discount</option>
                    <option value="COMPLIMENTARY_ITEM">Buy Dish + Free Beverage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Menu Dish</label>
                  <select
                    value={selectedMealId}
                    onChange={(e) => setSelectedMealId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold"
                  >
                    {recipes.map((r: any) => (
                      <option key={r.meal_id} value={r.meal_id}>
                        {r.meal_name} ({r.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI Auto-Fill Recommendation Banner */}
              <div className="flex items-center justify-between p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-purple-900 block">AI Culinary & Campaign Assistant</span>
                    <span className="text-[10px] text-purple-700">Auto-tailor field descriptions based on selected dish & target daypart</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateAiSuggestion('ALL')}
                  disabled={aiGenerating}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${aiGenerating ? 'animate-spin' : ''}`} />
                  <span>{aiGenerating ? 'AI Writing...' : 'AI Auto-Fill All'}</span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Campaign Title</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiSuggestion('TITLE')}
                    className="text-[10.5px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>AI Title</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="e.g. Weekend Biryani 1+1 Bonanza"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Date (2 Days in Advance)
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Daypart Window</label>
                  <select
                    value={targetDaypart}
                    onChange={(e) => setTargetDaypart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="FULL_DAY">Full Day Service</option>
                    <option value="LUNCH">Peak Lunch (12:30 - 03:30 PM)</option>
                    <option value="NIGHT">Dinner Feast (07:30 - 11:30 PM)</option>
                    <option value="EVENING">Evening Snacks (04:30 - 07:00 PM)</option>
                    <option value="MORNING">Morning Rush (07:00 - 11:00 AM)</option>
                  </select>
                </div>
              </div>

              {promoType === 'COMPLIMENTARY_ITEM' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Complimentary Free Dish</label>
                  <select
                    value={complimentaryMealId || ''}
                    onChange={(e) => setComplimentaryMealId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="">Select free companion item...</option>
                    {recipes.filter((r: any) => r.category === 'Beverages' || r.category === 'Desert').map((r: any) => (
                      <option key={r.meal_id} value={r.meal_id}>{r.meal_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Reception Notes for Kitchen</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiSuggestion('NOTES')}
                    className="text-[10.5px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>AI Note Suggestion</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={promoNotes}
                  onChange={(e) => setPromoNotes(e.target.value)}
                  placeholder="Notes on customer booking volume & buffer requirements..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 leading-relaxed font-sans"
                />
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 space-y-1">
                <span className="font-bold block">⚡ Automated Kitchen Supply Chain Trigger:</span>
                <p className="text-[11px] leading-relaxed">
                  Submitting this proposal sends an approval alert to the Inventory Manager. Only after they verify stock capacity and click <strong>Approve</strong> will the extra ingredient quantities be ordered from suppliers.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPromo}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition cursor-pointer shadow-md shadow-purple-600/20"
                >
                  {savingPromo ? 'Submitting Proposal...' : 'Submit Proposal to Kitchen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
