# SPEC 02 — Home como landing page y biblioteca en `/games`

> **Status:** Draft
> **Depends on:** SPEC 01
> **Date:** 2026-11-07
> **Objective:** Portar a Next.js el home de `references/templates/home-about` como landing page en `/`, y mover la biblioteca actual a `/games`.

---

## Por qué existe este spec

Hoy `/` muestra la biblioteca (SPEC 01). El template `references/templates/home-about/home.jsx` define un landing con hero, propuesta de valor, vista previa de juegos, estadísticas, actividad, precios y CTA final. Para que ese landing sea la portada hay que liberar `/`, reubicar la biblioteca y actualizar todos los enlaces que apuntaban a ella.

Los estilos del home **no están** en `app/globals.css` (SPEC 01 solo migró las 5 pantallas). Viven en `references/templates/home-about/styles.css` y hay que copiarlos.

---

## Scope

**In:**

- Nueva ruta `/` con el landing, en el mismo orden que `home.jsx`: hero, "¿POR QUÉ ARCADE VAULT?" (// 01), "JUEGOS DISPONIBLES AHORA" (// 02), franja de estadísticas, "ACTIVIDAD EN VIVO" (// 03), "PRECIOS" (// 04) y CTA final.
- Silhouettes pixel flotantes del hero (8 SVG decorativos) e iconos pixel de las 4 tarjetas de características.
- Animación de aparición al hacer scroll (`.reveal` → `.in`) con `IntersectionObserver`.
- Vista previa con los 6 primeros juegos de `GAMES` (`GAMES.slice(0, 6)`) y tarjetas mini enlazadas a `/juegos/<id>`.
- Mover la biblioteca de `/` a `/games` (sin cambiar su contenido).
- Nav (escritorio y panel móvil): añadir "Inicio" → `/`; "Biblioteca" pasa a apuntar a `/games`. El enlace activo se recalcula.
- Actualizar enlaces que apuntaban a la biblioteca en `/` (ver plan, paso 3).
- Copiar a `app/globals.css` los estilos del home desde `styles.css` del template (bloques `HOME PAGE`, `ACTIVITY` y `PRICING`).
- Contenido mock tipado en `lib/home.ts` (características, estadísticas, últimas puntuaciones, top jugadores, preguntas frecuentes, ítems del plan).
- CTAs: "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS" e "INSERTAR MONEDA" → `/games`; "CREAR CUENTA" y "EMPEZAR GRATIS" → `/auth`; "VER SALÓN" → `/salon`.

**Out of scope (para futuras specs):**

- Página "Acerca de" (`about.jsx`) y su enlace en el nav.
- Leer `av_scores` o cualquier dato real en "Últimas puntuaciones", "Top jugadores" o estadísticas.
- Backend, API de puntuaciones o contadores reales de partidas/jugadores.
- Mover `/juegos/[id]` y `/juegos/[id]/jugar` a `/games/[id]` (se quedan donde están).
- Variantes de tema (bloque `Theme variants` del template) y estilos `GAMEPAD`.
- Reescribir el CSS del home a Tailwind.
- SEO específico del landing (Open Graph, metadata dinámica).
- Tests automatizados.

---

## Data model

Esta feature no cambia los tipos de SPEC 01. Añade solo datos mock estáticos, tipados:

```ts
// lib/home.ts
import type { GameColor } from "@/lib/games";

export type Feature = { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; color: GameColor };
export type Stat = { n: string; unit: string; sub: string };           // ej. { n: "12+", unit: "JUEGOS", sub: "Y CONTANDO" }
export type RecentScore = { player: string; game: string; score: number; ago: string; color: GameColor };
export type TopPlayer = { rank: number; player: string; score: number };
export type Faq = { q: string; a: string };

export const FEATURES: Feature[];        // 4 ítems
export const STATS: Stat[];              // 3 ítems
export const RECENT_SCORES: RecentScore[]; // 7 ítems
export const TOP_PLAYERS: TopPlayer[];   // 5 ítems
export const FAQS: Faq[];                // 3 ítems
export const PLAN_FEATURES: string[];    // 6 ítems de la lista de precios
```

Convenciones:

- Textos y valores idénticos a `home.jsx`; los nombres de juego de `RECENT_SCORES` son texto libre (no tienen que existir en `GAMES`, como en el template).
- Puntuaciones con `toLocaleString("es-ES")`.
- La barra de cada fila de Top jugadores mide `100 - índice * 16` %.

---

## Implementation plan

1. Copiar a `app/globals.css` los estilos del home desde `references/templates/home-about/styles.css` (bloques `HOME PAGE`, `ACTIVITY` y `PRICING`), sin duplicar reglas ya presentes. Verificación: `npm run dev` arranca y las pantallas existentes no cambian de aspecto.
2. Mover la biblioteca: crear `app/games/page.tsx` que renderice `<Library />` y dejar `app/page.tsx` con un placeholder. Verificación: `/games` muestra las 8 tarjetas.
3. Actualizar enlaces a la biblioteca: `components/nav.tsx` (logo sigue en `/`; "Biblioteca" → `/games`; añadir "Inicio" en escritorio y panel móvil; `isHome = pathname === "/"`, `isLibrary = pathname.startsWith("/games") || pathname.startsWith("/juegos")`), `components/hall-of-fame.tsx:100` y `components/game-player.tsx:128` (→ `/games`). `components/auth-form.tsx` sigue redirigiendo a `/`. Verificación: desde el detalle, el enlace activo es "Biblioteca"; "VOLVER AL VAULT" lleva a `/games`.
4. Crear `lib/home.ts` con los tipos y datos mock. Verificación: `npx tsc --noEmit` pasa.
5. Crear `components/home/` con piezas sin interactividad (Server Components): `silhouettes.tsx`, `feature-icon.tsx`, `mini-card.tsx`. Verificación: `npm run lint` pasa.
6. Crear `components/home/reveal.tsx` (Client Component que envuelve secciones con `.reveal` y añade `.in` con `IntersectionObserver`, `threshold: 0.12`, desconectando al desmontar; respeta `prefers-reduced-motion` mostrando todo visible). Verificación: al hacer scroll las secciones aparecen una vez y no se vuelven a ocultar.
7. Construir `app/page.tsx` con el hero y las secciones 01 y 02 usando los componentes anteriores. Verificación: hero con título de 3 líneas, 8 siluetas y CTAs; 4 tarjetas de características; 6 mini-tarjetas enlazadas.
8. Añadir al landing las secciones estadísticas, actividad (03), precios (04) y CTA final. Verificación: las 7 filas del ticker, 5 filas del top y los 3 bloques de preguntas frecuentes se muestran.
9. Ajustes de paridad visual con `references/templates/home-about/arcade-vault-standalone.html` en escritorio y móvil. Verificación: `npm run lint` y `npm run build` pasan.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores y `npm run lint` no reporta errores.
- [ ] `/` renderiza el landing sin errores en la consola (incluida hidratación); `/games` renderiza la biblioteca de SPEC 01 con 8 tarjetas.
- [ ] El hero muestra "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA" y los botones "EXPLORAR JUEGOS" y "CREAR CUENTA".
- [ ] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/games`.
- [ ] "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`.
- [ ] "VER SALÓN →" navega a `/salon`.
- [ ] La sección "¿POR QUÉ ARCADE VAULT?" muestra 4 tarjetas con icono pixel, y la de vista previa muestra exactamente 6 mini-tarjetas.
- [ ] Hacer clic en una mini-tarjeta navega a `/juegos/<id>` del juego correspondiente.
- [ ] La franja de estadísticas muestra "12+", "MILES" y "GLOBAL".
- [ ] "ÚLTIMAS PUNTUACIONES" muestra 7 filas y "TOP JUGADORES · HOY" muestra 5, con las 3 primeras destacadas (`top1`, `top2`, `top3`).
- [ ] La sección de precios muestra "$0 / SIEMPRE", 6 ítems en la lista y 3 preguntas frecuentes.
- [ ] Las secciones con `.reveal` reciben la clase `in` al entrar en el viewport.
- [ ] El nav muestra "Inicio", "Biblioteca" y "Salón de la Fama" en escritorio y en el panel móvil; "Inicio" está activo solo en `/`; "Biblioteca" está activo en `/games` y `/juegos/*`.
- [ ] En `/games`, el chip y el buscador siguen filtrando como en SPEC 01.
- [ ] En el reproductor, el botón de salida del fin de juego y el botón "VOLVER AL VAULT" del salón llevan a `/games`.
- [ ] Tras enviar `/auth` o pulsar "Jugar como invitado" se redirige a `/`.
- [ ] A 390 px de ancho no hay scroll horizontal en `/`.
- [ ] Las siluetas del hero tienen `aria-hidden="true"` y no reciben foco.

---

## Decisions

- **Sí:** biblioteca en `/games` y landing en `/`. Decisión del usuario: la portada debe ser el landing.
- **No:** `/biblioteca` (nombre de ruta del template) ni `/inicio` para el home. El usuario eligió `/games`.
- **Sí:** el detalle y el reproductor se quedan en `/juegos/[id]` y `/juegos/[id]/jugar`. Moverlos obliga a tocar `proxy.ts`, `generateStaticParams` y enlaces; va en otra spec. Queda una mezcla temporal de `/games` (inglés) con `/juegos` (español).
- **Sí:** nav con "Inicio", "Biblioteca" y "Salón de la Fama"; sin "Acerca de" hasta que exista la página.
- **Sí:** tras `/auth` se redirige al home (`/`), como en el template.
- **Sí:** datos mock en `lib/home.ts`, separados de la UI. Se sustituyen cuando exista la spec de puntuaciones reales.
- **No:** leer `av_scores` en el landing. Mantiene la decisión de SPEC 01.
- **Sí:** copiar el CSS del home a `app/globals.css` tal cual, igual que en SPEC 01. Fidelidad máxima con el diseño.
- **No:** reescribirlo a Tailwind.
- **Sí:** el landing es Server Component; solo el efecto `reveal` es Client Component. Evita enviar JS innecesario.
- **Sí:** respetar `prefers-reduced-motion` en `.reveal`. Pequeño añadido sobre el template por accesibilidad.
- **No:** `useReveal` global con `document.querySelectorAll` como en el template. Se encapsula en un componente.

---

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Enlaces olvidados que siguen apuntando a `/` esperando la biblioteca | Paso 3 enumera archivos; `grep` de `href="/"` y `router.push` antes de cerrar el paso. |
| `.reveal` oculta contenido si el JS falla o tarda | Estado oculto solo cuando exista la clase de JS activo, o fallback visible con `prefers-reduced-motion`. |
| Choques de nombres de clases CSS con las existentes en `globals.css` | Copiar solo los bloques del home y comprobar duplicados antes de pegar. |
| `cacheComponents` exige cuidado con APIs de petición/fechas en Server Components | El landing no usa `Date`, `cookies` ni `headers`; los tiempos "hace X min" son texto fijo. |
| Mezcla de rutas `/games` y `/juegos` genera inconsistencia | Registrada en Decisions; migración en spec futura. |

---

## What is **not** in this spec

- Página "Acerca de".
- Datos reales de puntuaciones, jugadores o partidas.
- Mover `/juegos/[id]` a `/games/[id]`.
- Temas alternativos y estilos de gamepad.
- Reescritura del CSS a Tailwind, SEO y tests automatizados.

Cada uno de esos puntos, si se hace, va en su propia spec.
