// app/guests/[id]/pass/page.tsx
import Image from "next/image";

export default function PassPage({ params }: { params: { id: string } }) {
  return (
    <main className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-xl font-semibold mb-4">Seu Passe</h1>
      <p className="text-sm mb-4">Mostre este QR no check-in.</p>
      <Image
        src={`/api/guests/${params.id}/qr`}
        alt="QR do convite"
        width={300}
        height={300}
        className="mx-auto rounded"
      />
    </main>
  );
}
