import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { PageHeader, Panel, StatCard, Empty } from "@/components/UI";
import { Wallet, Package, Sparkles, CalendarClock, TrendingUp, TrendingDown, Users2, AlertTriangle } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell
} from "recharts";

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n || 0));
const money = (n) => `${fmt(n)} ₽`;

export default function Dashboard() {
  const { t, lang } = useI18n();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((r) => setData(r.data)).catch(() => {});
  }, []);

  const k = data?.kpis || {};
  const timeline = (data?.budget_timeline || []).map((b) => ({
    date: (b.date || b.created_at || "").slice(5, 10),
    amount: b.type === "income" ? Number(b.amount || 0) : -Number(b.amount || 0),
    balance: Number(b.balance || 0),
  }));

  // Running balance
  let running = 0;
  const chartData = timeline.map((p) => ({ date: p.date, income: p.amount > 0 ? p.amount : 0, expense: p.amount < 0 ? Math.abs(p.amount) : 0, balance: (running += p.amount) }));

  const ordersByStatus = (data?.recent_orders || []).reduce((acc, o) => {
    const s = o.status || "new";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const orderBars = Object.entries(ordersByStatus).map(([status, count]) => ({ status, count }));

  return (
    <div className="pt-4">
      <PageHeader
        testId="dashboard-header"
        eyebrow={lang === "ru" ? "Обзор" : "Overview"}
        title={t("dashboard")}
        subtitle={lang === "ru" ? "Ключевые показатели производства промышленных вентиляторов" : "Key metrics of industrial fan production"}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard testId="kpi-balance" label={t("balance")} value={money(k.balance)} tone={k.balance >= 0 ? "green" : "red"} icon={Wallet} hint={`${t("income")}: ${money(k.income)}`} />
        <StatCard testId="kpi-stock" label={t("stock")} value={money(k.stock_value)} tone="yellow" icon={Package} hint={`${k.low_stock || 0} ${lang === "ru" ? "с низким остатком" : "low"}`} />
        <StatCard testId="kpi-orders" label={t("orders_active")} value={fmt(k.active_orders)} tone="orange" icon={CalendarClock} hint={`${lang === "ru" ? "Всего" : "Total"}: ${fmt(k.total_orders)}`} />
        <StatCard testId="kpi-leads" label={t("hot_leads")} value={fmt(k.hot_leads)} icon={Sparkles} hint={`${lang === "ru" ? "Всего" : "Total"}: ${fmt(k.total_leads)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Panel testId="dashboard-cashflow" className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="label-eyebrow">Cash flow</div>
              <h2 className="text-xl font-heading font-bold mt-1">{lang === "ru" ? "Движение средств" : "Cash flow timeline"}</h2>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {t("income")}</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400" /> {t("expense")}</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#FF5722]" /> {t("balance")}</span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5722" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FF5722" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#A0A5B5", fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fill: "#A0A5B5", fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#gInc)" strokeWidth={2} />
                <Area type="monotone" dataKey="balance" stroke="#FF5722" fill="url(#gBal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty text={lang === "ru" ? "Добавьте транзакции в раздел «Бюджет»" : "Add transactions in Budget section"} />}
        </Panel>

        <Panel testId="dashboard-orders-chart" className="lg:col-span-4">
          <div className="label-eyebrow">Orders</div>
          <h2 className="text-xl font-heading font-bold mt-1 mb-4">{lang === "ru" ? "Заказы по статусу" : "Orders by status"}</h2>
          {orderBars.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={orderBars}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="status" tick={{ fill: "#A0A5B5", fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fill: "#A0A5B5", fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {orderBars.map((_, i) => <Cell key={i} fill={["#FF5722", "#E1FF00", "#4F46E5", "#22c55e"][i % 4]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </Panel>

        <Panel testId="dashboard-recent-orders" className="lg:col-span-6">
          <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[#FF5722]" /> {lang === "ru" ? "Последние заказы" : "Recent orders"}</h2>
          {(data?.recent_orders || []).length > 0 ? (
            <div className="space-y-2">
              {data.recent_orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-white/5 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{o.title || o.name || o.model || "Order"}</div>
                    <div className="text-[11px] text-white/40 mono">{(o.deadline || o.created_at || "").slice(0, 10)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">{money(o.amount || o.total)}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{o.status || "new"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Panel>

        <Panel testId="dashboard-low-stock" className="lg:col-span-6">
          <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#E1FF00]" /> {t("low_stock")}</h2>
          {(data?.low_stock_items || []).length > 0 ? (
            <div className="space-y-2">
              {data.low_stock_items.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20">
                  <div><div className="text-sm font-medium">{m.name}</div><div className="text-[11px] text-white/40 mono">{m.sku}</div></div>
                  <div className="text-right"><div className="text-sm font-semibold text-[#E1FF00]">{fmt(m.quantity)} {m.unit || "шт"}</div><div className="text-[10px] text-white/40">мин: {fmt(m.min_stock)}</div></div>
                </div>
              ))}
            </div>
          ) : <Empty text={lang === "ru" ? "Все материалы в достаточном количестве" : "All materials sufficient"} />}
        </Panel>

        <Panel testId="dashboard-team" className="lg:col-span-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-2xl bg-black/20">
              <Users2 className="w-6 h-6 mx-auto text-[#FF5722] mb-2" />
              <div className="text-2xl font-heading font-bold">{fmt(k.employees)}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">{t("employees")}</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-black/20">
              <div className="w-6 h-6 mx-auto rounded bg-[#E1FF00]/20 grid place-items-center mb-2 text-[#E1FF00] font-bold text-xs">{k.departments}</div>
              <div className="text-2xl font-heading font-bold">{fmt(k.departments)}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">{t("departments")}</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-black/20">
              <TrendingUp className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
              <div className="text-2xl font-heading font-bold">{money(k.income)}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">{t("income")}</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-black/20">
              <TrendingDown className="w-6 h-6 mx-auto text-red-400 mb-2" />
              <div className="text-2xl font-heading font-bold">{money(k.expense)}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">{t("expense")}</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
