"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, ArrowDownRight, ArrowUpRight, BrainCircuit, CircleHelp,
  History, ShieldCheck, Sparkles, Target, Trash2, Plane, RotateCcw
} from "lucide-react";
import { forecastNextRound, type ForecastResult } from "@/lib/forecast";

type LogItem = {
  id: string;
  predicted: number;
  target: number;
  actual: number | null;
  createdAt: string;
};

const initialValues = [1.21, 5.42, 1.08, 2.76, 8.27, 1.34, 3.93, 1.56, 6.62, 2.18];
const fmt = (v: number) => `${v.toFixed(2)}×`;

export default function Home() {
  const [multipliers, setMultipliers] = useState<number[]>(initialValues);
  const [target, setTarget] = useState("5");
  const [newValue, setNewValue] = useState("");
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [actualInputs, setActualInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const stats = useMemo(() => ({
    count: multipliers.length,
    average: multipliers.reduce((a, b) => a + b, 0) / Math.max(1, multipliers.length),
    highest: Math.max(1, ...multipliers),
    fiveX: multipliers.filter(v => v >= 5).length
  }), [multipliers]);

  const evaluated = logs.filter(x => x.actual !== null);
  const hits = evaluated.filter(x => x.actual! >= x.target).length;
  const hitRate = evaluated.length ? hits / evaluated.length * 100 : null;

  function addRound() {
    const v = Number(newValue);
    if (!newValue.trim() || !Number.isFinite(v) || v < 1) {
      setError("Enter a valid multiplier of at least 1.00×.");
      return;
    }
    setMultipliers(prev => [...prev, v].slice(-20));
    setNewValue("");
    setError("");
    setForecast(null);
  }

  function generate() {
    try {
      const result = forecastNextRound(multipliers, Number(target));
      setForecast(result);
      setLogs(prev => [{
        id: crypto.randomUUID(),
        predicted: result.targetMultiplier,
        target: Number(target),
        actual: null,
        createdAt: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 30));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not calculate estimate.");
    }
  }

  function recordActual(id: string) {
    const raw = actualInputs[id] ?? "";
    const actual = Number(raw);
    if (!raw.trim() || !Number.isFinite(actual) || actual < 1) {
      setError("Enter a valid actual multiplier of at least 1.00×.");
      return;
    }
    setLogs(prev => prev.map(item => item.id === id ? { ...item, actual } : item));
    setMultipliers(prev => [...prev, actual].slice(-20));
    setActualInputs(prev => ({ ...prev, [id]: "" }));
    setForecast(null);
    setError("");
  }

  const riskClass = {
    Low: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
    Medium: "text-amber-300 border-amber-400/30 bg-amber-400/10",
    High: "text-rose-300 border-rose-400/30 bg-rose-400/10"
  };

  return (
    <main className="min-h-screen bg-[#070914] text-slate-100">
      <header className="border-b border-white/10 bg-[#0b0e1b]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-500/10 p-3 text-rose-400"><Plane size={26} /></div>
            <div>
              <h1 className="text-lg font-black sm:text-2xl">Aviator <span className="text-indigo-400">Predictor Analytics</span></h1>
              <p className="text-xs text-slate-400 sm:text-sm">Experimental forecasting · Round verification workflow</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-emerald-300 sm:flex"><ShieldCheck size={18} /> Statistical transparency</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[1.55fr_1fr]">
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Rounds loaded", value: stats.count, Icon: History },
              { label: "Average", value: fmt(stats.average), Icon: Activity },
              { label: "Highest", value: fmt(stats.highest), Icon: ArrowUpRight },
              { label: "5×+ rounds", value: stats.fiveX, Icon: Target }
            ].map(s => <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <s.Icon size={18} className="mb-3 text-indigo-300" />
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="mt-1 text-xl font-bold">{s.value}</p>
            </div>)}
          </div>

          <section className="rounded-2xl border border-white/10 bg-[#0d1122] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-semibold">Live data input grid</h2><p className="mt-1 text-sm text-slate-400">Enter completed rounds, oldest to newest.</p></div>
              <span className="rounded-lg bg-indigo-400/10 px-3 py-2 text-xs text-indigo-200">Last 20 rounds</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {multipliers.map((value, i) => <div key={`${i}-${value}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3">
                <div><p className="text-[10px] text-slate-500">ROUND {i + 1}</p><p className={`mt-1 font-mono font-bold ${value >= 2 ? "text-indigo-300" : "text-slate-200"}`}>{fmt(value)}</p></div>
                <button aria-label={`Remove round ${i + 1}`} onClick={() => { setMultipliers(prev => prev.filter((_, j) => i !== j)); setForecast(null); }} className="text-slate-600 hover:text-rose-300"><Trash2 size={14} /></button>
              </div>)}
            </div>
            <div className="mt-4 flex gap-2">
              <input aria-label="Actual multiplier" type="number" min="1" step="0.01" value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={e => e.key === "Enter" && addRound()} placeholder="e.g. 1.72" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080b16] px-4 py-3 outline-none focus:border-indigo-400" />
              <button onClick={addRound} className="rounded-xl bg-indigo-500 px-4 py-3 font-semibold hover:bg-indigo-400">Add round</button>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-blue-500/[0.03] p-5">
            <div className="flex items-center gap-3"><BrainCircuit className="text-indigo-300" size={23} /><div><h2 className="text-lg font-semibold">Forecast engine</h2><p className="text-sm text-slate-400">Moving average + exponential baseline</p></div></div>
            <label htmlFor="target" className="mt-5 block text-sm text-slate-300">Target for model risk estimate</label>
            <select id="target" value={target} onChange={e => setTarget(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a0d1a] px-4 py-3">
              <option value="1.5">1.50×</option><option value="2">2.00×</option><option value="3">3.00×</option><option value="5">5.00×</option><option value="10">10.00×</option>
            </select>
            <button onClick={generate} disabled={multipliers.length < 5} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3 font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles size={18} /> Calculate estimate</button>
            {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0d1122] p-5">
            <div className="mb-4 flex items-center gap-2"><History size={19} className="text-indigo-300" /><h2 className="text-lg font-semibold">Prediction vs actual log</h2></div>
            {logs.length === 0 ? <p className="text-sm text-slate-400">Your forecasts appear here. Enter actual results after each round to evaluate target hit rate.</p> :
              <div className="space-y-3">{logs.map(item => <div key={item.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-xs text-slate-400">{item.createdAt}</span><span>Estimate: <strong className="text-indigo-300">{fmt(item.predicted)}</strong></span><span>Target: <strong>{fmt(item.target)}</strong></span></div>
                {item.actual === null ? <div className="mt-3 flex gap-2"><input type="number" min="1" step="0.01" value={actualInputs[item.id] ?? ""} onChange={e => setActualInputs(prev => ({ ...prev, [item.id]: e.target.value }))} placeholder="Actual result (e.g. 2.31)" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#080b16] px-3 py-2 text-sm" /><button onClick={() => recordActual(item.id)} className="rounded-lg border border-indigo-400/40 px-3 text-sm text-indigo-200 hover:bg-indigo-400/10">Record</button></div> :
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><span className="text-slate-300">Actual: {fmt(item.actual)}</span><span className={`rounded-full px-2 py-1 text-xs ${item.actual >= item.target ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>{item.actual >= item.target ? "Target reached" : "Target not reached"}</span></div>}
              </div>)}</div>}
          </section>
        </section>

        <aside className="space-y-5">
          <AnimatePresence mode="wait">
            {forecast ? <motion.section key={`${forecast.targetMultiplier}-${forecast.sampleSize}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/15 to-[#0c1020] p-6">
              <div className="flex items-center gap-2 text-sm text-indigo-200"><Target size={18} /> Experimental model estimate</div>
              <p className="mt-6 text-sm text-slate-400">Target estimate — not a guaranteed next result</p>
              <p className="mt-1 text-5xl font-black tracking-tight text-indigo-300 sm:text-6xl">{fmt(forecast.targetMultiplier)}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-slate-400">Data stability</p><p className="mt-1 text-2xl font-bold">{forecast.dataStabilityScore}%</p></div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-slate-400">Model risk</p><p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm ${riskClass[forecast.riskLevel]}`}>{forecast.riskLevel}</p></div>
              </div>
              <p className="mt-2 text-xs text-slate-500">{forecast.confidenceLabel}</p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-sm text-slate-300">Model-estimated chance of reaching {fmt(Number(target))}</p><p className="mt-1 text-3xl font-bold">{forecast.modelEstimatedProbability}%</p><p className="mt-2 text-xs leading-5 text-slate-500">Conditional on an unvalidated exponential model; not verified against the game's true distribution.</p></div>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <div className="flex justify-between gap-3"><span>Weighted moving average</span><strong>{fmt(forecast.movingAverage)}</strong></div>
                <div className="flex justify-between gap-3"><span>Distribution median baseline</span><strong>{fmt(forecast.distributionMedian)}</strong></div>
                <div className="flex justify-between gap-3"><span>Sample size</span><strong>{forecast.sampleSize} rounds</strong></div>
              </div>
              <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/80">{forecast.disclaimer}</p>
            </motion.section> : <section className="rounded-2xl border border-indigo-400/20 bg-[#0d1122] p-6"><div className="mb-4 inline-flex rounded-xl bg-indigo-400/10 p-3 text-indigo-300"><Target size={24} /></div><h2 className="text-xl font-bold">Next-round model output</h2><p className="mt-2 text-sm leading-6 text-slate-400">Calculate a numerical experimental estimate from your entered history. It is not a guaranteed prediction of the next round.</p><div className="mt-6 flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10"><span className="text-4xl font-black text-slate-700">—.——×</span></div><p className="mt-4 text-sm text-slate-400">Add at least five completed multipliers and click Calculate estimate.</p></section>}
          </AnimatePresence>

          <section className="rounded-2xl border border-white/10 bg-[#0d1122] p-5">
            <div className="flex items-center gap-2"><Activity size={18} className="text-indigo-300" /><h2 className="font-semibold">Target hit rate</h2></div>
            <p className="mt-4 text-sm text-slate-400">Historical evaluated forecasts</p><p className="mt-1 text-3xl font-bold">{hitRate === null ? "—" : `${hitRate.toFixed(1)}%`}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{evaluated.length ? `${hits} of ${evaluated.length} actual results reached their selected target.` : "No predictions evaluated yet."}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${hitRate ?? 0}%` }} /></div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0d1122] p-5">
            <div className="flex items-center gap-2"><CircleHelp size={18} className="text-sky-300" /><h2 className="font-semibold">Model limitations</h2></div>
            <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-400">
              <li className="flex gap-2"><ArrowDownRight size={16} className="shrink-0 text-sky-300" />A moving average describes history; it does not establish momentum in independent random rounds.</li>
              <li className="flex gap-2"><ArrowDownRight size={16} className="shrink-0 text-sky-300" />An exponential distribution is an assumption, not proof of the game's distribution.</li>
              <li className="flex gap-2"><ArrowDownRight size={16} className="shrink-0 text-sky-300" />The stability score is not a probability that a forecast is correct.</li>
              <li className="flex gap-2"><ArrowDownRight size={16} className="shrink-0 text-sky-300" />This demo uses in-memory state; refresh resets the session.</li>
            </ul>
          </section>
          <button onClick={() => { setMultipliers(initialValues); setLogs([]); setForecast(null); setError(""); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-400 hover:bg-white/5"><RotateCcw size={16} /> Reset demo data</button>
        </aside>
      </div>

      <footer className="mx-auto max-w-7xl px-5 pb-8 text-center text-xs leading-5 text-slate-500">For statistical education only. No algorithm can guarantee a crash multiplier. Never gamble money you cannot afford to lose.</footer>
    </main>
  );
}
