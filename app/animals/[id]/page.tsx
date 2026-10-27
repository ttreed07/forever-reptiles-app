"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "../../../lib/supabase";
import { getHusbandryRules } from "../../../lib/husbandry";
import LogCareModal from "../../../components/LogCareModal";

export default function AnimalProfile() {
  const params = useParams();
  const router = useRouter();
  const [reptile, setReptile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState("Feeding");
  const [refreshKey, setRefreshKey] = useState(0);

  // Health Form State
  const [healthForm, setHealthForm] = useState({
    record_date: new Date().toISOString().slice(0, 10),
    record_type: "Vet Visit",
    clinic_or_doctor: "",
    diagnosis: "",
    treatment_plan: ""
  });
  const [isSavingHealth, setIsSavingHealth] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: repData } = await db.from("reptiles").select("*").eq("id", params.id).single();
      if (repData) setReptile(repData);

      const { data: logData } = await db.from("activity_logs").select("*").eq("reptile_id", params.id).order("activity_date", { ascending: false });
      if (logData) setLogs(logData);

      const { data: healthData } = await db.from("reptile_health_records").select("*").eq("reptile_id", params.id).order("record_date", { ascending: false });
      if (healthData) setHealthRecords(healthData);
    }
    fetchData();
  }, [params.id, refreshKey]);

  if (!reptile) return <div className="p-6 text-slate-400 text-center mt-10 animate-pulse">Loading profile...</div>;

  const rules = getHusbandryRules(reptile);
  const showBreeding = reptile.is_breeder || reptile.breeder_mode;
  
  const chartPts = logs
    .filter(l => l.activity_type === 'Weight' || l.activity_type === 'Feeding' || l.activity_type.includes('Shed'))
    .map(l => ({ d: l.activity_date || l.created_at, v: l.value_numeric, pVal: l.prey_weight_g, type: l.activity_type }))
    .sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime());

  const openModal = (action = "Feeding") => {
    setModalAction(action);
    setIsModalOpen(true);
  };

  const handleLogAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSaveHealth = async (e: any) => {
    e.preventDefault();
    setIsSavingHealth(true);
    const { error } = await db.from("reptile_health_records").insert([{
      reptile_id: params.id,
      record_date: healthForm.record_date,
      record_type: healthForm.record_type,
      clinic_or_doctor: healthForm.clinic_or_doctor || null,
      diagnosis: healthForm.diagnosis || null,
      treatment_plan: healthForm.treatment_plan || null
    }]);
    if (!error) {
      setHealthForm({ record_date: new Date().toISOString().slice(0, 10), record_type: "Vet Visit", clinic_or_doctor: "", diagnosis: "", treatment_plan: "" });
      setRefreshKey(prev => prev + 1);
    }
    setIsSavingHealth(false);
  };

  const handleDeleteLog = async (logId: string) => {
    if (confirm("Delete this history log entry?")) {
      await db.from("activity_logs").delete().eq("id", logId);
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <main className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <Link href="/" className="text-emerald-400 text-xs font-bold mb-2 inline-block hover:underline">
        &larr; Back to Collection
      </Link>
      
      {/* Header Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex justify-between items-start shadow-lg">
        <div className="flex gap-4 items-center">
          {reptile.photo_url ? (
            <img src={reptile.photo_url} className="w-16 h-16 rounded-xl object-cover border border-slate-700" alt={reptile.name} />
          ) : (
            <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl">🐍</div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{reptile.name}</h1>
              {reptile.breeder_mode && <span className="bg-amber-500/95 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[9px]">🔥 Ready</span>}
              {reptile.is_breeder && !reptile.breeder_mode && <span className="bg-purple-500/90 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[9px]">⚤ Breeder</span>}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{reptile.species} • {reptile.morph || 'Normal'}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Link href={`/animals/${params.id}/edit`} className="text-[11px] text-slate-400 font-bold hover:text-white transition">✏️ Edit Profile</Link>
          <button onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://app.foreverreptiles.com/animals/scan?id=${params.id}&token=${reptile.qr_token}&color=0f172a&bgcolor=ffffff`, '_blank')} className="text-[11px] text-sky-400 font-bold hover:underline">
            🖨️ Print Cage QR
          </button>
          <button onClick={() => openModal("Feeding")} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow transition">+ Log Care</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2">
        <button onClick={() => setActiveTab('overview')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'overview' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>Overview</button>
        <button onClick={() => setActiveTab('husbandry')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'husbandry' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>📋 Husbandry</button>
        <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'history' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>History</button>
        <button onClick={() => setActiveTab('health')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'health' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>🏥 Health Vault</button>
        {showBreeding && (
          <button onClick={() => setActiveTab('breeding')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border text-purple-300 ${activeTab === 'breeding' ? 'bg-purple-500/20 border-purple-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>⚤ Breeding</button>
        )}
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
              <div>
                <span className="text-xs font-bold text-slate-200 block">📈 Lifecycle Growth & Prey Curve</span>
                <span className="text-[10px] text-slate-400">Proportional Weight (g), Prey Weight (g) & Shed Duration</span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openModal("Weight")} className="text-[10px] text-emerald-400 font-semibold border border-slate-800 px-2 py-1 rounded-lg hover:bg-slate-800">+ Weigh</button>
                <button onClick={() => openModal("Feeding")} className="text-[10px] text-amber-400 font-semibold border border-slate-800 px-2 py-1 rounded-lg hover:bg-slate-800">+ Feed</button>
                <button onClick={() => openModal("Shed: In the Blue")} className="text-[10px] text-purple-300 font-semibold border border-slate-800 px-2 py-1 rounded-lg hover:bg-slate-800">+ Shed</button>
              </div>
            </div>
            <div 
              className="w-full h-52 flex items-center justify-center text-xs text-slate-500 pt-2"
              dangerouslySetInnerHTML={{ __html: drawUnifiedChart(chartPts) }}
            />
          </div>
        </div>
      )}

      {/* Tab Content: HUSBANDRY */}
      {activeTab === 'husbandry' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3 text-xs text-slate-300" dangerouslySetInnerHTML={{ __html: `🎯 ${rules.summary}` }} />
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
            <span className="font-bold text-sky-400 block mb-2">🌡️ Environmental Standards</span>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800"><span className="text-slate-400 block text-[10px]">Thermal Gradient</span><strong>{rules.tWarm}°F</strong> warm • <strong>{rules.tCool}°F</strong> cool<br/>(Bask: <strong>{rules.tBasking}°F</strong>)</div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800"><span className="text-slate-400 block text-[10px]">Target Humidity</span><strong>{rules.hMin}% – {rules.hMax}%</strong></div>
              <div className="col-span-2 bg-slate-900 p-2 rounded-lg border border-slate-800"><span className="text-slate-400 block text-[10px]">Recommended Footprint</span>{rules.enc}</div>
              <div className="col-span-2 bg-slate-900 p-2 rounded-lg border border-slate-800"><span className="text-slate-400 block text-[10px]">Recommended Substrate</span>{rules.sub}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">⚡ Quick Log to Category</span>
            <div className="grid grid-cols-4 gap-1.5">
              <button onClick={() => openModal('Weight')} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 font-bold py-1.5 px-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1">+ ⚖️ Weight</button>
              <button onClick={() => openModal('Feeding')} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-bold py-1.5 px-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1">+ 🐁 Feeding</button>
              <button onClick={() => openModal('Shed: In the Blue')} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-300 font-bold py-1.5 px-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1">+ 🐍 Shed</button>
              <button onClick={() => openModal('Water & Clean')} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-300 font-bold py-1.5 px-2 rounded-lg text-[11px] transition flex items-center justify-center gap-1">+ 🧹 Chores</button>
            </div>
          </div>
          <h4 className="text-xs font-bold uppercase text-slate-400 mt-3">Animal History (Click to Delete)</h4>
          <div className="space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-800 rounded-xl">No logs found.</p>
            ) : (
              logs.map(l => (
                <div key={l.id} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex justify-between items-center text-xs hover:border-slate-700 transition">
                  <div>
                    <span className="text-emerald-400 font-semibold">{l.activity_type}</span> 
                    {l.value_numeric && <span className="text-emerald-300 font-bold ml-1">{l.value_numeric}g</span>}
                    {l.prey_weight_g && <span className="text-amber-300 font-bold ml-1">Prey: {l.prey_weight_g}g</span>}
                    <span className="text-slate-400 ml-1">{l.notes || ''}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-slate-500 text-[11px]">
                      {new Date(l.activity_date || l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button onClick={() => handleDeleteLog(l.id)} className="text-red-400 hover:text-red-300 text-[10px] font-bold">🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content: HEALTH VAULT */}
      {activeTab === 'health' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <form onSubmit={handleSaveHealth} className="bg-slate-950 border border-sky-500/30 rounded-xl p-3.5 space-y-3 text-xs">
            <span className="font-bold text-sky-400 block">🏥 Log Vet / Medical Record</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Date</label>
                <input type="date" value={healthForm.record_date} onChange={e => setHealthForm({...healthForm, record_date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Type</label>
                <select value={healthForm.record_type} onChange={e => setHealthForm({...healthForm, record_type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white">
                  <option value="Vet Visit">Vet Visit</option>
                  <option value="Fecal Exam">Fecal Exam</option>
                  <option value="Medication">Medication</option>
                  <option value="Shed Issue">Shed Issue</option>
                  <option value="General Note">General Note</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={healthForm.clinic_or_doctor} onChange={e => setHealthForm({...healthForm, clinic_or_doctor: e.target.value})} placeholder="Clinic or Vet Name" className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white" />
              <input type="text" value={healthForm.diagnosis} onChange={e => setHealthForm({...healthForm, diagnosis: e.target.value})} placeholder="Diagnosis / Result" className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white" />
            </div>
            <textarea rows={2} value={healthForm.treatment_plan} onChange={e => setHealthForm({...healthForm, treatment_plan: e.target.value})} placeholder="Treatment plan, dosage, or medical notes..." className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"></textarea>
            <button type="submit" disabled={isSavingHealth} className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition">
              {isSavingHealth ? "Saving..." : "+ Save Medical Record"}
            </button>
          </form>

          <div className="space-y-2">
            {healthRecords.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-800 rounded-xl">No health records logged yet.</p>
            ) : (
              healthRecords.map(h => (
                <div key={h.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold text-sky-400">
                    <span>{h.record_type} • <span className="text-slate-300">{h.record_date}</span></span>
                    <span className="text-[10px] text-slate-400">{h.clinic_or_doctor}</span>
                  </div>
                  {h.diagnosis && <p className="text-slate-200"><strong>Diagnosis:</strong> {h.diagnosis}</p>}
                  {h.treatment_plan && <p className="text-slate-400">{h.treatment_plan}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content: BREEDING */}
      {showBreeding && activeTab === 'breeding' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-4 text-xs space-y-2">
            <span className="font-bold text-amber-300 block text-sm">🔥 Seasonal Breeder Conditioning Roadmap</span>
            <p className="text-slate-300 leading-relaxed">
              Track seasonal cooling cycles, follicle palpations, locks, and pre-lay sheds for {reptile.name}.
            </p>
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button onClick={() => openModal("Lock / Pairing")} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition">
                + Log Lock / Pairing
              </button>
            </div>
          </div>
        </div>
      )}

      <LogCareModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        reptile={reptile} 
        onLogAdded={handleLogAdded} 
        initialAction={modalAction} 
      />
    </main>
  );
}

// =========================================================================
// SVG CHART GENERATOR (Unchanged)
// =========================================================================
function drawUnifiedChart(logPts: any[]) {
  const weights = logPts.filter(l => l.type === 'Weight' && l.v !== null && !isNaN(Number(l.v)));
  const preys = logPts.filter(l => l.type === 'Feeding' && l.pVal !== null && !isNaN(Number(l.pVal)));
  const sheds = logPts.filter(l => l.type && l.type.includes('Shed'));
  
  if (!weights.length && !preys.length && !sheds.length) return `<span class="text-xs text-slate-500 h-full flex items-center justify-center">No chart data logged yet.</span>`;

  const w = 460, h = 200;
  const mLeft = 52, mRight = 22, mTop = 24, mBottom = 38;
  const plotW = w - mLeft - mRight;
  const plotH = h - mTop - mBottom;

  const allTimes = logPts.map(x => new Date(x.d).getTime()).filter(t => !isNaN(t));
  const minT = Math.min(...allTimes), maxT = Math.max(...allTimes);

  const allGrams = [...weights.map(x => Number(x.v)), ...preys.map(x => Number(x.pVal))];
  const rawMaxG = allGrams.length ? Math.max(...allGrams) : 100;
  const maxG = Math.max(10, Math.ceil((rawMaxG * 1.1) / 10) * 10);
  const minG = 0;

  const scaleX = (t: number) => maxT === minT ? mLeft + plotW / 2 : mLeft + ((t - minT) / (maxT - minT)) * plotW;
  const scaleY = (g: number) => mTop + plotH - ((Math.max(0, Number(g)) - minG) / (maxG - minG)) * plotH;

  const yTicks = [0, Math.round(maxG * 0.25), Math.round(maxG * 0.5), Math.round(maxG * 0.75), maxG];
  const uniqueYTicks = Array.from(new Set(yTicks));
  const yGridSvg = uniqueYTicks.map(val => {
    const y = scaleY(val);
    return `
      <line x1="${mLeft}" y1="${y}" x2="${w - mRight}" y2="${y}" stroke="#1e293b" stroke-width="1" stroke-dasharray="${val === 0 ? '' : '3,3'}" />
      <text x="${mLeft - 6}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="8.5" font-weight="600">${val}g</text>
    `;
  }).join('');
  const yAxisLine = `<line x1="${mLeft}" y1="${mTop}" x2="${mLeft}" y2="${mTop + plotH}" stroke="#334155" stroke-width="1.2" />`;
  const yAxisTitle = `<text x="12" y="${mTop + plotH / 2}" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="bold" transform="rotate(-90, 12, ${mTop + plotH / 2})">Weight (g)</text>`;

  let xTicksTimes: number[] = [];
  if (minT === maxT) {
    xTicksTimes = [minT];
  } else {
    const count = Math.min(5, Math.max(2, logPts.length));
    for (let i = 0; i < count; i++) xTicksTimes.push(minT + ((maxT - minT) * i) / (count - 1));
  }
  const xTicksSvg = xTicksTimes.map(t => {
    const x = scaleX(t);
    const lbl = new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `
      <line x1="${x}" y1="${mTop + plotH}" x2="${x}" y2="${mTop + plotH + 4}" stroke="#475569" stroke-width="1" />
      <text x="${x}" y="${mTop + plotH + 14}" text-anchor="middle" fill="#64748b" font-size="8.5" font-weight="600">${lbl}</text>
    `;
  }).join('');
  const xAxisTitle = `<text x="${mLeft + plotW / 2}" y="${h - 4}" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="bold">Date</text>`;

  const sortedSheds = [...sheds].sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime());
  const shedGroups: any[] = [];
  let activeShedGroup: any = null;

  sortedSheds.forEach(s => {
    const tType = (s.type || '').toLowerCase();
    const isStartOrMid = tType.includes('in the blue') || tType.includes('out of the blue') || tType.includes('clear');
    const isComplete = tType.includes('complete') || s.type === 'Shed' || tType.includes('pre-ovulation') || tType.includes('post-ovulation');

    if (isStartOrMid) {
      if (!activeShedGroup) activeShedGroup = [s];
      else {
        const prevTime = new Date(activeShedGroup[activeShedGroup.length - 1].d).getTime();
        const curTime = new Date(s.d).getTime();
        if ((curTime - prevTime) / 86400000 <= 35) activeShedGroup.push(s);
        else { shedGroups.push(activeShedGroup); activeShedGroup = [s]; }
      }
    } else if (isComplete) {
      if (activeShedGroup) {
        const prevTime = new Date(activeShedGroup[activeShedGroup.length - 1].d).getTime();
        const curTime = new Date(s.d).getTime();
        if ((curTime - prevTime) / 86400000 <= 35) {
          activeShedGroup.push(s); shedGroups.push(activeShedGroup); activeShedGroup = null;
        } else {
          shedGroups.push(activeShedGroup); activeShedGroup = null; shedGroups.push([s]);
        }
      } else { shedGroups.push([s]); }
    } else { shedGroups.push([s]); }
  });
  if (activeShedGroup) shedGroups.push(activeShedGroup);

  const shedSvg = shedGroups.map((grp, gIdx) => {
    const yShed = mTop + 10 + (gIdx % 2) * 14;
    if (grp.length === 1) {
      const pt = grp[0];
      const x = scaleX(new Date(pt.d).getTime());
      const shortLbl = pt.type.includes('In the Blue') ? '🔵 Blue' : (pt.type.includes('Out of the Blue') ? '👀 Clear' : '🐍 Shed');
      return `
        <line x1="${x}" y1="${mTop}" x2="${x}" y2="${mTop + plotH}" stroke="#a855f7" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.65" />
        <circle cx="${x}" cy="${yShed}" r="3.5" fill="#a855f7" stroke="#0f172a" stroke-width="1" />
        <text x="${x}" y="${yShed - 5}" text-anchor="middle" fill="#d8b4fe" font-size="8" font-weight="bold">${shortLbl}</text>
      `;
    } else {
      const tStart = new Date(grp[0].d).getTime();
      const tEnd = new Date(grp[grp.length - 1].d).getTime();
      const x1 = scaleX(tStart);
      const x2 = scaleX(tEnd);
      const spanDays = Math.max(1, Math.round((tEnd - tStart) / 86400000));
      const midX = (x1 + x2) / 2;
      const nodes = grp.map((pt: any) => {
        const cx = scaleX(new Date(pt.d).getTime());
        const isBlue = pt.type.includes('In the Blue');
        const isClear = pt.type.includes('Out of the Blue');
        const fillCol = isBlue ? '#38bdf8' : (isClear ? '#c084fc' : '#a855f7');
        return `<circle cx="${cx}" cy="${yShed}" r="3.2" fill="${fillCol}" stroke="#0f172a" stroke-width="1" />`;
      }).join('');
      return `
        <rect x="${x1}" y="${mTop}" width="${Math.max(2, x2 - x1)}" height="${plotH}" fill="#a855f7" opacity="0.08" />
        <line x1="${x1}" y1="${yShed}" x2="${x2}" y2="${yShed}" stroke="#c084fc" stroke-width="2" stroke-dasharray="3,2" />
        <line x1="${x1}" y1="${mTop}" x2="${x1}" y2="${mTop + plotH}" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2,2" opacity="0.5" />
        <line x1="${x2}" y1="${mTop}" x2="${x2}" y2="${mTop + plotH}" stroke="#a855f7" stroke-width="1" stroke-dasharray="2,2" opacity="0.5" />
        ${nodes}
        <text x="${midX}" y="${yShed - 5}" text-anchor="middle" fill="#e9d5ff" font-size="8" font-weight="bold">🐍 Shed (${spanDays}d)</text>
      `;
    }
  }).join('');

  const wCoords = weights.map(pt => ({ x: scaleX(new Date(pt.d).getTime()), y: scaleY(pt.v), v: pt.v }));
  const wLine = wCoords.length > 1 ? `<polyline fill="none" stroke="#10b981" stroke-width="2.2" points="${wCoords.map(c => `${c.x},${c.y}`).join(' ')}" />` : '';
  const wCircles = wCoords.map(c => `
    <circle cx="${c.x}" cy="${c.y}" r="3.5" fill="#10b981" stroke="#020617" stroke-width="1" />
    <text x="${c.x}" y="${c.y - 6}" text-anchor="middle" fill="#a7f3d0" font-size="8.5" font-weight="bold">${c.v}g</text>
  `).join('');

  const pCoords = preys.map(pt => ({ x: scaleX(new Date(pt.d).getTime()), y: scaleY(pt.pVal), v: pt.pVal }));
  const pLine = pCoords.length > 1 ? `<polyline fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.6" points="${pCoords.map(c => `${c.x},${c.y}`).join(' ')}" />` : '';
  const pCircles = pCoords.map(c => `
    <rect x="${c.x - 3}" y="${c.y - 3}" width="6" height="6" fill="#f59e0b" transform="rotate(45 ${c.x} ${c.y})" />
    <text x="${c.x}" y="${c.y - 6}" text-anchor="middle" fill="#fcd34d" font-size="8" font-weight="bold">${c.v}g</text>
  `).join('');

  return `
    <svg viewBox="0 0 ${w} ${h}" class="w-full h-full overflow-visible">
      ${yGridSvg}${yAxisLine}${yAxisTitle}${xTicksSvg}${xAxisTitle}${shedSvg}${wLine}${wCircles}${pLine}${pCircles}
    </svg>
  `;
}