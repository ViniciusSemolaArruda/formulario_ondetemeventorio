// app/_components/Layout/Footer.tsx
"use client";
import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200/70 dark:border-zinc-800/70">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-5 text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
        © {new Date().getFullYear()} — Capadócia Produções
      </div>
    </footer>
  );
}
