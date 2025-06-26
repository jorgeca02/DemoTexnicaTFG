import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      <main>
        <div className="grid">
          <Link href="/simulador">
            <div className="card">
              Simulador Histórico
            </div>
          </Link>

          <Link href="/datos-reales">
            <div className="card">
              Datos a Tiempo Real
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
