import Link from "next/link";

export default function Header() {
    return (
        <header className="cabecera">
            <Link href={`/`}>
                <h1>
                    Data Driven Weather Forecast (Proof of Concept)
                </h1>
            </Link>
        </header>
    )
}
