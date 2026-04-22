"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { STORAGE_KEYS, readStorage } from "@/lib/storage";

export function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = readStorage(STORAGE_KEYS.userSession, null);

    if (!session && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (session && pathname === "/login") {
      router.replace("/reports");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready && pathname !== "/login") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Checking session...
        </div>
      </div>
    );
  }

  return children;
}
