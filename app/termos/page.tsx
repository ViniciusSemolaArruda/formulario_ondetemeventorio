"use client";

import React from "react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FF7601] to-[#7a4a42] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl p-8 text-gray-800">
        <h1 className="text-3xl font-bold text-center mb-6 text-[#FF7601]">
          Termos de Uso
        </h1>

        <p className="mb-4">
          Bem-vindo(a)! Estes Termos de Uso regulamentam a participação de
          convidados(as) no evento. Ao preencher e enviar o formulário de
          inscrição, você declara estar ciente e de acordo com as condições
          abaixo.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Dados Pessoais</h2>
        <p className="mb-4">
          O fornecimento de informações corretas e atualizadas é de
          responsabilidade do convidado(a). Os dados solicitados (nome, e-mail,
          telefone, CPF, empresa e cargo) serão utilizados exclusivamente para
          fins relacionados à participação no evento, tais como confirmação de
          inscrição, comunicação de informações importantes e credenciamento na
          entrada.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Privacidade e LGPD</h2>
        <p className="mb-4">
          Tratamos seus dados pessoais com segurança e em conformidade com a{" "}
          <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>.
          Nenhuma informação será compartilhada com terceiros sem o seu
          consentimento expresso, salvo em casos exigidos por lei.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          3. Confirmação de Inscrição
        </h2>
        <p className="mb-4">
          Após o envio do formulário, o convidado(a) poderá receber um e-mail ou
          mensagem de confirmação. O ingresso ou acesso ao evento pode estar
          sujeito à validação dos dados fornecidos.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          4. Uso Indevido de Informações
        </h2>
        <p className="mb-4">
          É proibido fornecer informações falsas, incompletas ou de terceiros
          sem autorização. A organização se reserva o direito de cancelar a
          inscrição caso identifique irregularidades.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Direitos de Imagem</h2>
        <p className="mb-4">
          Ao participar do evento, o convidado(a) autoriza, de forma gratuita e
          por prazo indeterminado, o uso de sua imagem e voz em fotos, vídeos e
          materiais promocionais relacionados ao evento, salvo manifestação
          contrária expressa por escrito.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          6. Alterações e Cancelamento
        </h2>
        <p className="mb-4">
          A organização se reserva o direito de alterar datas, horários ou
          programação do evento, comunicando previamente os participantes. Em
          caso de cancelamento, os inscritos serão informados por e-mail ou
          telefone.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">7. Aceite dos Termos</h2>
        <p className="mb-4">
          Ao marcar a opção “Concordo com os Termos de Uso” no formulário de
          inscrição, o convidado(a) declara estar ciente e de acordo com todas
          as condições descritas neste documento.
        </p>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Em caso de dúvidas, entre em contato com a organização do evento pelo
          e-mail: <a href="mailto:contato.ondetemevento@gmail.com" className="text-[#FF7601] underline">contato@seudominio.com</a>
        </p>
      </div>
    </main>
  );
}
