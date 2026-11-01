"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../../lib/supabase";

// Define a distinct color palette for the side-by-side comparisons
const COLORS = [
  { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-400", hex: "#10b981", active: "bg-emerald-500 text-slate-950" },
  { bg: "bg-sky-500/20", border: "border-sky-500/40", text: "text-sky-400", hex: "#0ea5e9", active: "bg-sky-400 text-slate-950" },
  { bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-400", hex: "#a855f7", active: "bg-purple-400 text-slate-950" },
  { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400", hex: "#f59e0b", active: "bg-amber-400 text-slate-950" },
  { bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-400", hex: "#f43f5e", active: "bg-rose-400 text-slate-950" },
  { bg: "bg-indigo-500/20", border: "border-indigo-500/40", text: "text-indigo-400", hex: "#6366f1", active: "bg-indigo-400 text-slate-950" }
];

export default function AnalyticsDashboard() {
  const [reptiles, setReptiles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection & Filtering State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chartRange, setChartRange] = useState("6M");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: repData } = await db.from("reptiles").select("*").order("name");
      if (repData) {
        setReptiles(repData);
        // Default to selecting the first two animals if available
        if (repData.length > 0) setSelectedIds([repData[0].id]);
        if (repData.length > 1) setSelectedIds([repData[0].id, repData[1].id]);
      }

      const { data: logData } = await db.from("activity_logs").select("*").order("activity_date", { ascending: false });
      if (logData) setLogs(logData);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const toggleReptile = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } else {
      // Limit to 6 concurrent comparisons to prevent chart chaos and out-of-bounds colors
      if (selectedIds.length < 6) setSelectedIds([...selectedIds, id]);
      else alert("Maximum of 6 animals can be compared at once.");
    }
  };

  const selectedReptiles = selectedIds.map(id => reptiles.find(r => r.id === id)).filter(Boolean);

  return (
    <main className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <header className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-emerald-400 tracking-tight">ForeverReptiles</h1>
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
        </div>
        <div className="text-[11px] text-slate-400">Analytics Engine</div>
      </header>

      {/* 3-Tab Main Navigation */}
      <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-4">
        <Link href="/" className="py-2.5 rounded-xl text-xs font-extrabold text-slate-400 text-center hover:text-white transition">
          🐍 Collection
        </Link>
        <Link href="/husbandry" className="py-2.5 rounded-xl text-xs font-extrabold text-slate-400 text-center hover:text-white transition">
          📋 Husbandry
        </Link>
        <div className="py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-slate-950 flex items-center justify-center gap-1.5 transition">
          📈 Analytics
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 text-sm py-10">Crunching data...</div>
      ) : (
        <section className="space-y-4 animate-in fade-in duration-200">
          
          {/* Multi-Snake Selector */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Compare Animals</h2>
            <div className="flex flex-wrap gap-2">
              {reptiles.map((r, i) => {
                const isSelected = selectedIds.includes(r.id);
                const colorIdx = selectedIds.indexOf(r.id);
                const theme = isSelected ? COLORS[colorIdx] : { border: "border-slate-800", active: "bg-slate-900 text-slate-500" };
                
                return (
                  <button 
                    key={r.id} 
                    onClick={() => toggleReptile(r.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 ${theme.active} ${isSelected ? '' : 'hover:bg-slate-800 hover:text-slate-300'}`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unified Comparison Chart */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-200 block">📊 Overlaid Growth Trajectories</span>
              <select value={chartRange} onChange={(e) => setChartRange(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded px-2 py-1 outline-none focus:border-emerald-500">
                <option value="3M">Last 3 Months</option>
                <option value="6M">Last 6 Months</option>
                <option value="1Y">Last Year</option>
                <option value="ALL">All Time</option>
              </select>
            </div>

            {selectedReptiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-2 px-2">
                {selectedReptiles.map((r, idx) => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx].hex }}></span>
                    <span className="text-[10px] font-bold text-slate-300">{r.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div 
              className="w-full h-64 flex items-center justify-center text-xs text-slate-500 pt-2 border-t border-slate-800/50 mt-2"
              dangerouslySetInnerHTML={{ __html: drawComparisonChart(logs, selectedReptiles, chartRange, COLORS) }}
            />
          </div>

        </section>
      )}
    </main>
  );
}

// =========================================================================
// MULTI-SNAKE SVG COMPARISON GENERATOR
// =========================================================================
function drawComparisonChart(logs: any[], selectedReptiles: any[], chartRange: string, colors: any[]) {
  if (selectedReptiles.length === 0) return `<span class="text-xs text-slate-500 h-full flex items-center justify-center">Select at least one animal above to generate a comparison chart.</span>`;
  
  const now = new Date();
  let cutoffDate = new Date("2000-01-01").getTime();
  if (chartRange === "3M") cutoffDate = new Date(now.setMonth(now.getMonth() - 3)).getTime();
  if (chartRange === "6M") cutoffDate = new Date(now.setMonth(now.getMonth() - 6)).getTime();
  if (chartRange === "1Y") cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1)).getTime();

  const activeIds = selectedReptiles.map(r => r.id);
  const validLogs = logs.filter(l => 
    activeIds.includes(l.reptile_id) && 
    new Date(l.activity_date || l.created_at).getTime() >= cutoffDate &&
    ((l.activity_type === 'Weight' && l.value_numeric != null) || 
     (l.activity_type === 'Feeding' && l.prey_weight_g != null) || 
     l.activity_type.includes('Shed'))
  );

  if (validLogs.length === 0) return `<span class="text-xs text-slate-500 h-full flex items-center justify-center">No chart data found for the selected animals in this timeframe.</span>`;

  const w = 460, h = 240;
  const mLeft = 52, mRight = 22, mTop = 24, mBottom = 38;
  const plotW = w - mLeft - mRight;
  const plotH = h - mTop - mBottom;

  const allTimes = validLogs.map(x => new Date(x.activity_date || x.created_at).getTime()).filter(t => !isNaN(t));
  const minT = allTimes.length ? Math.min(...allTimes) : Date.now();
  const maxT = allTimes.length ? Math.max(...allTimes) : Date.now();

  const allGrams = validLogs.map(x => Number(x.value_numeric || x.prey_weight_g || 0)).filter(g => g > 0);
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
    const count = Math.min(5, 5);
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

  let svgContent = `${yGridSvg}${yAxisLine}${yAxisTitle}${xTicksSvg}${xAxisTitle}`;

  // Draw data lines/points for each selected reptile
  selectedReptiles.forEach((rep, idx) => {
    const repLogs = validLogs.filter(l => l.reptile_id === rep.id);
    const colorHex = colors[idx].hex;
    
    const weights = repLogs.filter(l => l.activity_type === 'Weight').sort((a,b) => new Date(a.activity_date || a.created_at).getTime() - new Date(b.activity_date || b.created_at).getTime());
    const preys = repLogs.filter(l => l.activity_type === 'Feeding' && l.prey_weight_g).sort((a,b) => new Date(a.activity_date || a.created_at).getTime() - new Date(b.activity_date || b.created_at).getTime());
    const sheds = repLogs.filter(l => l.activity_type.includes('Shed'));

    // Weight lines and circles
    const wCoords = weights.map(pt => ({ x: scaleX(new Date(pt.activity_date || pt.created_at).getTime()), y: scaleY(pt.value_numeric) }));
    if (wCoords.length > 1) {
      svgContent += `<polyline fill="none" stroke="${colorHex}" stroke-width="2.5" opacity="0.9" points="${wCoords.map(c => `${c.x},${c.y}`).join(' ')}" />`;
    }
    wCoords.forEach(c => {
      svgContent += `<circle cx="${c.x}" cy="${c.y}" r="3" fill="#0f172a" stroke="${colorHex}" stroke-width="1.5" />`;
    });

    // Prey dots (small squares rotated 45deg)
    const pCoords = preys.map(pt => ({ x: scaleX(new Date(pt.activity_date || pt.created_at).getTime()), y: scaleY(pt.prey_weight_g) }));
    pCoords.forEach(c => {
      svgContent += `<rect x="${c.x - 2.5}" y="${c.y - 2.5}" width="5" height="5" fill="${colorHex}" opacity="0.8" transform="rotate(45 ${c.x} ${c.y})" />`;
    });

    // Shed markers (vertical ticks at the bottom of the graph)
    sheds.forEach((s, sIdx) => {
      const cx = scaleX(new Date(s.activity_date || s.created_at).getTime());
      // Stagger overlapping shed markers slightly vertically based on the animal index
      const markerY = mTop + plotH - 5 - (idx * 6);
      svgContent += `<line x1="${cx}" y1="${markerY}" x2="${cx}" y2="${markerY + 5}" stroke="${colorHex}" stroke-width="2" />`;
    });
  });

  return `<svg viewBox="0 0 ${w} ${h}" class="w-full h-full overflow-visible">${svgContent}</svg>`;
}