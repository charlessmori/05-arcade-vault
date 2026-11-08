# SPEC 03 — Página "Acerca de" con formulario de contacto vía Resend

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-07
> **Objective:** Portar a Next.js `references/templates/home-about/about.jsx` como página `/about` y hacer que su formulario de contacto envíe el mensaje por correo con Resend mediante una Server Action.

---

## Por qué existe este spec

SPEC 02 dejó "Acerca de" fuera de alcance. El template define dos bloques en `about.jsx`: la misión con tres destacados y un formulario de contacto. En el template el envío es simulado (`setSent(form.name)`), sin red. Aquí el envío pasa a ser real: el mensaje llega por correo al equipo mediante Resend.

Los estilos de la página **no están** en `app/globals.css`. Viven en el bloque `ABOUT PAGE` de `references/templates/home-about/styles.css` (líneas ~1071-1149) y hay que copiarlos.

---

## Scope

**In:**

- Nueva ruta `/about` con el mismo orden y textos que `about.jsx`: hero "ACERCA DE ARCADE VAULT" con misión y 3 destacados (corazón, navegador, planta), divisor de píxeles y sección "CONTÁCTANOS" con 3 avisos (`tip-led`) y formulario.
- Iconos pixel `HEART`, `BROWSER` y `PLANT` como Server Component (`components/about/highlight-icon.tsx`).
- Animación `.reveal` del divisor y de la sección de contacto reutilizando `components/home/reveal.tsx`.
- Formulario con campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE, botón "▶  ENVIAR MENSAJE", animación `shake` en error y terminal de éxito "VAULT-OS // TERMINAL" con botón "ENVIAR OTRO MENSAJE".
- Server Action `sendContactMessage` en `app/about/actions.ts` que valida en el servidor y envía el correo con el SDK `resend`.
- Estados del botón: normal y "ENVIANDO…" deshabilitado mientras la acción está pendiente.
- Mensaje de error visible si falta un campo, el correo es inválido, se excede una longitud o Resend falla.
- Configuración por variables de entorno: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (valor de desarrollo `onboarding@resend.dev`), con `.env.example` documentado.
- Copiar a `app/globals.css` el bloque `ABOUT PAGE` de `styles.css` sin duplicar reglas existentes (`.reveal`, `.fade-in`, `.field`, `.btn.xl`, `blink`, `.neon-yellow` ya existen).
- Metadata de la página (`title: "Acerca de · Arcade Vault"`).
- Enlace "Acerca de" → `/about` en el nav (escritorio y panel móvil, después de "Salón de la Fama") con estado activo `pathname.startsWith("/about")`, y en el footer (`components/footer.tsx`, enlace junto al texto de copyright).

**Out of scope (para futuras specs):**

- Validación del honeypot, captcha o rate limiting.
- Correo de confirmación al visitante y dominio propio verificado en Resend.
- Guardar los mensajes en base de datos o histórico.
- Plantilla HTML del correo (se envía texto plano).
- Internacionalización.
- Tests automatizados.
- Variantes de tema y estilos `GAMEPAD` del template.

---

## Data model

Sin persistencia. Tipos nuevos solo para el contrato de la acción:

```ts
// lib/contact.ts
export const CONTACT_LIMITS = { name: 80, email: 254, message: 2000 } as const;

export type ContactField = "name" | "email" | "message";

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string; fields?: ContactField[] };
```

Variables de entorno (solo servidor, sin prefijo `NEXT_PUBLIC_`):

```
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=correo-del-dueño-de-la-cuenta@dominio.com
CONTACT_FROM_EMAIL=onboarding@resend.dev
```

Convenciones:

- La acción recibe `FormData` con los campos `name`, `email` y `message`, recortados con `trim()`.
- El correo sale como `from: "Arcade Vault <CONTACT_FROM_EMAIL>"`, `to: [CONTACT_TO_EMAIL]`, `replyTo: email` del visitante, `subject: "[Arcade Vault] Mensaje de <name>"` y cuerpo en texto plano con nombre, correo y mensaje.
- El éxito devuelve el nombre; la UI lo muestra en mayúsculas: `MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, <NOMBRE>.`.
- Textos de error fijos en español y sin filtrar detalles internos de Resend al cliente.

---

## Implementation plan

1. Instalar `resend` (`npm install resend`), crear `.env.example` con las 3 variables y añadir `!.env.example` a `.gitignore` (hoy `.env*` lo ignora). Verificación: `npm run build` sigue pasando y `.env.example` aparece en `git status`.
2. Copiar a `app/globals.css` el bloque `ABOUT PAGE` desde `references/templates/home-about/styles.css`, omitiendo reglas ya presentes. Verificación: `npm run dev` arranca y las pantallas existentes no cambian de aspecto.
3. Crear `lib/contact.ts` con `CONTACT_LIMITS`, los tipos y una función pura `validateContact(input)` que devuelve campos inválidos. Verificación: `npx tsc --noEmit` pasa.
4. Crear `app/about/actions.ts` (`"use server"`) con `sendContactMessage(prev, formData): Promise<ContactState>`: valida, comprueba que existan las variables de entorno, envía con Resend y mapea errores a `ContactState`. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
5. Crear `components/about/highlight-icon.tsx` (Server Component) con los 3 SVG del template. Verificación: `npm run lint` pasa.
6. Ampliar `components/home/reveal.tsx` para aceptar `aria-hidden` opcional (el divisor lo necesita). Verificación: el home (`/`) se ve igual.
7. Crear `app/about/page.tsx` con hero, destacados y divisor, y la sección de contacto con un formulario placeholder estático. Verificación: `/about` muestra los textos del template y no hay scroll horizontal a 390 px.
7b. Añadir "Acerca de" a `components/nav.tsx` (escritorio y panel móvil, `isAbout = pathname.startsWith("/about")`) y un enlace en `components/footer.tsx`. Verificación: desde cualquier página se llega a `/about`, y allí el enlace del nav aparece activo.
8. Crear `components/about/contact-form.tsx` (Client Component con `useActionState`): campos, `shake` cuando `status === "error"`, botón pendiente, error visible, terminal de éxito y "ENVIAR OTRO MENSAJE" que restablece el estado. Reemplazar el placeholder. Verificación: enviar vacío muestra error y sacude; enviar válido muestra la terminal.
9. Prueba real con una clave de Resend en `.env.local` y ajustes de paridad visual con `references/templates/home-about/arcade-vault-standalone.html` en escritorio y móvil. Verificación: el correo llega a `CONTACT_TO_EMAIL`, `npm run lint` y `npm run build` pasan.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores y `npm run lint` no reporta errores.
- [ ] `/about` renderiza sin errores en la consola (incluida hidratación) y el título de la pestaña es "Acerca de · Arcade Vault".
- [ ] La página muestra "ACERCA DE ARCADE VAULT", el texto de misión del template y exactamente 3 destacados con icono pixel.
- [ ] La sección de contacto muestra "CONTÁCTANOS", los 3 avisos ("RESPUESTA EN 24-48H", "SUGERENCIAS BIENVENIDAS", "SIN SPAM, JAMÁS") y los campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE.
- [ ] Las secciones con `.reveal` reciben la clase `in` al entrar en el viewport; el divisor tiene `aria-hidden="true"`.
- [ ] Enviar con algún campo vacío no llama a Resend, muestra un mensaje de error y aplica la clase `shake`.
- [ ] Enviar con un correo sin formato válido muestra error y no envía.
- [ ] Un mensaje de más de 2000 caracteres es rechazado por el servidor con error visible.
- [ ] Enviar datos válidos con las variables bien configuradas entrega un correo a `CONTACT_TO_EMAIL`, con `replyTo` igual al correo del visitante, y muestra la terminal con `GRACIAS, <NOMBRE EN MAYÚSCULAS>.`.
- [ ] Mientras la acción está pendiente el botón muestra "ENVIANDO…" y está deshabilitado.
- [ ] Si Resend responde con error o falta una variable de entorno, el usuario ve un error genérico y los datos escritos no se pierden.
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente ni en el HTML renderizado.
- [ ] El nav muestra "Acerca de" en escritorio y en el panel móvil, y está activo solo en `/about`; "Inicio", "Biblioteca" y "Salón de la Fama" mantienen su comportamiento.
- [ ] El footer contiene un enlace "Acerca de" que navega a `/about`.
- [ ] A 390 px de ancho no hay scroll horizontal en `/about`.
- [ ] `.env.example` está versionado y `.env.local` no.

---

## Decisions

- **Sí:** ruta `/about`. Decisión del usuario; coincide con el nombre del template y con `/games`.
- **No:** `/acerca-de`. Se prefirió consistencia con el nombre del template.
- **Sí:** Server Action con `useActionState`. No expone endpoint público, evita `fetch` manual y encaja con Next 16.
- **No:** Route Handler `POST /api/contact`. Más código y sin otro consumidor previsto.
- **Sí:** variables de entorno `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`. Evita código con secretos o correos fijos.
- **Sí:** remitente `onboarding@resend.dev` por ahora. Decisión del usuario: no hay dominio verificado todavía; con ese remitente Resend solo entrega al correo dueño de la cuenta, por eso `CONTACT_TO_EMAIL` debe ser ese correo.
- **No:** dominio verificado ni correo de confirmación al visitante. Requieren dominio propio; va en otra spec.
- **Sí:** validación en el servidor (campos obligatorios, correo válido, longitudes máximas). Nunca se confía en la validación del navegador.
- **No:** honeypot, captcha o rate limiting. El usuario no los pidió; queda registrado como riesgo.
- **Sí:** enlace "Acerca de" en nav y footer. Decisión del usuario tras la revisión; SPEC 02 lo dejaba pendiente para esta página y evita que quede huérfana.
- **Sí:** correo en texto plano con `replyTo` al visitante. Permite responder directamente desde el cliente de correo.
- **Sí:** reutilizar `components/home/reveal.tsx` en lugar de repetir el `useEffect` con `querySelectorAll` del template.
- **Sí:** copiar el CSS del template tal cual a `app/globals.css`, igual que SPEC 01 y 02. **No:** reescribirlo a Tailwind.
- **Sí:** la página es Server Component; solo el formulario y `Reveal` son Client Components.

---

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Con `onboarding@resend.dev` Resend rechaza destinatarios distintos al dueño de la cuenta | `CONTACT_TO_EMAIL` documentado en `.env.example` como el correo de la cuenta; el error de Resend se traduce a un mensaje genérico. |
| Spam o abuso del formulario sin captcha ni rate limit | Aceptado en este spec; validación de longitudes limita el tamaño. Spec futura si aparece abuso. |
| Clave de API filtrada al cliente | Solo se lee en `app/about/actions.ts` (`"use server"`), sin prefijo `NEXT_PUBLIC_`; criterio de aceptación lo verifica. |
| Inyección de cabeceras o contenido en el correo | El visitante solo controla `replyTo` (validado como correo) y el cuerpo en texto plano; el asunto usa el nombre recortado sin saltos de línea. |
| `cacheComponents` y APIs de petición | La página es estática; la lectura de `process.env` ocurre solo dentro de la Server Action. |
| Duplicados al copiar el CSS (`.reveal`, `.field`, `blink`) | Comprobar duplicados antes de pegar (paso 2). |

---

## What is **not** in this spec

- Honeypot, captcha y rate limiting.
- Correo de confirmación al visitante y dominio verificado.
- Base de datos o historial de mensajes.
- Plantillas HTML de correo.
- Tests automatizados y reescritura del CSS a Tailwind.

Cada uno de esos puntos, si se hace, va en su propia spec.
