import CrudPage from "./CrudPage";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

const STATUS = [
  { value: "new", label: "Новый", color: "#A0A5B5" },
  { value: "in_progress", label: "В работе", color: "#4F46E5" },
  { value: "production", label: "Производство", color: "#FF5722" },
  { value: "ready", label: "Готов", color: "#E1FF00" },
  { value: "shipped", label: "Отгружен", color: "#22c55e" },
  { value: "cancelled", label: "Отменён", color: "#ef4444" },
];

export default function Orders() {
  const { lang } = useI18n();
  const ru = lang === "ru";
  return (
    <CrudPage
      testIdPrefix="orders"
      endpoint="orders"
      titleKey="orders"
      eyebrow="Production schedule"
      fields={[
        { name: "title", label: ru ? "Название заказа" : "Order title", span: 2 },
        { name: "customer", label: ru ? "Клиент" : "Customer" },
        { name: "model", label: ru ? "Модель вентилятора" : "Fan model" },
        { name: "quantity", label: ru ? "Количество" : "Quantity", type: "number" },
        { name: "amount", label: ru ? "Сумма, ₽" : "Amount, ₽", type: "number" },
        { name: "deadline", label: ru ? "Срок" : "Deadline", type: "date" },
        { name: "status", label: ru ? "Статус" : "Status", type: "select", options: STATUS.map((s) => ({ value: s.value, label: s.label })) },
        { name: "notes", label: ru ? "Комментарии" : "Notes", type: "textarea", span: 2 },
      ]}
      columns={[
        { key: "title", label: ru ? "Заказ" : "Order", render: (it) => <div><div className="font-medium">{it.title}</div><div className="text-[11px] text-white/40">{it.customer} · {it.model}</div></div> },
        { key: "quantity", label: ru ? "Кол-во" : "Qty" },
        { key: "amount", label: ru ? "Сумма" : "Amount", format: (v) => v ? `${new Intl.NumberFormat("ru-RU").format(v)} ₽` : "—" },
        { key: "deadline", label: ru ? "Срок" : "Deadline", format: (v) => v ? new Date(v).toLocaleDateString("ru-RU") : "—" },
        { key: "status", label: ru ? "Статус" : "Status", render: (it) => {
          const s = STATUS.find((x) => x.value === it.status) || STATUS[0];
          return <Badge className="rounded-full border-0" style={{ backgroundColor: s.color + "33", color: s.color }}>{s.label}</Badge>;
        } },
      ]}
    />
  );
}
