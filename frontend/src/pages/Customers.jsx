import CrudPage from "./CrudPage";
import { useI18n } from "@/lib/i18n";

export default function Customers() {
  const { lang } = useI18n();
  const ru = lang === "ru";
  return (
    <CrudPage
      testIdPrefix="customers"
      endpoint="customers"
      titleKey="customers"
      eyebrow="CRM"
      fields={[
        { name: "name", label: ru ? "Название компании" : "Company name", span: 2 },
        { name: "inn", label: "ИНН / TAX ID" },
        { name: "contact_name", label: ru ? "Контактное лицо" : "Contact" },
        { name: "phone", label: ru ? "Телефон" : "Phone" },
        { name: "email", label: "Email" },
        { name: "address", label: ru ? "Адрес" : "Address", span: 2 },
        { name: "notes", label: ru ? "Заметки" : "Notes", type: "textarea", span: 2 },
      ]}
      columns={[
        { key: "name", label: ru ? "Компания" : "Company", render: (it) => <div><div className="font-medium">{it.name}</div><div className="text-[11px] text-white/40 mono">ИНН {it.inn || "—"}</div></div> },
        { key: "contact_name", label: ru ? "Контакт" : "Contact" },
        { key: "phone", label: ru ? "Телефон" : "Phone" },
        { key: "email", label: "Email" },
        { key: "address", label: ru ? "Адрес" : "Address" },
      ]}
    />
  );
}
