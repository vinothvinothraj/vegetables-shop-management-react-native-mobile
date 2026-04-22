"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reports");
  }, [router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Redirecting to reports...
      </div>
    </div>
  );
}
