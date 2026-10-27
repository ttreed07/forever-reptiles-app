"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../../lib/supabase";
import { getHusbandryRules, daysAgo } from "../../lib/husbandry";

export default function HusbandryDashboard() {
  const [reptiles, setReptiles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feeding");
  const [thawList, setThawList] = useState<{name: string, count: number}[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: repData } = await db.from("reptiles").select("*").order("name");
      if (repData) setReptiles(repData);

      const { data: logData } = await db.from("activity_logs").select("*").order("activity_date", { ascending: false }).limit(400);
      if (logData) setLogs(logData);
      
      setLoading(false);
    }
    fetchData();
  }, [refreshKey]);

  // Build Task Queues
  const due: any[] = [];
  const upcoming: any[] = [];

  reptiles.forEach(r => {
    const rules = getHusbandryRules(r);
    const rLogs = logs.filter(l => l.reptile_id === r.id);
    
    // Check Feeding
    const fElapsed = daysAgo(rLogs.find(l => l.activity_type === 'Feeding')?.activity_date || r.last_fed);
    const fNote = rules.targetShort ? `Fed (${rules.targetShort})` : 'Standard feeding';

    if (fElapsed === null || fElapsed >= rules.feedDays) {
      due.push({ reptile: r, type: 'Feeding', icon: '🐁', isFeeding: true, title: `${r.name} — Feeding Due`, sub: `${fElapsed === null ? 'No log yet' : `Fed ${fElapsed}d ago (Target ${rules.feedDays}d • Win ${rules.windowLabel})`}${rules.targetShort ? ` • 🎯 ${rules.targetShort}` : ''}`, noteDefault: fNote, rules });
    } else if (fElapsed >= rules.minWin) {
      upcoming.push({ reptile: r, type: 'Feeding', icon: '🐁', isFeeding: true, title: `${r.name} — Feeding Window Open (${rules.windowLabel})`, sub: `Fed ${fElapsed}d ago • Target due in ${rules.feedDays - fElapsed}d${rules.targetShort ? ` • 🎯 ${rules.targetShort}` : ''}`, noteDefault: fNote, rules });
    }

    // Check Routine Chores
    if (r.routine_tasks_enabled !== false) {
      // Look for the most recent log of this type (ignoring quiet clears for this simplified port)
      const wElapsed = daysAgo(rLogs.find(l => l.activity_type === 'Water & Clean')?.activity_date);
      if (wElapsed === null || wElapsed >= rules.waterDays) {
        due.push({ reptile: r, type: 'Water & Clean', icon: '💧', isFeeding: false, title: `${r.name} — Fresh Water & Spot Clean`, sub: `${wElapsed === null ? 'Initial check' : `Last done ${wElapsed}d ago`} (Every ${rules.waterDays}d)`, noteDefault: 'Fresh water & clean completed' });
      }
      
      const mElapsed = daysAgo(rLogs.find(l => l.activity_type === 'Misting / Humidity')?.activity_date);
      if (mElapsed === null || mElapsed >= rules.mistDays) {
        due.push({ reptile: r, type: 'Misting / Humidity', icon: '🌫️', isFeeding: false, title: `${r.name} — Humidity Check`, sub: `${mElapsed === null ? 'Initial check' : `Last checked ${mElapsed}d ago`} (Every ${rules.mistDays}d)`, noteDefault: 'Humidity checked' });
      }
    }
  });

  const feedsDue = due.filter(t => t.isFeeding);
  const feedsUp = upcoming.filter(t => t.isFeeding);
  const choresDue = due.filter(t => !t.isFeeding);

  const generateThawList = () => {
    const feeders: Record<string, number> = {};
    [...feedsDue, ...feedsUp].filter(t => t.rules.isSnake).forEach(t => {
      let rawName = t.rules.fName || t.rules.targetShort || 'Custom / Unweighed';
      let cleanName = rawName;
      if (!t.rules.hasManualOverride && rawName.includes('(') && rawName.includes(')')) {
        cleanName = rawName.split('(')[1].split(')')[0].trim();
      }
      if (cleanName.includes('%') || cleanName.includes('Manual')) cleanName = 'Size Unknown (No Weight Logged)';
      feeders[cleanName] = (feeders[cleanName] || 0) + 1;
    });
    setThawList(Object.entries(feeders).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count));
  };

  const quickComplete = async (id: string, name: string, type: string, defaultNote: string) => {
    const { data: { user } } = await db.auth.getUser();
    const nowIso = new Date().toISOString();
    
    await db.from('activity_logs').insert([{ 
      reptile_id: id, reptile_name: name, activity_type: type, 
      logged_by: user?.email || "Unknown", activity_date: nowIso, 
      notes: defaultNote, owner_id: user?.id || null 
    }]);

    if (type === 'Feeding') {
      await db.from('reptiles').update({ last_fed: nowIso.slice(0, 10) }).eq('id', id);
    }
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <header className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-emerald-400 tracking-tight">ForeverReptiles</h1>
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
        </div>
        <div className="text-[11px] text-slate-400">Husbandry Dashboard</div>
      </header>

      {/* 2-Tab Main Navigation */}
      <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
        <Link href="/" className="py-2.5 rounded-xl text-xs font-extrabold text-slate-400 text-center hover:text-white transition">🐍 Collection</Link>
        <div className="py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-slate-950 flex items-center justify-center gap-1.5 transition">
          📋 Husbandry
          {due.length > 0 && <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-black">{due.length}</span>}
        </div>
      </div>

      {loading && <div className="text-center text-slate-500 text-sm py-10">Calculating schedules...</div>}

      {!loading && (
        <section className="space-y-4">
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            <button onClick={() => setActiveTab('feeding')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'feeding' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>🐁 Feeding</button>
            <button onClick={() => setActiveTab('chores')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'chores' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>💧 Chores</button>
            <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${activeTab === 'history' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'text-slate-400 hover:text-white border-transparent'}`}>📋 History</button>
          </div>

          {/* FEEDING TAB */}
          {activeTab === 'feeding' && (
            <div className="space-y-5 animate-in fade-in">
              <button onClick={generateThawList} className="w-full bg-slate-800 border border-amber-500/40 text-amber-300 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition shadow">
                <span className="text-base">🧊</span> Generate Thaw List (Snakes in Window)
              </button>
              
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">⚡ Due / Overdue</h2>
                <div className="space-y-2">
                  {feedsDue.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-center text-xs text-emerald-400 font-semibold">✓ Zero overdue feedings!</div>
                  ) : feedsDue.map(t => (
                    <TaskCard key={t.reptile.id + t.type} task={t} onComplete={() => quickComplete(t.reptile.id, t.reptile.name, t.type, t.noteDefault)} />
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400">🎯 Window Open</h2>
                  <span className="text-[10px] text-sky-400 font-semibold">{feedsUp.length} in window</span>
                </div>
                <div className="space-y-2">
                  {feedsUp.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-center text-xs text-slate-500">No snakes currently inside their safe feeding window.</div>
                  ) : feedsUp.map(t => (
                    <TaskCard key={t.reptile.id + t.type} task={t} isUpcoming onComplete={() => quickComplete(t.reptile.id, t.reptile.name, t.type, t.noteDefault)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHORES TAB */}
          {activeTab === 'chores' && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Routine Tasks</h2>
                <div className="space-y-2">
                  {choresDue.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-center text-xs text-emerald-400 font-semibold">✓ All enclosures hydrated & clean!</div>
                  ) : choresDue.map(t => (
                    <TaskCard key={t.reptile.id + t.type} task={t} onComplete={() => quickComplete(t.reptile.id, t.reptile.name, t.type, t.noteDefault)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-2 animate-in fade-in">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Platform Activity</h2>
              <div className="space-y-2">
                {logs.slice(0, 25).map(l => (
                  <div key={l.id} className="bg-slate-900/70 border border-slate-800/80 rounded-xl px-3 py-2 flex justify-between items-center text-xs hover:border-slate-700">
                    <div>
                      <Link href={`/animals/${l.reptile_id}`} className="font-bold text-emerald-400 hover:underline">{l.reptile_name}</Link> • {l.activity_type} 
                      <span className="text-slate-400 ml-1">
                        {l.value_numeric && <span className="text-emerald-300 font-bold">{l.value_numeric}g </span>}
                        {l.prey_weight_g && <span className="text-amber-300 font-bold">Prey: {l.prey_weight_g}g </span>}
                        {l.notes}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 shrink-0 ml-2">
                      {new Date(l.activity_date || l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Thaw List Modal */}
      {thawList && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div><h3 className="text-base font-bold text-amber-400">🧊 Prep & Thaw List</h3><p className="text-[11px] text-slate-400">Feeders needed for open windows.</p></div>
              <button onClick={() => setThawList(null)} className="text-slate-400 text-xl font-bold">&times;</button>
            </div>
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-sm space-y-2">
              {thawList.length === 0 ? <p className="text-slate-400">No snakes currently in a feeding window.</p> : 
                thawList.map(item => (
                  <div key={item.name} className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-amber-400 font-bold">{item.count}x</span>
                  </div>
                ))
              }
            </div>
            <button onClick={() => setThawList(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition">Close</button>
          </div>
        </div>
      )}
    </main>
  );
}

// Simple Task Card Component
function TaskCard({ task, isUpcoming = false, onComplete }: any) {
  const borderCls = isUpcoming ? 'border-sky-500/30 bg-slate-900/90' : 'border-slate-800 bg-slate-900';
  const btnCls = isUpcoming ? 'bg-sky-400 active:bg-sky-500 text-slate-950' : 'bg-emerald-500 active:bg-emerald-600 text-slate-950';
  
  return (
    <div className={`${borderCls} border rounded-2xl p-3 flex items-center justify-between gap-2`}>
      <Link href={`/animals/${task.reptile.id}`} className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition">
        <span className="text-lg shrink-0">{task.icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{task.title}</p>
          <p className="text-[11px] text-slate-400 truncate">{task.sub}</p>
        </div>
      </Link>
      <button onClick={onComplete} className={`${btnCls} text-xs font-extrabold px-3 py-2 rounded-xl shrink-0 transition`}>✓ Done</button>
    </div>
  );
}