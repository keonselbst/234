import CrudPage from "./CrudPage";
import { useI18n } from "@/lib/i18n";

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n || 0));

export default function Materials() {
  const { lang } = useI18n();
  const ru = lang === "ru";
  return (
    <CrudPage
      testIdPrefix="materials"
      endpoint="materials"
      titleKey="materials"
      eyebrow="Stock"
      fields={[
        { name: "name", label: ru ? "Название" : "Name", span: 2 },
        { name: "sku", label: "SKU / Артикул" },
        { name: "unit", label: ru ? "Ед. изм." : "Unit", placeholder: "шт / м / кг" },
        { name: "quantity", label: ru ? "Количество" : "Quantity", type: "number" },
        { name: "min_stock", label: ru ? "Минимум" : "Min stock", type: "number" },
        { name: "price", label: ru ? "Цена, ₽" : "Price, ₽", type: "number" },
        { name: "location", label: ru ? "Место хранения" : "Location" },
      ]}
      columns={[
        { key: "name", label: ru ? "Название" : "Name", render: (it) => <div><div className="font-medium">{it.name}</div><div className="text-[11px] text-white/40 mono">{it.sku}</div></div> },
        { key: "quantity", label: ru ? "Кол-во" : "Qty", render: (it) => {
          const low = Number(it.quantity || 0) < Number(it.min_stock || 0);
          return <span className={low ? "text-[#E1FF00] font-semibold" : ""}>{fmt(it.quantity)} {it.unit || ""}</span>;
        } },
        { key: "min_stock", label: ru ? "Мин." : "Min", format: fmt },
        { key: "price", label: ru ? "Цена" : "Price", format: (v) => `${fmt(v)} ₽` },
        { key: "location", label: ru ? "Локация" : "Location" },
      ]}
    />
  );
}
