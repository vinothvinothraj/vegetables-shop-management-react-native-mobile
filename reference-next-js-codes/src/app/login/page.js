"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Leaf } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/app-context";
import { Button, Card, Input } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { STORAGE_KEYS, readStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { LANGS } from "@/lib/i18n";
const bgImage = "/main-bg.png";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, t, lang, setLang } = useApp();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("1234");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const session = readStorage(STORAGE_KEYS.userSession, null);
    if (session) {
      router.replace("/reports");
    }
  }, [router]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error(t("pleaseFillBothUsernameAndPassword"));
      return;
    }

    const result = signIn(username.trim(), password.trim());

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(t("loggedInSuccessfully"));
    router.replace("/reports");
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden px-0 pb-0 pt-0 text-slate-900 dark:text-slate-50 sm:px-4 sm:pt-48 lg:pt-56">
      <Image
        src={bgImage}
        alt=""
        fill
        priority
        className="absolute inset-0 -z-20 object-cover"
        style={{ objectPosition: "center center", transform: "translateY(-8rem)" }}
      />
      <div className="absolute inset-0 -z-10 bg-white/18 dark:bg-slate-950/48" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.08),transparent_42%)] dark:bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.28),transparent_42%)]" />

      <div className="relative flex flex-1 items-end justify-center px-0 pb-0 pt-0 sm:px-0 sm:pt-0">
        <div className="w-full sm:max-w-md">
          <Card className="space-y-6 rounded-t-xl rounded-b-none border-slate-200 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-900 sm:rounded-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-500/20">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-bold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">
                    {t("login")}
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
              {Object.entries(LANGS).map(([code, label]) => {
                const active = lang === code;

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={cn(
                      "rounded-xl px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition sm:text-sm",
                      active
                        ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium">{t("username")}</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">{t("password")}</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="1234"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                {t("signIn")}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <div className="w-full rounded-b-none border-t-2 border-emerald-600 bg-white px-4 py-3 text-center text-[11px] font-medium tracking-wide text-emerald-900 sm:text-xs dark:border-emerald-500 dark:bg-slate-950 dark:text-emerald-100">
        copy@2026 - All rights reserved
      </div>
    </div>
  );
}
