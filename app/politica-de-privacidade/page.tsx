"use client";

import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FF7601] to-[#7a4a42] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl p-8 text-gray-800">
        <h1 className="text-3xl font-bold text-center mb-6 text-[#FF7601]">
          Política de Privacidade
        </h1>

        <p className="mb-4">
          Esta Política de Privacidade descreve como coletamos, utilizamos,
          armazenamos e protegemos os dados pessoais fornecidos pelos
          convidados(as) durante o processo de inscrição no evento.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Dados Coletados</h2>
        <p className="mb-4">
          Coletamos os seguintes dados pessoais por meio do formulário de
          inscrição:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Nome completo</li>
          <li>E-mail</li>
          <li>Telefone/WhatsApp</li>
          <li>CPF</li>
          <li>Empresa/Instituição</li>
          <li>Cargo</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Finalidade</h2>
        <p className="mb-4">
          Os dados coletados serão utilizados exclusivamente para:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Confirmação da inscrição no evento</li>
          <li>Comunicação sobre informações e atualizações do evento</li>
          <li>Controle de acesso e credenciamento</li>
          <li>Envio de materiais relacionados ao evento</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          3. Compartilhamento de Dados
        </h2>
        <p className="mb-4">
          Não compartilhamos seus dados com terceiros, exceto em casos
          estritamente necessários para a realização do evento ou quando exigido
          por lei.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">
          4. Armazenamento e Segurança
        </h2>
        <p className="mb-4">
          Seus dados serão armazenados em ambiente seguro, com medidas técnicas
          e organizacionais adequadas para prevenir acessos não autorizados,
          perda ou alteração indevida das informações.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Direitos do Titular</h2>
        <p className="mb-4">
          Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº
          13.709/2018)</strong>, você tem direito a:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Confirmar a existência de tratamento de dados</li>
          <li>Solicitar acesso, correção ou exclusão de seus dados</li>
          <li>Revogar o consentimento para uso dos dados</li>
          <li>Solicitar a portabilidade das informações</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Tempo de Retenção</h2>
        <p className="mb-4">
          Os dados pessoais serão mantidos apenas pelo tempo necessário para
          cumprir as finalidades descritas nesta política ou enquanto durar a
          obrigação legal aplicável.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">7. Alterações</h2>
        <p className="mb-4">
          Esta Política de Privacidade poderá ser atualizada periodicamente.
          Recomendamos que você consulte este documento antes de cada evento
          para estar ciente das condições vigentes.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">8. Contato</h2>
        <p className="mb-4">
          Caso tenha dúvidas ou solicitações relacionadas à privacidade e ao
          tratamento de seus dados pessoais, entre em contato pelo e-mail:{" "}
          <a
            href="mailto:contato@seudominio.com"
            className="text-[#FF7601] underline"
          >
            contato.ondetemevento@gmail.com
          </a>
        </p>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Última atualização: Outubro de 2025
        </p>
      </div>
    </main>
  );
}
