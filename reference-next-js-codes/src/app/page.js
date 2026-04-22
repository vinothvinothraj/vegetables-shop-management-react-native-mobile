"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS, readStorage } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const session = readStorage(STORAGE_KEYS.userSession, null);
    router.replace(session ? "/reports" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading vegetable shop...
      </div>
    </div>
  );
}
