import Image from "next/image";

export default function LoadingAthletePage() {
  return (
    <section className="page-state" role="status">
      <Image src="/brand/nextstep-logo.png" alt="" width={72} height={72} />
      <h1>Loading the next step…</h1>
      <p>Fetching the athlete’s private pathway.</p>
    </section>
  );
}
