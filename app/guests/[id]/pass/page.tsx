// app/guests/[id]/pass/page.tsx
import Image from "next/image";

export default async function PassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-xl font-semibold mb-4">Seu Passe</h1>
      <p className="text-sm mb-4">Mostre este QR no check-in.</p>
      <Image
        src={`/api/guests/${id}/qr`}
        alt="QR do convite"
        width={300}
        height={300}
        className="mx-auto rounded"
      />
    </main>
  );
}
