import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GAMES } from "@/lib/games";

// Con cacheComponents, notFound() dentro de la página corre con el stream ya
// iniciado y la primera visita a un id desconocido respondería 200.
// Validamos el id aquí, antes de renderizar, para devolver siempre 404.
const IDS = new Set(GAMES.map((g) => g.id));

export function proxy(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/")[2];
  if (IDS.has(id)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
}

export const config = {
  matcher: ["/juegos/:id", "/juegos/:id/jugar"],
};
