import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-(--line) px-8 py-5 text-center font-(family-name:--mono) text-[11px] tracking-[0.16em] text-(--ink-faint)">
      <span>© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0</span>
      <Link
        href="/about"
        className="uppercase transition-colors hover:text-(--cyan)"
      >
        Acerca de
      </Link>
    </footer>
  );
}
