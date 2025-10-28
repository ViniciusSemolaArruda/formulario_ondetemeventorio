// app/checkin/scanner/page.tsx
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
  const [lastMessage, setLastMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // câmera / devices
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | "">("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // lanterna
  const [torchOn, setTorchOn] = useState(false);

  // entrada manual
  const [manualToken, setManualToken] = useState("");

  // --------------------------------------------------
  // utilidades
  const beep = () => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.value = 0.06;
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 120);
    } catch {}
  };
  const vibrate = (ms = 80) => {
    try {
      navigator.vibrate?.(ms);
    } catch {}
  };

  async function toggleTorch(enable: boolean) {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() ?? {}) as any;
      if (!("torch" in caps)) return;
      await (track as any).applyConstraints({ advanced: [{ torch: enable }] });
      setTorchOn(enable);
    } catch {
      // sem suporte: ignorar
    }
  }

  function stopCurrent() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    toggleTorch(false).catch(() => {});
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
  }

  // --------------------------------------------------
  // listagem de câmeras (pede permissão antes para liberar labels)
  async function requestPermissionAndList() {
    try {
      setStatus("scanning");
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setHasPermission(true);
      tmp.getTracks().forEach((t) => t.stop());
    } catch (err: any) {
      setHasPermission(false);
      if (err?.name === "NotAllowedError") {
        setStatus("error");
        setLastMessage("Permita o acesso à câmera e recarregue a página.");
        return;
      }
      if (err?.name === "NotFoundError") {
        setStatus("error");
        setLastMessage("Nenhuma câmera encontrada no dispositivo.");
        return;
      }
      // segue: pode haver devices mesmo sem stream concedida
    }

    const list = await BrowserQRCodeReader.listVideoInputDevices();
    setDevices(list);

    // escolher automaticamente a traseira (environment/back), senão a primeira
    const back =
      list.find((d) => /back|traseira|rear|environment/i.test(d.label))?.deviceId ??
      list[0]?.deviceId ??
      "";

    setSelectedId((prev) => prev || back);
    return back;
  }

  // --------------------------------------------------
  // inicia leitor com deviceId ou com fallback facingMode
  async function startReader(deviceId?: string) {
    stopCurrent();
    setStatus("scanning");
    setLastMessage("");

    try {
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 200,
      });

      const onResult = async (text: string, controls: IScannerControls) => {
        controlsRef.current = controls;
        if (!text || busy) return;
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
          vibrate(140);
          return;
        }
        setBusy(true);
        await handleCheckin(token);
        setBusy(false);
      };

      if (deviceId) {
        await reader.decodeFromVideoDevice(deviceId, videoRef.current!, async (res, _err, c) => {
          if (res) await onResult(res.getText(), c);
        });
      } else {
        // fallback por facingMode (quando deviceId não existe/funciona)
        await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          },
          videoRef.current!,
          async (res, _err, c) => {
            if (res) await onResult(res.getText(), c);
          }
        );
      }
    } catch (err: any) {
      setStatus("error");
      if (err?.name === "NotReadableError") {
        setLastMessage("A câmera está em uso por outro app. Feche-o e tente novamente.");
      } else {
        setLastMessage("Não foi possível iniciar a câmera.");
      }
    }
  }

  // --------------------------------------------------
  // ciclo de vida: pede permissão, lista e inicia
  useEffect(() => {
    let mounted = true;
    (async () => {
      const back = await requestPermissionAndList();
      if (!mounted) return;
      await startReader(back || undefined);
    })();

    return () => {
      mounted = false;
      stopCurrent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // trocar de câmera pelo seletor
  useEffect(() => {
    if (!selectedId) return;
    startReader(selectedId);
    setTorchOn(false); // reseta estado visual da lanterna após troca
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // --------------------------------------------------
  // chamada ao backend
  async function handleCheckin(token: string) {
    try {
      const res = await fetch(`/api/checkin?t=${encodeURIComponent(token)}`);
      const json = await res.json();

      if (!res.ok || !json?.ok) {
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

      {/* Seletor de câmera */}
      <div className="w-full max-w-md flex items-center gap-3">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 bg-white"
        >
          {devices.length === 0 && (
            <option value="">
              {hasPermission === false
                ? "Permita acesso à câmera nas permissões do navegador"
                : "Procurando câmeras..."}
            </option>
          )}
          {devices.map((d, i) => (
            <option key={d.deviceId || i} value={d.deviceId}>
              {d.label || (i === 0 ? "Câmera 1" : `Câmera ${i + 1}`)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={async () => {
            // re-lista e tenta manter a seleção anterior se ainda existir
            const prev = selectedId;
            await requestPermissionAndList();
            // se a anterior existir ainda, mantém
            const stillThere = devices.find((d) => d.deviceId === prev);
            setSelectedId(stillThere ? prev : (d => d?.deviceId ?? "")(devices[0]));
          }}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white font-medium shadow"
        >
          Atualizar
        </button>
      </div>

      {/* Área do vídeo */}
      <div className="w-full max-w-md rounded-xl overflow-hidden border bg-black aspect-[3/4] relative">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-56 h-56 border-2 border-white/80 rounded-lg" />
        </div>
      </div>

      {/* Status */}
      <div className={`w-full max-w-md rounded-lg border p-3 text-center ${statusStyles[status]}`}>
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

      <p className="text-xs text-gray-500 mt-4 text-center">
        Dica: toque no cadeado da barra de endereço &rarr; Permissões &rarr; Câmera = Permitir.
        Se a câmera não abrir, feche apps que a estejam usando (WhatsApp/Instagram) e recarregue.
      </p>
    </main>
  );
}
