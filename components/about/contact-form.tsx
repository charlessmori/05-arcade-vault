"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendContactMessage } from "@/app/about/actions";
import type { ContactField, ContactState } from "@/lib/contact";

const IDLE: ContactState = { status: "idle" };

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(sendContactMessage, IDLE);
  const [values, setValues] = useState<Record<ContactField, string>>({
    name: "",
    email: "",
    message: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  // Cada error nuevo (objeto de estado distinto) vuelve a lanzar la animación.
  useEffect(() => {
    const form = formRef.current;
    if (!form || state.status !== "error") return;
    form.classList.remove("shake");
    void form.offsetWidth;
    form.classList.add("shake");
  }, [state]);

  const bind = (field: ContactField) => ({
    name: field,
    value: values[field],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setValues((v) => ({ ...v, [field]: e.target.value })),
    "aria-invalid":
      state.status === "error" && state.fields?.includes(field)
        ? true
        : undefined,
  });

  return (
    <form
      ref={formRef}
      className="contact-form"
      action={formAction}
      noValidate
      onAnimationEnd={(e) => e.currentTarget.classList.remove("shake")}
    >
      {state.status === "success" ? (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span>
            <span className="dot y"></span>
            <span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message
              --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{" "}
              {state.name.toUpperCase()}.<span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={onReset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              placeholder="px_kai"
              autoComplete="name"
              {...bind("name")}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              type="email"
              placeholder="jugador@vault.gg"
              autoComplete="email"
              {...bind("email")}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-message">MENSAJE</label>
            <textarea
              id="contact-message"
              rows={5}
              placeholder="Cuéntanos qué tienes en mente…"
              {...bind("message")}
            />
          </div>
          {state.status === "error" && (
            <p
              role="alert"
              className="pixel"
              style={{
                margin: "0 0 14px",
                fontSize: 9,
                lineHeight: 1.7,
                letterSpacing: "0.12em",
                color: "var(--magenta)",
              }}
            >
              ▸ {state.message}
            </p>
          )}
          <button
            className="btn xl press"
            type="submit"
            disabled={pending}
            style={{ width: "100%" }}
          >
            {pending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      )}
    </form>
  );
}

export function ContactForm() {
  // Cambiar la key remonta el formulario: estado de la acción y campos vacíos.
  const [resetKey, setResetKey] = useState(0);
  return (
    <ContactFormInner
      key={resetKey}
      onReset={() => setResetKey((k) => k + 1)}
    />
  );
}
