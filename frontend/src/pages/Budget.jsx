import CrudPage from "./CrudPage";
import { useI18n } from "@/lib/i18n";

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n || 0));

export default function Budget() {
  const { lang } = useI18n();
  const ru = lang === "ru";
  return (
    <CrudPage
      testIdPrefix="budget"
      endpoint="budget"
      titleKey="budget"
      eyebrow="Finance"
      fields={[
        { name: "title", label: ru ? "Назначение" : "Description", span: 2 },
        { name: "type", label: ru ? "Тип" : "Type", type: "select", options: [
          { value: "income", label: ru ? "Доход" : "Income" },
          { value: "expense", label: ru ? "Расход" : "Expense" },
        ]},
        { name: "amount", label: ru ? "Сумма, ₽" : "Amount, ₽", type: "number" },
        { name: "date", label: ru ? "Дата" : "Date", type: "date" },
        { name: "category", label: ru ? "Категория" : "Category", placeholder: ru ? "материалы / зарплаты / услуги" : "materials / salary / services" },
        { name: "notes", label: ru ? "Комментарий" : "Notes", type: "textarea", span: 2 },
      ]}
      columns={[
        { key: "title", label: ru ? "Назначение" : "Description", render: (it) => <div><div className="font-medium">{it.title}</div><div className="text-[11px] text-white/40">{it.category}</div></div> },
        { key: "type", label: ru ? "Тип" : "Type", render: (it) => (
          <span className={it.type === "income" ? "text-emerald-400" : "text-red-400"}>
            {it.type === "income" ? (ru ? "Доход" : "Income") : (ru ? "Расход" : "Expense")}
          </span>
        )},
        { key: "amount", label: ru ? "Сумма" : "Amount", render: (it) => (
          <span className={`font-semibold mono ${it.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
            {it.type === "income" ? "+" : "−"}{fmt(it.amount)} ₽
          </span>
        )},
        { key: "date", label: ru ? "Дата" : "Date", format: (v) => v ? new Date(v).toLocaleDateString("ru-RU") : "—" },
      ]}
    />
  );
}
