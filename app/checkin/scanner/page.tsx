"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

type ScanStatus =
  | "idle"
  | "scanning"
  | "success"
  | "already"
  | "revoked"
  | "invalid"
  | "error";

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [lastMessage, setLastMessage] = useState<string>("");
  const [torchOn, setTorchOn] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [busy, setBusy] = useState(false);

  // pequeno beep
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880; // A5
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.value = 0.05;
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 120);
    } catch {}
  };

  const vibrate = (ms = 80) => {
    try { navigator.vibrate?.(ms); } catch {}
  };

  // Ativa/desativa lanterna se suportado
  async function toggleTorch(enable: boolean) {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.() ?? {}) as any;
      if (!("torch" in capabilities)) return;
      await track.applyConstraints({ advanced: [{ torch: enable }] });
      setTorchOn(enable);
    } catch {
      // ignora se não suportado
    }
  }

  // Inicia leitor
  useEffect(() => {
    const start = async () => {
      setStatus("scanning");

      const codeReader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 200, // ms
      });

      // Preferir câmera traseira
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const backCam =
        devices.find((d) => /back|traseira|rear|environment/i.test(d.label))?.deviceId ||
        devices[0]?.deviceId;

      if (!videoRef.current || !backCam) {
        setStatus("error");
        setLastMessage("Câmera não encontrada.");
        return;
      }

      const controls = await codeReader.decodeFromVideoDevice(
        backCam,
        videoRef.current,
        async (result, _err, _controls) => {
          // quando lê um QR válido (evita disparos múltiplos simultâneos)
          if (result && !busy) {
            const text = result.getText();
            // Suporta tanto URL completa (…/api/checkin?t=XYZ) quanto apenas o token
            let token = "";
            try {
              const u = new URL(text);
              token = u.searchParams.get("t") || "";
            } catch {
              token = text;
            }
            if (!token) {
              setStatus("invalid");
              setLastMessage("QR inválido: token ausente.");
              vibrate(120);
              return;
            }

            setBusy(true);
            await handleCheckin(token);
            setBusy(false);
          }
        }
      );

      controlsRef.current = controls;
    };

    start();

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
      // desligar lanterna ao sair
      toggleTorch(false).catch(() => {});
      // parar tracks
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheckin(token: string) {
    try {
      const res = await fetch(`/api/checkin?t=${encodeURIComponent(token)}`);
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        // mensagens específicas
        if (json?.message?.toLowerCase().includes("revog")) {
          setStatus("revoked");
          setLastMessage("Convite revogado.");
          vibrate(200);
          return;
        }
        setStatus("invalid");
        setLastMessage(json?.message || "QR inválido.");
        vibrate(160);
        return;
      }

      if (json.alreadyChecked) {
        setStatus("already");
        setLastMessage(`Já tinha check-in: ${json.fullName ?? ""}`);
        vibrate(80);
        beep();
      } else {
        setStatus("success");
        setLastMessage(`Check-in ok: ${json.fullName ?? ""}`);
        vibrate(80);
        beep();
      }

      // Após 2.5s, volta pro estado de leitura
      setTimeout(() => {
        setStatus("scanning");
        setLastMessage("");
      }, 2500);
    } catch {
      setStatus("error");
      setLastMessage("Erro de rede. Tente novamente.");
      vibrate(160);
    }
  }

  const statusStyles: Record<ScanStatus, string> = {
    idle: "bg-gray-200 text-gray-700 border-gray-300",
    scanning: "bg-blue-50 text-blue-900 border-blue-200",
    success: "bg-green-50 text-green-900 border-green-300",
    already: "bg-amber-50 text-amber-900 border-amber-300",
    revoked: "bg-red-50 text-red-900 border-red-300",
    invalid: "bg-rose-50 text-rose-900 border-rose-300",
    error: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center gap-4 p-4 bg-white">
      <h1 className="text-2xl font-bold">Leitor de Convites (QR)</h1>
      <p className="text-sm text-gray-600 text-center">
        Aponte a câmera para o QR do convidado. O sistema valida e marca o check-in automaticamente.
      </p>

      {/* Área do vídeo */}
      <div className="w-full max-w-md rounded-xl overflow-hidden border bg-black aspect-[3/4] relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />
        {/* Moldura de mira */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-56 h-56 border-2 border-white/80 rounded-lg"></div>
        </div>
      </div>

      {/* Status */}
      <div
        className={`w-full max-w-md rounded-lg border p-3 text-center ${statusStyles[status]}`}
      >
        {status === "scanning" && "Lendo… aponte para o QR"}
        {status === "success" && (lastMessage || "Check-in confirmado!")}
        {status === "already" && (lastMessage || "Convidado já tinha check-in.")}
        {status === "revoked" && (lastMessage || "Convite revogado.")}
        {status === "invalid" && (lastMessage || "QR inválido.")}
        {status === "error" && (lastMessage || "Erro ao ler/validar.")}
        {status === "idle" && "Pronto para começar."}
      </div>

      {/* Controles */}
      <div className="w-full max-w-md flex items-center gap-3">
        <button
          type="button"
          onClick={() => toggleTorch(!torchOn)}
          className="px-4 py-2 rounded-lg text-white font-medium shadow"
          style={{ backgroundColor: torchOn ? "#f59e0b" : "#111827" }}
        >
          {torchOn ? "Lanterna: ON" : "Lanterna: OFF"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStatus("scanning");
            setLastMessage("");
          }}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white font-medium shadow"
        >
          Reset
        </button>
      </div>

      {/* Entrada manual */}
      <div className="w-full max-w-md grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
        <input
          type="text"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          placeholder="Token do QR (ou URL completa)"
          className="w-full rounded-lg border px-3 py-2"
        />
        <button
          type="button"
          disabled={busy || !manualToken.trim()}
          onClick={async () => {
            // aceita URL com ?t=
            let t = manualToken.trim();
            try {
              const u = new URL(t);
              t = u.searchParams.get("t") || "";
            } catch {}
            if (!t) {
              setStatus("invalid");
              setLastMessage("Token ausente.");
              return;
            }
            setBusy(true);
            await handleCheckin(t);
            setBusy(false);
          }}
          className="px-4 py-2 rounded-lg bg-orange-600 text-white font-medium shadow disabled:opacity-60"
        >
          Validar manualmente
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Dica: adicione esta página à tela inicial para acesso rápido na portaria.
      </p>
    </main>
  );
}
