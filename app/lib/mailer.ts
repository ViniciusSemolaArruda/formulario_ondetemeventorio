//app\lib\mailer.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

type SendInviteParams = {
  to: string;
  name: string;
  passUrl: string;
  qrBase64Png: string; // somente o base64
};

export async function sendInviteEmail({ to, name, passUrl, qrBase64Png }: SendInviteParams) {
  const from = process.env.MAIL_FROM!;
  const subject = "Seu convite – Check-in com QR Code";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto">
    <h2>Olá, ${name}!</h2>
    <p>Seu cadastro foi confirmado. Apresente este QR Code na entrada para realizar o check-in.</p>
    <p><strong>Dica:</strong> Salve este e-mail ou baixe a imagem.</p>
    <p style="text-align:center">
      <img alt="Seu QR Code" style="width:260px;height:auto"
     src="${passUrl.replace('/pass', '/qr')}" />

    </p>
    <p>Se preferir, abra seu passe aqui:<br/>
      <a href="${passUrl}" target="_blank">${passUrl}</a>
    </p>
    <hr/>
    <p style="font-size:12px;color:#666">Se você não solicitou este convite, pode ignorar.</p>
  </div>`.trim();

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw error;
}
