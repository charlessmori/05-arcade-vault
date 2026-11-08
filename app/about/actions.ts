"use server";

import { Resend } from "resend";
import {
  CONTACT_LIMITS,
  validateContact,
  type ContactField,
  type ContactState,
} from "@/lib/contact";

const GENERIC_ERROR =
  "NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO MÁS TARDE.";

function readField(formData: FormData, key: ContactField): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const input = {
    name: readField(formData, "name"),
    email: readField(formData, "email"),
    message: readField(formData, "message"),
  };

  const invalid = validateContact(input);
  if (invalid.length > 0) {
    const tooLong =
      input.name.length > CONTACT_LIMITS.name ||
      input.email.length > CONTACT_LIMITS.email ||
      input.message.length > CONTACT_LIMITS.message;
    return {
      status: "error",
      message: tooLong
        ? "ALGÚN CAMPO SUPERA LA LONGITUD MÁXIMA PERMITIDA."
        : "REVISA LOS CAMPOS: TODOS SON OBLIGATORIOS Y EL CORREO DEBE SER VÁLIDO.",
      fields: invalid,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error("[contact] Faltan variables de entorno de Resend.");
    return { status: "error", message: GENERIC_ERROR };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `Arcade Vault <${from}>`,
      to: [to],
      replyTo: input.email,
      subject: `[Arcade Vault] Mensaje de ${input.name}`,
      text: `Nombre: ${input.name}\nCorreo: ${input.email}\n\nMensaje:\n${input.message}`,
    });

    if (error) {
      console.error("[contact] Resend devolvió un error:", error);
      return { status: "error", message: GENERIC_ERROR };
    }
  } catch (err) {
    console.error("[contact] Fallo al enviar con Resend:", err);
    return { status: "error", message: GENERIC_ERROR };
  }

  return { status: "success", name: input.name };
}
