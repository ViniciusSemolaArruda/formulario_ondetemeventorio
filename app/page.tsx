"use client";

import React, { useMemo, useState } from "react";

const LOGO_URL = "/logo01.png";
const TERMS_URL = "/termos";
const PRIVACY_URL = "/politica-de-privacidade";

function onlyDigits(v: string) {
  return (v ?? "").replace(/\D/g, "");
}
function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidCPF(input: string) {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
}

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  company: string;
  jobTitle: string;
  acceptTerms: boolean;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  cpf: "",
  company: "",
  jobTitle: "",
  acceptTerms: false,
};

export default function Page() {
  const [values, setValues] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const phoneDigits = useMemo(() => onlyDigits(values.phone), [values.phone]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!values.fullName || values.fullName.trim().length < 3) {
      e.fullName = "Informe o nome completo";
    }
    if (!isEmail(values.email)) {
      e.email = "E-mail inválido";
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      e.phone = "Informe um telefone válido";
    }
    if (!isValidCPF(values.cpf)) {
      e.cpf = "CPF inválido (use 11 dígitos, ex.: 123.456.789-09)";
    }
    if (!values.company.trim()) {
      e.company = "Informe a empresa";
    }
    if (!values.jobTitle.trim()) {
      e.jobTitle = "Informe o cargo";
    }
    if (!values.acceptTerms) {
      e.acceptTerms =
        "Você deve aceitar os termos e a política de privacidade para continuar.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerMsg(null);
    setSuccess(false);
    setAlreadyRegistered(false);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: phoneDigits,
        documentNumber: onlyDigits(values.cpf),
        company: values.company,
        jobTitle: values.jobTitle,
      } as const;

      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json?.ok) {
        if (json?.alreadyRegistered) {
          // Caso: usuário já estava cadastrado
          setAlreadyRegistered(true);
          setServerMsg(
            json?.message ||
              "Você já está cadastrado e fará parte do nosso evento."
          );
          // Não abre overlay nem limpa o formulário
        } else {
          // Caso: novo cadastro criado
          setSuccess(true);
          setServerMsg(json?.message || "Inscrição enviada com sucesso! ✔");
          setValues(initialState);
          setErrors({});
        }
      } else {
        setServerMsg(json?.message || "Não foi possível enviar.");
      }
    } catch {
      setServerMsg("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="
        relative min-h-screen flex items-center justify-center
        bg-white md:bg-[#FF7601] md:p-10
      "
    >
      {/* Overlay de sucesso */}
      {success && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSuccess(false)}
          />
          <div className="relative z-10 max-w-md w-full rounded-2xl border-2 bg-white text-green-700 shadow-2xl p-6 text-center">
            <h2 className="text-xl font-bold">Inscrição enviada com sucesso! 🎉</h2>
            <p className="mt-2 text-green-800">
              Obrigado por se inscrever. Em breve entraremos em contato com as
              próximas etapas.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium text-white"
              style={{ backgroundColor: "#22c55e" }}
            >
              Ok, entendi
            </button>
          </div>
        </div>
      )}

      <div
        className="
          relative z-10 w-full max-w-2xl
          min-h-screen md:min-h-0
          flex flex-col items-center
          border-2 shadow-2xl bg-white md:rounded-xl
        "
        style={{ borderColor: "#FF7601" }}
      >
        {/* Título */}
        <div className="w-full text-center py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Cadastro de Convidado(a)
          </h1>
          <p className="mt-1 text-gray-600 text-sm">
            Você é o nosso convidado(a) especial, preencha seus dados abaixo.
          </p>
        </div>

        {/* Marca d’água (fica dentro do card) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="w-[90%] h-[90%] bg-center bg-no-repeat bg-contain opacity-10"
            style={{ backgroundImage: `url(${LOGO_URL})` }}
            aria-hidden
          />
        </div>

        <form
          onSubmit={onSubmit}
          className="relative z-10 p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-black"
        >
          {/* Nome completo */}
          <div className="md:col-span-2">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-black"
            >
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              required
              type="text"
              value={values.fullName}
              onChange={(e) =>
                setValues((s) => ({ ...s, fullName: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7601]/40"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black"
            >
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              required
              type="email"
              value={values.email}
              onChange={(e) =>
                setValues((s) => ({ ...s, email: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7601]/40"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-black"
            >
              Telefone / WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              required
              type="tel"
              inputMode="numeric"
              value={values.phone}
              onChange={(e) =>
                setValues((s) => ({ ...s, phone: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7601]/40"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* CPF */}
          <div className="md:col-span-2">
            <label
              htmlFor="cpf"
              className="block text-sm font-medium text-black"
            >
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              id="cpf"
              required
              type="text"
              value={values.cpf}
              onChange={(e) =>
                setValues((s) => ({ ...s, cpf: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7601]/40"
            />
            {errors.cpf && (
              <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>
            )}
          </div>

          {/* Empresa */}
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-black"
            >
              Empresa / Instituição <span className="text-red-500">*</span>
            </label>
            <input
              id="company"
              required
              type="text"
              value={values.company}
              onChange={(e) =>
                setValues((s) => ({ ...s, company: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7601]/40"
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-500">{errors.company}</p>
            )}
          </div>

          {/* Cargo */}
          <div>
            <label
              htmlFor="jobTitle"
              className="block text-sm font-medium text-black"
            >
              Cargo <span className="text-red-500">*</span>
            </label>
            <input
              id="jobTitle"
              required
              type="text"
              value={values.jobTitle}
              onChange={(e) =>
                setValues((s) => ({ ...s, jobTitle: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7601]/40"
            />
            {errors.jobTitle && (
              <p className="mt-1 text-sm text-red-500">{errors.jobTitle}</p>
            )}
          </div>

          {/* Aceite dos termos */}
          <div className="md:col-span-2 flex items-center gap-2 mt-2">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={values.acceptTerms}
              onChange={(e) =>
                setValues((s) => ({ ...s, acceptTerms: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="acceptTerms" className="text-sm text-black">
              Concordo com os{" "}
              <a
                href={TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-orange-500"
              >
                Termos de Uso
              </a>{" "}
              e com a{" "}
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-orange-500"
              >
                Política de Privacidade
              </a>
              <span className="text-red-500">*</span>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="md:col-span-2 text-sm text-red-500">
              {errors.acceptTerms}
            </p>
          )}

          {/* Botão */}
          <div className="md:col-span-2 mt-2 flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-medium text-white shadow-md transition focus:outline-none focus:ring-2"
              style={{ backgroundColor: "#FF7601", minWidth: "200px" }}
            >
              {submitting ? "Enviando..." : "Confirmar inscrição"}
            </button>
          </div>

          {serverMsg && (
            <div
              className={[
                "md:col-span-2 mt-3 rounded-lg border p-3 text-sm",
                alreadyRegistered
                  ? "bg-orange-50 border-orange-300 text-orange-800"
                  : success
                  ? "bg-green-50 border-green-300 text-green-800"
                  : "bg-gray-100 border-gray-300 text-black",
              ].join(" ")}
            >
              {serverMsg}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
