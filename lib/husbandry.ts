export function daysAgo(dStr: string | Date | null): number | null {
  if (!dStr) return null;
  const now = new Date();
  const todayCal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let targetCal;
  if (typeof dStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dStr.trim())) {
    const [y, m, d] = dStr.trim().split('-').map(Number);
    targetCal = new Date(y, m - 1, d);
  } else {
    const parsed = new Date(dStr);
    if (isNaN(parsed.getTime())) return null;
    targetCal = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  return Math.max(0, Math.round((todayCal.getTime() - targetCal.getTime()) / 86400000));
}

export function getAgeMonths(bDate: string | null): number | null {
  if (!bDate) return null;
  const b = new Date(bDate + 'T00:00:00');
  const n = new Date();
  return Math.max(0, (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth()));
}

export function formatAge(bDate: string | null): string {
  const m = getAgeMonths(bDate);
  return m === null ? '' : (m < 12 ? `${m}mo` : `${(m / 12).toFixed(1).replace('.0', '')}yr`);
}

export function getCustomFeeders() {
  const def = [
    { n: 'Pinky Mouse', m: 3 }, { n: 'Fuzzy Mouse', m: 7 }, { n: 'Hopper Mouse', m: 12 }, { n: 'Small Mouse', m: 18 }, 
    { n: 'Adult Mouse', m: 25 }, { n: 'Large Mouse', m: 30 }, { n: 'Rat Pup / Weanling', m: 45 }, 
    { n: 'Small Rat', m: 80 }, { n: 'Medium Rat', m: 150 }, { n: 'Large Rat', m: 250 }, { n: 'Jumbo Rat', m: 9999 }
  ];
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(localStorage.getItem('fr_feeders') || '[]');
      if (saved && saved.length) return saved.sort((a: any, b: any) => a.m - b.m);
    } catch(e){}
  }
  return def.sort((a,b) => a.m - b.m);
}

export function getFeederName(avgG: number): string {
  const feeders = getCustomFeeders();
  for(let f of feeders) { if (avgG <= f.m) return f.n; }
  return feeders[feeders.length-1].n;
}

export function getHusbandryRules(r: any, speciesRules: any[] = [], userSpeciesPrefs: any[] = []) {
  const s = (r.species || '').toLowerCase(), m = getAgeMonths(r.birth_date), w = parseFloat(r.current_weight_g) || null;
  let matchedRule = speciesRules.find(rule => s.includes(rule.species_key.toLowerCase()) && (m === null || (m >= rule.min_age_months && m < rule.max_age_months)) && (w === null || (w >= rule.min_weight_g && w < rule.max_weight_g)));
  
  let stage = 'Standard', minP = 0.08, maxP = 0.10, feedDays = 10, minWin = 7, maxWin = 14, waterD = 3, mistD = 3, isSnake = true;
  let srcName = '', srcLink = '', dietGuide = '', tBasking = 88, tWarm = 84, tCool = 75, hMin = 50, hMax = 65, sub = 'Bioactive substrate', enc = '4x2x2 PVC';
  
  if (matchedRule) {
    stage = matchedRule.stage_name; minP = matchedRule.prey_min_pct; maxP = matchedRule.prey_max_pct;
    feedDays = matchedRule.target_days; minWin = matchedRule.window_min_days; maxWin = matchedRule.window_max_days;
    waterD = matchedRule.water_days; mistD = matchedRule.mist_days; isSnake = matchedRule.is_snake;
    srcName = matchedRule.source_name || ''; srcLink = matchedRule.source_link || ''; dietGuide = matchedRule.diet_guide || '';
    tBasking = matchedRule.temp_basking_f || tBasking; tWarm = matchedRule.temp_warm_f || tWarm; tCool = matchedRule.temp_cool_f || tCool; hMin = matchedRule.humidity_min || hMin; hMax = matchedRule.humidity_max || hMax; sub = matchedRule.recommended_substrate || sub; enc = matchedRule.recommended_enclosure || enc;
  } else if (s.includes('gecko') || s.includes('dragon') || s.includes('lizard')) { 
    isSnake = false; mistD = 2; feedDays = (m !== null && m < 8) ? 2 : 3; minWin = Math.max(1, feedDays - 1); maxWin = feedDays + 1; 
  }

  const useSmart = r.use_smart_guidelines === true;
  const uPref = userSpeciesPrefs.find(p => p.species_name === r.species);
  if (uPref) { if (uPref.target_days) feedDays = uPref.target_days; if (uPref.window_min_days) minWin = uPref.window_min_days; if (uPref.window_max_days) maxWin = uPref.window_max_days; }
  if (r.feed_interval_days) feedDays = r.feed_interval_days; if (r.custom_window_min) minWin = r.custom_window_min; if (r.custom_window_max) maxWin = r.custom_window_max;
  
  const windowLabel = `${minWin}–${maxWin}d`;
  let summary = ''; let minG = null, maxG = null, fName = '', targetShort = '';

  if (w && w > 0 && isSnake) {
    minG = Math.max(2, Math.round(w * minP)); maxG = Math.max(3, Math.round(w * maxP));
    fName = getFeederName((minG + maxG) / 2); 
  }

  const hasManualOverride = r.manual_feeder_override === true && Boolean(r.custom_feeder_size);
  if (hasManualOverride) fName = r.custom_feeder_size;

  if (hasManualOverride) {
    targetShort = `${r.custom_feeder_size}`;
    summary = `<strong>Manual Feeder Override:</strong> Target Prey <strong class="text-amber-400">${r.custom_feeder_size}</strong> • Window: <strong>${windowLabel}</strong> (Target ${feedDays}d)`;
  } else if (!isSnake) {
    targetShort = s.includes('leopard gecko') ? 'Insects' : (s.includes('crested gecko') ? 'CGD / Insects' : 'Insects / Greens');
    summary = `<strong>${r.species}:</strong> Feed every <strong>${windowLabel}</strong> (Target ${feedDays}d).<br><span class="text-sky-300">${dietGuide || 'Nutrient-rich insects & appropriate greens.'}</span>`;
  } else if (!useSmart) {
    targetShort = `Manual Interval`;
    summary = `<strong>Manual Interval:</strong> Feed every <strong>${windowLabel}</strong> (Target ${feedDays}d).`;
    if (fName) {
      targetShort = `${minG}-${maxG}g (${fName})`;
      summary += `<br><span class="text-amber-400 font-bold">Target Prey: ${minG}-${maxG}g (${fName})</span><br><i class="text-[10px] text-slate-500 mt-1 block">Note: Regardless of weight calculations, avoid feeding prey that is wider than the widest part of the snake.</i>`;
    }
  } else {
    if (fName) {
      targetShort = `${minG}–${maxG}g (${fName})`;
      summary = `<strong>${stage}:</strong> Prey <strong>${minG}–${maxG}g</strong> (${fName}) • Window: <strong>${windowLabel}</strong> (Target ${feedDays}d)<br><i class="text-[10px] text-slate-500 mt-1 block">Note: Regardless of weight calculations, avoid feeding prey that is wider than the widest part of the snake.</i>`;
    } else {
      targetShort = `${Math.round(minP * 100)}–${Math.round(maxP * 100)}% body wt`;
      summary = `<strong>${stage}:</strong> Prey <strong>${Math.round(minP * 100)}–${Math.round(maxP * 100)}% body wt</strong> • Window: <strong>${windowLabel}</strong> (Target ${feedDays}d)`;
    }
  }

  return { isSnake, useSmart, hasManualOverride, feedDays, minWin, maxWin, waterDays: waterD, mistDays: mistD, minG, maxG, fName, windowLabel, targetShort, summary, srcName, srcLink, tBasking, tWarm, tCool, hMin, hMax, sub, enc, dietGuide };
}