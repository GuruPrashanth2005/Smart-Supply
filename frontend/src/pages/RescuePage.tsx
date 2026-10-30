import React, { useState } from 'react';
import axios from 'axios';
import {
  Sparkles,
  RefreshCw,
  ChefHat,
  Tag,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const RescuePage: React.FC = () => {
  const {
    aiRescueCampaigns,
    setAiRescueCampaigns,
    aiRescueLoading,
    setAiRescueLoading,
    rescueCampaigns,
    batches
  } = useData();

  const [pushedCampaigns, setPushedCampaigns] = useState<Record<number, boolean>>({});

  const handleRunAiRescue = async () => {
    setAiRescueLoading(true);
    try {
      const res = await axios.get('/api/spoilage-rescue/optimize');
      setAiRescueCampaigns(res.data.optimized_campaigns || []);
    } catch (err) {
      console.error('Groq Spoilage Rescue failed:', err);
    } finally {
      setAiRescueLoading(false);
    }
  };

  const [pushingIdx, setPushingIdx] = useState<number | null>(null);

  const handlePushToPos = async (idx: number, c: any) => {
    setPushingIdx(idx);
    try {
      const payload = {
        campaign_name: c.campaign_name || 'Chef Spoilage Rescue Special',
        target_ingredient: c.target_ingredient || 'Perishable Stock',
        rescued_qty: Number(c.rescued_qty_kg || c.target_qty || 15.0),
        promoted_dish: c.promoted_dish || 'Chef Special',
        discount_pct: Number(c.suggested_discount_pct || 15.0),
        sop_note: c.culinary_prep_strategy || 'Flash promotional special to clear perishable inventory'
      };

      const res = await axios.post('/api/spoilage-rescue/push-pos', payload);
      setPushedCampaigns(prev => ({ ...prev, [idx]: true }));
      alert(`⚡ ${res.data.message}\n\nReception Manager & Cash Counter can now offer this dish with ${payload.discount_pct}% discount!`);
    } catch (err) {
      console.error('Failed to push to POS:', err);
      alert('Failed to push campaign to Reception POS.');
    } finally {
      setPushingIdx(null);
    }
  };

  const displayCampaigns = aiRescueCampaigns.length > 0 ? aiRescueCampaigns : rescueCampaigns;

  // Filter urgent batches with <= 2 days left
  const urgentExpiringBatches = batches.filter((b: any) => {
    const days = b.days_left ?? b.days_to_expiry ?? 99;
    return days <= 2 && (b.remaining_qty ?? b.current_quantity ?? 0) > 0;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Dynamic Spoilage Rescue Engine</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Active Optimization Model
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Autonomous culinary repurposing: Scans perishable batches nearing expiration (≤ 48h) and formulates high-margin menu flash specials to prevent food waste.
          </p>
        </div>
        <button
          onClick={handleRunAiRescue}
          disabled={aiRescueLoading}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${aiRescueLoading ? 'animate-spin' : ''}`} />
          <span>{aiRescueLoading ? 'Formulating Specials...' : 'Run Spoilage Optimizer'}</span>
        </button>
      </div>

      {/* URGENT AT-RISK INVENTORY TICKER STRIP */}
      <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-rose-950 text-xs sm:text-sm">
                Critical Batches Nearing Expiry (≤ 48 Hours) Detected by Scanner ({urgentExpiringBatches.length})
              </h3>
              <p className="text-[11px] text-rose-800">
                These perishable batches require immediate cooking allocation or POS flash marketing to avoid spoilage loss.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px] font-bold uppercase tracking-wider">
            Urgent Action
          </span>
        </div>

        {/* Horizontal Mini Cards for Each Urgent Batch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {urgentExpiringBatches.map((b: any, idx: number) => {
            const batchNum = b.batch_id || b.batch_number;
            const daysLeft = b.days_left ?? b.days_to_expiry ?? 0;
            const qty = b.remaining_qty ?? b.current_quantity ?? 0;
            const location = b.storage_location || b.storage_zone || 'Chilled';

            return (
              <div
                key={idx}
                className="bg-white border border-rose-200 rounded-xl p-3 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] font-bold text-blue-700">{batchNum}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{daysLeft <= 0 ? 'Expires Today' : `${daysLeft} Day Left`}</span>
                  </span>
                </div>

                <div>
                  <div className="font-bold text-slate-900 text-xs">{b.ingredient_name}</div>
                  <span className="text-[10px] text-slate-400 block font-mono">Dock: {location}</span>
                </div>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Unused Stock:</span>
                  <span className="font-mono font-black text-rose-600">{qty} {b.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayCampaigns?.map((c: any, idx: number) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Flash Promotional Campaign
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-1.5">{c.campaign_name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Margin Recovered</span>
                  <span className="font-mono font-bold text-emerald-600 text-base">
                    +${c.financial_savings_usd || c.estimated_margin_gain || 0}
                  </span>
                </div>
              </div>

              {/* Targets Summary Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 mb-3.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">At-Risk Batch Ingredient:</span>
                  <span className="font-semibold text-rose-700">{c.target_ingredient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Inventory Volume to Rescue:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {c.rescued_qty_kg || c.target_qty} kg/L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Target Promoted Dish:</span>
                  <span className="font-semibold text-blue-700">{c.promoted_dish}</span>
                </div>
              </div>

              {/* Kitchen SOP Prep Guidance */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-blue-600" />
                  Kitchen Preparation & Repurposing SOP:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {c.culinary_prep_strategy}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-medium text-amber-800 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                POS Discount: {c.suggested_discount_pct}% Off
              </span>
              <button
                onClick={() => handlePushToPos(idx, c)}
                disabled={pushingIdx === idx}
                className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs shadow-xs transition cursor-pointer flex items-center space-x-1.5 ${
                  pushedCampaigns[idx]
                    ? 'bg-slate-900 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {pushedCampaigns[idx] ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live on Reception POS</span>
                  </>
                ) : (
                  <span>{pushingIdx === idx ? 'Pushing...' : 'Push Campaign to POS'}</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
