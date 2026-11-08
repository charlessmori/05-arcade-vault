export const CONTACT_LIMITS = { name: 80, email: 254, message: 2000 } as const;

export type ContactField = "name" | "email" | "message";

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }
  | { status: "error"; message: string; fields?: ContactField[] };

export type ContactInput = Record<ContactField, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Devuelve los campos inválidos (vacíos, demasiado largos o con formato incorrecto). */
export function validateContact(input: ContactInput): ContactField[] {
  const invalid: ContactField[] = [];

  const name = input.name.trim();
  if (!name || name.length > CONTACT_LIMITS.name || /[\r\n]/.test(name)) {
    invalid.push("name");
  }

  const email = input.email.trim();
  if (!email || email.length > CONTACT_LIMITS.email || !EMAIL_RE.test(email)) {
    invalid.push("email");
  }

  const message = input.message.trim();
  if (!message || message.length > CONTACT_LIMITS.message) {
    invalid.push("message");
  }

  return invalid;
}
