import CrudPage from "./CrudPage";
import { useI18n } from "@/lib/i18n";

export default function Suppliers() {
  const { lang } = useI18n();
  const ru = lang === "ru";
  return (
    <CrudPage
      testIdPrefix="suppliers"
      endpoint="suppliers"
      titleKey="suppliers"
      eyebrow="Procurement"
      fields={[
        { name: "name", label: ru ? "Поставщик" : "Supplier", span: 2 },
        { name: "category", label: ru ? "Категория" : "Category", placeholder: ru ? "металл, электроника, крепёж..." : "metal, electronics..." },
        { name: "contact_name", label: ru ? "Контактное лицо" : "Contact" },
        { name: "phone", label: ru ? "Телефон" : "Phone" },
        { name: "email", label: "Email" },
        { name: "delivery_days", label: ru ? "Срок поставки, дни" : "Lead time, days", type: "number" },
        { name: "rating", label: ru ? "Рейтинг 1-5" : "Rating 1-5", type: "number" },
        { name: "notes", label: ru ? "Условия" : "Terms", type: "textarea", span: 2 },
      ]}
      columns={[
        { key: "name", label: ru ? "Поставщик" : "Supplier", render: (it) => <div><div className="font-medium">{it.name}</div><div className="text-[11px] text-white/40">{it.category}</div></div> },
        { key: "contact_name", label: ru ? "Контакт" : "Contact" },
        { key: "phone", label: ru ? "Телефон" : "Phone" },
        { key: "delivery_days", label: ru ? "Срок" : "Lead", render: (it) => it.delivery_days ? `${it.delivery_days} ${ru ? "дн" : "d"}` : "—" },
        { key: "rating", label: ru ? "Рейтинг" : "Rating", render: (it) => {
          const r = Math.max(0, Math.min(5, Number(it.rating || 0)));
          return <span className="text-[#E1FF00]">{"★".repeat(r)}<span className="text-white/20">{"★".repeat(5 - r)}</span></span>;
        } },
      ]}
    />
  );
}
