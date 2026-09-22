import CrudPage from "./CrudPage";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

const STATUS = [
  { value: "new", label: "Новый", color: "#A0A5B5" },
  { value: "hot", label: "Горячий", color: "#FF5722" },
  { value: "negotiation", label: "Переговоры", color: "#E1FF00" },
  { value: "won", label: "Закрыт (успех)", color: "#22c55e" },
  { value: "lost", label: "Отказ", color: "#ef4444" },
];

export default function Leads() {
  const { lang } = useI18n();
  const ru = lang === "ru";
  return (
    <CrudPage
      testIdPrefix="leads"
      endpoint="leads"
      titleKey="leads"
      eyebrow="CRM"
      fields={[
        { name: "company", label: ru ? "Компания" : "Company", span: 2 },
        { name: "contact_name", label: ru ? "Контактное лицо" : "Contact" },
        { name: "phone", label: ru ? "Телефон" : "Phone" },
        { name: "email", label: "Email" },
        { name: "amount", label: ru ? "Сумма, ₽" : "Amount, ₽", type: "number" },
        { name: "status", label: ru ? "Статус" : "Status", type: "select", options: STATUS.map((s) => ({ value: s.value, label: s.label })) },
        { name: "source", label: ru ? "Источник" : "Source", placeholder: "сайт / выставка / рекомендация" },
        { name: "notes", label: ru ? "Заметки" : "Notes", type: "textarea", span: 2 },
      ]}
      columns={[
        { key: "company", label: ru ? "Компания" : "Company", render: (it) => <div><div className="font-medium">{it.company}</div><div className="text-[11px] text-white/40">{it.contact_name}</div></div> },
        { key: "phone", label: ru ? "Контакты" : "Contacts", render: (it) => <div className="mono text-[11px]"><div>{it.phone}</div><div className="text-white/40">{it.email}</div></div> },
        { key: "amount", label: ru ? "Сумма" : "Amount", format: (v) => v ? `${new Intl.NumberFormat("ru-RU").format(v)} ₽` : "—" },
        { key: "status", label: ru ? "Статус" : "Status", render: (it) => {
          const s = STATUS.find((x) => x.value === it.status) || STATUS[0];
          return <Badge className="rounded-full text-white border-0" style={{ backgroundColor: s.color + "33", color: s.color }}>{s.label}</Badge>;
        } },
        { key: "source", label: ru ? "Источник" : "Source" },
      ]}
    />
  );
}
