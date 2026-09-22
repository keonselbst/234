import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/UI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Copy, ShieldCheck } from "lucide-react";

export default function Profile() {
  const { t, lang, setLang } = useI18n();
  const { user, refresh } = useAuth();
  const ru = lang === "ru";
  const [form, setForm] = useState({});
  const [pw, setPw] = useState({ old_password: "", new_password: "" });
  const [departments, setDepartments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (user) setForm(user); }, [user]);
  useEffect(() => { api.get("/departments").then((r) => setDepartments(r.data)); }, []);

  const save = async () => {
    try { await api.put("/auth/profile", form); await refresh(); toast.success(ru ? "Сохранено" : "Saved"); }
    catch (e) { toast.error(e.response?.data?.detail || "Ошибка"); }
  };
  const changePw = async () => {
    if (!pw.old_password || !pw.new_password) return toast.error(ru ? "Заполните оба поля" : "Fill both fields");
    try { await api.post("/auth/change-password", pw); setPw({ old_password: "", new_password: "" }); toast.success(ru ? "Пароль обновлён" : "Password changed"); }
    catch (e) { toast.error(e.response?.data?.detail || "Ошибка"); }
  };
  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm({ ...form, avatar_url: r.data.data_url });
      await api.put("/auth/profile", { avatar_url: r.data.data_url });
      await refresh();
      toast.success(ru ? "Аватар обновлён" : "Avatar updated");
    } catch (err) { toast.error(err.response?.data?.detail || "Ошибка"); }
    setUploading(false);
  };

  if (!user) return null;

  return (
    <div className="pt-4">
      <PageHeader
        testId="profile-header"
        eyebrow="Account"
        title={t("profile")}
        subtitle={ru ? "Личные данные, пропуск и настройки" : "Personal info, access card and settings"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-1 text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="w-28 h-28 ring-2 ring-white/10 mx-auto">
              <AvatarImage src={form.avatar_url} />
              <AvatarFallback className="bg-black/40 text-white font-heading text-2xl">{(user.full_name || user.username || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#FF5722] grid place-items-center cursor-pointer hover:bg-[#FF6E40] transition-colors shadow-lg">
              <Upload className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" data-testid="profile-avatar-input" />
            </label>
          </div>
          <h3 className="font-heading font-bold text-xl">{user.full_name || user.username}</h3>
          <div className="text-white/50 text-sm">{user.position || "—"}</div>
          <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-[#FF5722]/15 text-[#FF5722] text-[10px] uppercase tracking-[0.2em]">{user.role}</div>

          <div className="mt-6 p-4 rounded-2xl bg-black/30 border border-white/5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-[#E1FF00]" />
              <div className="label-eyebrow">{t("access_uid")}</div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="mono text-lg text-[#E1FF00]">{user.access_uid}</div>
              <button onClick={() => { navigator.clipboard.writeText(user.access_uid); toast.success("UID"); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[10px] text-white/40 mt-2">{ru ? "Для карты доступа" : "For access card"}</div>
          </div>
        </Panel>

        <Panel className="lg:col-span-2 space-y-4">
          <div className="font-heading font-bold text-lg">{ru ? "Личные данные" : "Personal info"}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("full_name")}</Label>
              <Input data-testid="profile-fullname" value={form.full_name || ""} onChange={(e) => setForm({...form, full_name: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.15em] text-white/50">Email</Label>
              <Input value={form.email || ""} onChange={(e) => setForm({...form, email: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("phone")}</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({...form, phone: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("position")}</Label>
              <Input value={form.position || ""} onChange={(e) => setForm({...form, position: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("department")}</Label>
              <Select value={form.department_id || ""} onValueChange={(v) => setForm({...form, department_id: v})}>
                <SelectTrigger className="bg-black/30 border-white/10 rounded-xl"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("language")}</Label>
              <Select value={form.language || lang} onValueChange={(v) => { setForm({...form, language: v}); setLang(v); }}>
                <SelectTrigger className="bg-black/30 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-strong border-white/10">
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={save} data-testid="profile-save-btn" className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40] px-6">{t("save")}</Button>

          <div className="border-t border-white/5 pt-6 mt-6">
            <div className="font-heading font-bold text-lg mb-4">{t("change_password")}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("old_password")}</Label>
                <Input type="password" value={pw.old_password} onChange={(e) => setPw({...pw, old_password: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" data-testid="profile-old-pw" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("new_password")}</Label>
                <Input type="password" value={pw.new_password} onChange={(e) => setPw({...pw, new_password: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" data-testid="profile-new-pw" />
              </div>
            </div>
            <Button onClick={changePw} data-testid="profile-changepw-btn" className="mt-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10">{t("change_password")}</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
