# SPEC 01 — MVP visual de Arcade Vault (5 pantallas)

> **Status:** Implementado
> **Depends on:** —
> **Date:** 2026-11-07
> **Objective:** Portar a Next.js (App Router) las 5 pantallas de `references/templates` (biblioteca, detalle, reproductor, auth y salón de la fama) como maqueta visual navegable con datos mock, sin implementar ningún juego.

---

## Por qué existe este spec

Los templates de `references/templates` son un prototipo en React con scripts de navegador (`React` global, `window.X`, navegación por hash JSON). Hay que llevarlos a la base real del proyecto (Next 16, App Router, TypeScript, Tailwind v4) con URLs reales, para que las siguientes specs (juegos, puntuaciones reales, backend) tengan dónde enchufarse.

El `app/globals.css` ya contiene los estilos del template migrados (clases `.av-nav`, `.card`, `.btn`, `.crt`, `.podium`, etc.) y `app/layout.tsx` ya carga las fuentes y los fondos `av-bg` / `av-noise`. Este spec **reutiliza** ese CSS y no lo reescribe.

---

## Scope

**In:**

- Rutas App Router: `/` (biblioteca), `/juegos/[id]` (detalle), `/juegos/[id]/jugar` (reproductor), `/auth`, `/salon`.
- Navbar (con menú móvil), footer y contador de créditos decorativo, compartidos desde `app/layout.tsx`.
- Biblioteca: hero, búsqueda por nombre, chips de categoría, grilla de tarjetas con efecto tilt, estado vacío "NO HAY RESULTADOS".
- Detalle: portada, etiquetas, descripción, franja de estadísticas, botones de acción y tabla "MEJORES PUNTUACIONES" (10 filas).
- Reproductor simulado: HUD (jugador, puntuación, vidas, nivel), arena CRT decorativa, botones PAUSA/REANUDAR, FIN y SALIR, overlay de pausa y modal de fin de juego con guardado de puntuación. El puntaje sube solo con un intervalo, igual que en el template.
- Auth falsa: pestañas "Iniciar sesión" / "Crear cuenta", "Jugar como invitado", botones Google/GitHub sin acción.
- Salón de la fama: pestañas por juego, podio top 3, tabla de 12 filas y fila "tu mejor marca" cuando hay sesión.
- Mock de sesión en `localStorage` (clave `av_user`) y de puntuaciones guardadas en `localStorage` (clave `av_scores`).
- Datos mock tipados: los 8 juegos de `data.jsx` y el generador determinista `seededScores`.
- Diseño responsive tal como define el CSS existente (menú hamburguesa, podio apilado, detalle a una columna).
- Estilos nuevos que hagan falta: con utilidades de Tailwind. El CSS global solo se toca para corregir diferencias detectadas con el template.

**Out of scope (para futuras specs):**

- Implementar cualquiera de los 8 juegos. La arena del reproductor es decorativa.
- Backend, base de datos o API de puntuaciones reales.
- Autenticación real (contraseñas, OAuth Google/GitHub, sesiones en servidor, validación de formularios).
- Que el Salón de la Fama y el detalle lean las puntuaciones guardadas en `av_scores` (se guardan pero no se muestran en las tablas).
- Sistema real de créditos (el "CRÉDITOS · 03" es decorativo).
- Reescribir el CSS global a Tailwind.
- Tests automatizados (no hay runner configurado).
- SEO por juego (metadata dinámica) y Open Graph.

---

## Data model

Esta feature introduce estos tipos, definidos en `lib/`:

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;            // slug, ej. "bloque-buster" (es el [id] de la ruta)
  title: string;         // ej. "BLOQUE BUSTER"
  short: string;         // descripción corta de la tarjeta
  long: string;          // descripción larga del detalle
  cat: GameCategory;
  cover: string;         // clase CSS existente: "cover-bricks", "cover-tetro", ...
  color: GameColor;      // define el color del botón JUGAR de la tarjeta
  best: number;          // mejor puntuación global (mock)
  plays: string;         // ej. "12.4K" (mock, texto)
};

export const GAMES: Game[];                       // los 8 juegos de data.jsx
export const CATS: ["TODOS", ...GameCategory[]];

// lib/scores.ts
export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date: "DD/MM/2026"
export function seededScores(seed: number, count?: number): ScoreRow[];  // misma lógica que data.jsx

// lib/session.ts (cliente)
export type User = { name: string };              // máx. 10 caracteres, en mayúsculas
export type SavedScore = { game: string; score: number; name: string; at: number };
// localStorage "av_user"   -> User | null
// localStorage "av_scores" -> SavedScore[]
```

Convenciones:

- Números con `toLocaleString("es-ES")`.
- Semillas de `seededScores`: detalle `id.length * 17 + 3` (10 filas); salón `id.length * 23 + 7` (12 filas). Se conservan para que las tablas coincidan con el template.
- `id` de juego inválido en una ruta responde 404 con `notFound()`.

---

## Implementation plan

1. Crear `lib/games.ts` y `lib/scores.ts` con los tipos y datos mock portados de `data.jsx`. Verificación: `npm run lint` y `npx tsc --noEmit` pasan.
2. Crear `lib/session.ts` y `components/session-provider.tsx` (Client Component con contexto: `user`, `login`, `signOut`, `saveScore`). Lee `localStorage` después del montaje para evitar errores de hidratación. Envolver `children` en `app/layout.tsx`. Verificación: la app sigue cargando sin errores.
3. Crear `components/nav.tsx` (con menú móvil) y `components/footer.tsx`, y montarlos en `app/layout.tsx`. El `<div className="av-main">` ya existente envuelve `children`. Verificación: se ve la barra con logo, enlaces, créditos y botón "Iniciar Sesión"; el enlace activo se marca con `usePathname()`; el hamburguesa abre el panel a ≤840px.
4. Crear `components/game-card.tsx` y reemplazar `app/page.tsx` con la biblioteca (hero, buscador y chips en un Client Component `components/library.tsx`). Verificación: filtrar por texto y categoría funciona; sin coincidencias aparece "NO HAY RESULTADOS".
5. Crear `app/juegos/[id]/page.tsx` (detalle) con `generateStaticParams` y `notFound()`. Navegación desde la tarjeta y desde el botón JUGAR. Verificación: `/juegos/caida` muestra la ficha y la tabla de 10 filas; `/juegos/xyz` da 404.
6. Crear `app/auth/page.tsx` con el formulario en un Client Component `components/auth-form.tsx`. Verificación: entrar con usuario guarda `av_user`, redirige a `/` y el nav muestra el nombre; "Jugar como invitado" redirige sin sesión.
7. Crear `app/juegos/[id]/jugar/page.tsx` con el reproductor simulado en `components/game-player.tsx`. Verificación: el puntaje sube; PAUSA detiene el intervalo; FIN abre el modal; guardar escribe en `av_scores`; JUGAR DE NUEVO reinicia.
8. Crear `app/salon/page.tsx` con `components/hall-of-fame.tsx` (pestañas, podio, tabla, fila del usuario). Verificación: cambiar de pestaña cambia las filas; con sesión aparece "TU MEJOR MARCA".
9. Ajustes finales de paridad visual con `references/templates/Arcade Vault.html` en desktop y móvil, corrigiendo en `app/globals.css` o con Tailwind solo lo que difiera. Verificación: `npm run lint` y `npm run build` pasan.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores y `npm run lint` no reporta errores.
- [ ] Existen las rutas `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth` y `/salon`, y cada una renderiza sin errores en la consola del navegador (incluidos errores de hidratación).
- [ ] `/` muestra 8 tarjetas; escribir "caí" deja solo CAÍDA; elegir el chip SHOOTER deja INVASORES y ROCAS.
- [ ] Una búsqueda sin coincidencias muestra el texto "NO HAY RESULTADOS".
- [ ] Hacer clic en una tarjeta (o en JUGAR) navega a `/juegos/<id>`.
- [ ] `/juegos/<id>` muestra título, categoría, descripción, estadísticas y 10 filas de puntuaciones, con las 3 primeras en dorado, plata y bronce.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` devuelven la página 404.
- [ ] "JUGAR AHORA" navega a `/juegos/<id>/jugar` y "VOLVER AL VAULT" a `/`.
- [ ] En el reproductor la puntuación aumenta sola; PAUSA la detiene y muestra "EN PAUSA"; REANUDAR la continúa.
- [ ] FIN abre el modal "FIN DEL JUEGO" con la puntuación final; GUARDAR PUNTUACIÓN añade una entrada a `localStorage["av_scores"]` y muestra "PUNTUACIÓN GUARDADA".
- [ ] El campo de iniciales del modal convierte a mayúsculas y limita a 10 caracteres.
- [ ] JUGAR DE NUEVO reinicia puntuación, vidas y nivel; SALIR vuelve al detalle del juego.
- [ ] En `/auth`, enviar el formulario guarda `localStorage["av_user"]` con el usuario en mayúsculas (máx. 10) y redirige a `/`; sin usuario escrito se usa "PLAYER1".
- [ ] En `/auth`, la pestaña "Crear cuenta" muestra el campo de correo y "Iniciar sesión" lo oculta.
- [ ] "Jugar como invitado" redirige a `/` sin crear `av_user`.
- [ ] Recargar la página con sesión iniciada mantiene el nombre en la barra; hacer clic en el nombre cierra la sesión y borra `av_user`.
- [ ] `/salon` muestra podio y tabla de 12 filas; cambiar de pestaña de juego cambia el podio y la tabla.
- [ ] En `/salon` la fila "TU MEJOR MARCA" aparece solo con sesión iniciada.
- [ ] El enlace activo del nav se resalta: "Biblioteca" en `/`, `/juegos/*`; "Salón de la Fama" en `/salon`.
- [ ] A 390 px de ancho no hay scroll horizontal, el hamburguesa abre y cierra el panel y el podio se apila en una columna.
- [ ] Abrir cualquier página con `av_user` corrupto en `localStorage` no rompe la aplicación (se trata como sin sesión).

---

## Decisions

- **Sí:** rutas reales del App Router en lugar de la navegación por hash del template. URLs compartibles y aprovecha Next; el hash JSON era una limitación del prototipo.
- **No:** SPA de una sola página cliente. Desaprovecha Server Components y complicaría las specs futuras.
- **Sí:** slugs en español para las rutas (`/juegos`, `/jugar`, `/salon`), coherentes con el producto y con el `id` de los datos.
- **Sí:** reutilizar el CSS ya migrado en `app/globals.css`; los estilos nuevos van con utilidades de Tailwind. Máxima fidelidad con el diseño sin repetir trabajo.
- **No:** reescribir las ~970 líneas de CSS a Tailwind. Mucho trabajo, riesgo de divergir del diseño y ningún beneficio para el MVP.
- **Sí:** sesión y puntuaciones falsas en `localStorage` (`av_user`, `av_scores`), igual que el template. Permite probar el flujo completo sin backend.
- **No:** mostrar `av_scores` en las tablas. Se guardan solo para que el flujo sea realista; leerlas pertenece a la spec de puntuaciones reales.
- **Sí:** mantener el reproductor con puntaje simulado. Valida el flujo HUD → fin de juego → guardar, que es lo que consumirán los juegos reales.
- **No:** pantalla "Próximamente" en el reproductor. Pierde el flujo de puntuación que queremos maquetar.
- **Sí:** nav y footer en `app/layout.tsx`; solo lo interactivo es Client Component (`nav`, `library`, `auth-form`, `game-player`, `hall-of-fame`, `session-provider`). Las páginas de detalle quedan como Server Components.
- **Sí:** la pestaña activa del salón es estado local, no parte de la URL. Simplicidad; compartir una pestaña concreta se puede añadir luego.
- **Sí:** tipado con TypeScript y `LayoutProps` / `PageProps` globales de Next, como ya hace `app/layout.tsx`.

---

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| `cacheComponents` cambia la semántica de renderizado y exige `generateStaticParams` / `Suspense` en rutas dinámicas | Leer `node_modules/next/dist/docs/` antes de crear `[id]`; definir `generateStaticParams` con los ids de `GAMES`. |
| Errores de hidratación al leer `localStorage` | `SessionProvider` lee el storage tras el montaje (efecto) y arranca con `user = null`; el nav tolera el parpadeo inicial. |
| `localStorage` bloqueado o con JSON corrupto | Envolver lecturas y escrituras en `try/catch` y tratar el fallo como sin sesión. |
| `params` es asíncrono en Next 16 y puede diferir del conocimiento previo | Consultar la guía de rutas dinámicas en `node_modules/next/dist/docs/01-app` antes de implementar. |
| El `setInterval` del reproductor sigue activo al salir de la página | Limpiar el intervalo en el `return` del `useEffect`. |

---

## What is **not** in this spec

- Ningún juego jugable (el reproductor es una maqueta).
- Backend, API, base de datos o autenticación real.
- Mostrar puntuaciones guardadas en el salón o el detalle.
- Sistema real de créditos.
- Reescritura del CSS a Tailwind.
- Tests automatizados y SEO por juego.

Cada uno de esos puntos, si se hace, va en su propia spec.
