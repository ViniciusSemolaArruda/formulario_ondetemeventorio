// app/_components/Layout/Header.tsx
"use client";
import React from "react";

export default function Header() {
  return (
    <header className="border-b border-zinc-200/70 dark:border-zinc-800/70">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/next.svg"
            width={90}
            height={24}
            alt="Logo"
            className="dark:invert max-w-[90px] h-auto"
          />
          <span className="text-base sm:text-lg font-semibold tracking-tight">
            Cadastro — Jacarepaguá / RJ
          </span>
        </div>
        {/* espaço reservado para ícone/admin no futuro */}
      </div>
    </header>
  );
}
