"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = { className?: string; children: ReactNode };

// Envuelve una sección con `.reveal` y le añade `.in` la primera vez que entra
// en el viewport. Con `prefers-reduced-motion` se muestra de inmediato.
export function Reveal({ className = "", children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      el.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={`${className} reveal`.trim()}>
      {children}
    </section>
  );
}
