import Link from "next/link";
import { Fish } from "lucide-react";
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="announcement">
        A little delivery. A whole lot of fin-flapping. ✦ Made for the small
        fry.
      </div>
      <header>
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Fish />
          </span>
          fin<span className="amp">&</span>feast.
        </Link>
        <Link href="/#menu">← Back to the menu</Link>
      </header>
      <main className="route-page">{children}</main>
    </>
  );
}
