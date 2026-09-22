import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Fan, Loader2 } from "lucide-react";

export default function Login() {
  const { login, user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav("/"); }, [user, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success(t("welcome"));
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Ошибка входа");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full grain ambient relative flex items-center justify-center px-6">
      {/* left panel image bg */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1582558006297-f996ed8adfec?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt=""
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-[#090A0F]/70" />
      </div>

      <div className="relative z-10 w-full max-w-md" data-testid="login-page">
        <div className="glass rounded-[2rem] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5722] grid place-items-center shadow-lg shadow-orange-500/30">
              <Fan className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-heading font-extrabold text-lg tracking-tight">FanOps</div>
              <div className="label-eyebrow">Industrial ERP</div>
            </div>
            <button
              onClick={() => setLang(lang === "ru" ? "en" : "ru")}
              data-testid="login-lang-toggle"
              className="ml-auto text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors"
            >
              {lang === "ru" ? "EN" : "RU"}
            </button>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight mb-2">
            {t("signIn")}
          </h1>
          <p className="text-white/50 text-sm mb-8">
            {lang === "ru"
              ? "Корпоративная платформа управления производством промышленных вентиляторов"
              : "Corporate management platform for industrial fan manufacturing"}
          </p>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-[0.2em] text-white/50">{t("username")}</Label>
              <Input
                id="username"
                data-testid="login-username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/30 border-white/10 h-11 rounded-xl focus-visible:ring-[#FF5722]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-[0.2em] text-white/50">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                data-testid="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/30 border-white/10 h-11 rounded-xl focus-visible:ring-[#FF5722]"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full h-11 rounded-full bg-[#FF5722] hover:bg-[#FF6E40] text-white font-semibold shadow-lg shadow-orange-500/20 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("login")}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-[11px] text-white/40 text-center mono">
            {lang === "ru" ? "Обратитесь к администратору для получения доступа" : "Contact administrator to get access"}
          </div>
        </div>
      </div>
    </div>
  );
}
