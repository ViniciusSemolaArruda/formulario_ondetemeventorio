import { Resend } from 'resend';

const resend = new Resend('re_WroS5LW6_AmvdRy2odYY7V7fm5pCeSuKg');

async function main() {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',      // pode deixar esse no teste
      to: 'contato.ondetemevento@gmail.com', // coloque seu e-mail real para ver chegar
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    });
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

main();
