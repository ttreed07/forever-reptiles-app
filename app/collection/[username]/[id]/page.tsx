"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../lib/supabase";
import { getHusbandryRules } from "../../../../lib/husbandry";

export default function PublicAnimalProfile() {
  const params = useParams();
  const [reptile, setReptile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const username = decodeURIComponent(params.username as string).toLowerCase();

      const { data: repData, error } = await db
        .from("reptiles")
        .select("*")
        .eq("id", params.id)
        .eq("owner_username", username)
        .eq("is_public", true)
        .single();
        
      if (error || !repData) {
        setIsLoading(false);
        return;
      }
      
      setReptile(repData);

      const { data: logData } = await db
        .from("activity_logs")
        .select("activity_date, created_at, value_numeric, prey_weight_g, activity_type")
        .eq("reptile_id", params.id)
        .order("activity_date", { ascending: false });
        
      if (logData) setLogs(logData);
      setIsLoading(false);
    }
    fetchData();
  }, [params.id, params.username]);

  if (isLoading) return <div className="p-6 text-slate-400 text-center mt-10 animate-pulse">Loading public profile...</div>;
  if (!reptile) return <div className="p-6 text-slate-400 text-center mt-10">Animal not found or is not currently public.</div>;

  const rules = getHusbandryRules(reptile);
  
  const allPhotos: string[] = [];
  if (reptile.photo_url) allPhotos.push(reptile.photo_url);
  if (reptile.gallery_urls && reptile.gallery_urls.length > 0) {
    allPhotos.push(...reptile.gallery_urls);
  }
  
  const chartPts = logs
    .filter(l => l.activity_type === 'Weight' || l.activity_type === 'Feeding' || l.activity_type.includes('Shed'))
    .map(l => ({ d: l.activity_date || l.created_at, v: l.value_numeric, pVal: l.prey_weight_g, type: l.activity_type }))
    .sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime());

  return (
    <main className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <Link href={`/collection/${params.username}`} className="text-emerald-400 text-xs font-bold mb-2 inline-block hover:underline">
        &larr; Back to Public Gallery
      </Link>
      
      {/* Header Profile Card (Read-Only) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex justify-between items-start shadow-lg">
        <div className="flex gap-4 items-center">
          {reptile.photo_url ? (
            <div className="relative group cursor-pointer" onClick={() => { setCurrentPhotoIndex(0); setIsLightboxOpen(true); }}>
              <img src={reptile.photo_url} className="w-16 h-16 rounded-xl object-cover border border-slate-700 group-hover:opacity-75 transition" alt={reptile.name} />
              {allPhotos.length > 1 && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow border border-slate-900">
                  +{allPhotos.length - 1}
                </div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl">🐍</div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{reptile.name}</h1>
              {reptile.breeder_mode && <span className="bg-amber-500/95 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[9px]">🔥 Ready</span>}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{reptile.species} • {reptile.morph || 'Normal'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2">
        <button onClick={() => setActiveTab('overview')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'overview' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>Growth & Stats</button>
        <button onClick={() => setActiveTab('husbandry')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'husbandry' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>Husbandry Standards</button>
      </div>

      {/* Tab Content: OVERVIEW (Chart Only) */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
              <div>
                <span className="text-xs font-bold text-slate-200 block">📈 Lifecycle Growth & Prey Curve</span>
                <span className="text-[10px] text-slate-400">Proportional Weight (g), Prey Weight (g) & Shed Duration</span>
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

      {/* LIGHTBOX MODAL */}
      {isLightboxOpen && allPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <button onClick={() => setIsLightboxOpen(false)} className="absolute top-6 right-6 text-slate-300 hover:text-emerald-400 text-4xl font-bold z-50 transition">&times;</button>
          
          <div className="relative w-full max-w-4xl flex items-center justify-center flex-1 min-h-0">
            {allPhotos.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => prev === 0 ? allPhotos.length - 1 : prev - 1); }}
                className="absolute left-2 md:left-4 text-white text-5xl hover:text-emerald-400 p-2 z-50 drop-shadow-xl"
              >
                &#8249;
              </button>
            )}
            
            <img src={allPhotos[currentPhotoIndex]} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-800" alt="Gallery View" />
            
            {allPhotos.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => prev === allPhotos.length - 1 ? 0 : prev + 1); }}
                className="absolute right-2 md:right-4 text-white text-5xl hover:text-emerald-400 p-2 z-50 drop-shadow-xl"
              >
                &#8250;
              </button>
            )}
          </div>

          {allPhotos.length > 1 && (
            <div className="flex gap-2 pb-6 pt-4 shrink-0 overflow-x-auto max-w-full px-4">
              {allPhotos.map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  className={`w-14 h-14 object-cover rounded-md cursor-pointer transition-all duration-200 ${currentPhotoIndex === idx ? 'ring-2 ring-emerald-500 scale-110' : 'opacity-50 hover:opacity-100'}`}
                  onClick={() => setCurrentPhotoIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

// =========================================================================
// SVG CHART GENERATOR (Read-Only Version)
// =========================================================================
function drawUnifiedChart(logPts: any[]) {
  const weights = logPts.filter(l => l.type === 'Weight' && l.v !== null && !isNaN(Number(l.v)));
  const preys = logPts.filter(l => l.type === 'Feeding' && l.pVal !== null && !isNaN(Number(l.pVal)));
  const sheds = logPts.filter(l => l.type && l.type.includes('Shed'));
  
  if (!weights.length && !preys.length && !sheds.length) return `<span class="text-xs text-slate-500 h-full flex items-center justify-center">No chart data available yet.</span>`;

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