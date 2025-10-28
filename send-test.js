import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "");


async function main() {
  try {
    const data = await resend.emails.send({
      from: 'Onde Tem Evento <nao-responda@convidado-ondetemevento.com.br>',  // ✅ seu domínio verificado
      to: 'contato.ondetemevento@gmail.com',  // teste de recebimento
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    });
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

main();
