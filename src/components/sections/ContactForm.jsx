import { useState } from "react";
import { profile } from "../../data/profile";
import Button from "../ui/Button";

/* ---------------------------------------------------------------
   The form POSTs to Web3Forms, which relays the message to the inbox
   the access key is registered to. No backend of our own, and no
   dependency on the visitor having a mail client — `mailto:` only
   works for people with a configured desktop client, which on mobile
   and webmail is close to nobody (§5.6).

   The access key is a public, write-only identifier: it can submit to
   one inbox and read nothing back, so shipping it in the bundle is
   the intended design. It still lives in an env var so the address it
   points at is not in version control.

   `mailto:` survives as the fallback path — used when the key is
   missing at build time, and when the request fails. A contact form
   that can dead-end is worse than no form.
   --------------------------------------------------------------- */

const EMPTY = { name: "", email: "", message: "" };

const ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY ?? "";

/* Windows hands mailto: to ShellExecute, which truncates somewhere
   near 2 KB — and a truncated URL fails silently rather than opening
   a partial draft. Only relevant on the fallback path. */
const MAILTO_MAX = 1900;

const buildSubject = (v) => `Portfolio — ${v.name.trim()}`;

const buildBody = (v) =>
  `${v.message.trim()}\n\n— ${v.name.trim()}\n${v.email.trim()}`;

function buildMailto(v) {
  const subject = encodeURIComponent(buildSubject(v));
  const body = encodeURIComponent(buildBody(v));
  const full = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  return full.length > MAILTO_MAX
    ? `mailto:${profile.email}?subject=${subject}`
    : full;
}

/**
 * A synthesized anchor click carries user activation through to the
 * protocol handler. Assigning `window.location.href` does not in every
 * browser, and when it is refused it is refused without an error.
 */
function openMailClient(href) {
  const link = document.createElement("a");
  link.href = href;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  /** 'idle' | 'sending' | 'sent' | 'failed' */
  const [status, setStatus] = useState("idle");
  const [failure, setFailure] = useState("");
  const [copied, setCopied] = useState(false);
  // Honeypot. Invisible and unfocusable, so a human never fills it and
  // a form-filling bot almost always does.
  const [botcheck, setBotcheck] = useState("");

  const set = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setStatus("idle");
    setCopied(false);
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "Tell me who you are.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = "That email address doesn't look right.";
    if (values.message.trim().length < 10)
      next.message = "A little more detail helps — 10 characters minimum.";
    return next;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Trap sprung. Report success and drop it — telling a bot it was
    // caught only teaches whoever wrote it to fill the field better.
    if (botcheck) {
      setStatus("sent");
      setValues(EMPTY);
      return;
    }

    if (!ACCESS_KEY) {
      openMailClient(buildMailto(values));
      setFailure("This build has no form key configured.");
      setStatus("failed");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: buildSubject(values),
          from_name: "Portfolio contact form",
          // Web3Forms sets Reply-To from this, so hitting reply in
          // Gmail answers the sender rather than the relay.
          email: values.email.trim(),
          name: values.name.trim(),
          message: values.message.trim(),
          // Forwarded so the relay's own filter runs too. The early
          // return above already catches this, but a bot that skips
          // our handler and posts directly still gets checked.
          botcheck,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || `The relay returned ${response.status}.`,
        );
      }

      setStatus("sent");
      setValues(EMPTY);
    } catch (error) {
      // Offline, blocked by an extension, quota exhausted, key revoked —
      // all land here, and all get the same escape hatch.
      setFailure(error.message || "The request never reached the relay.");
      setStatus("failed");
    }
  };

  const copyDraft = async () => {
    const draft = `To: ${profile.email}\nSubject: ${buildSubject(values)}\n\n${buildBody(values)}`;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure context or denied permission) — the
      // draft is still on screen in the textarea for manual selection.
      setCopied(false);
    }
  };

  const field =
    "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-text " +
    "placeholder:text-faint focus:border-accent focus:outline-none " +
    "disabled:opacity-60";

  const sending = status === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-5">
      <div>
        <label htmlFor="cf-name" className="mb-1.5 block text-sm text-muted">
          Name
        </label>
        <input
          id="cf-name"
          name="name"
          value={values.name}
          onChange={set("name")}
          disabled={sending}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "cf-name-error" : undefined}
          className={field}
          placeholder="Your name"
        />
        {errors.name && (
          <p id="cf-name-error" className="mt-1.5 text-sm text-warn">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cf-email" className="mb-1.5 block text-sm text-muted">
          Email
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          value={values.email}
          onChange={set("email")}
          disabled={sending}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "cf-email-error" : undefined}
          className={field}
          placeholder="you@company.com"
        />
        {errors.email && (
          <p id="cf-email-error" className="mt-1.5 text-sm text-warn">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-sm text-muted">
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={6}
          value={values.message}
          onChange={set("message")}
          disabled={sending}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "cf-message-error" : undefined}
          className={`${field} resize-y`}
          placeholder="What are you working on?"
        />
        {errors.message && (
          <p id="cf-message-error" className="mt-1.5 text-sm text-warn">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot — hidden from sight, from the tab order, and from
          assistive tech. Anything that fills it is not a person. */}
      <input
        type="text"
        name="botcheck"
        value={botcheck}
        onChange={(e) => setBotcheck(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={sending}>
          {sending ? "Sending…" : "Send message"}
        </Button>
        {status === "idle" && (
          <p className="text-sm text-faint">
            Goes straight to my inbox — no mail app needed. I usually reply
            within a day.
          </p>
        )}
      </div>

      {/* One live region for every outcome, so a screen reader hears
          the result whichever way it went. */}
      <div aria-live="polite">
        {status === "sent" && (
          <div className="rounded-md border border-net/40 bg-surface-raise p-4 text-sm">
            <p className="text-text">
              Sent — thanks. I&apos;ll get back to you within a day.
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="rounded-md border border-warn/40 bg-surface-raise p-4 text-sm">
            <p className="text-text">That didn&apos;t go through. {failure}</p>
            <p className="mt-2 text-muted">
              I tried to open your mail app instead. If nothing happened, copy
              the message below and send it to{" "}
              <a
                href={`mailto:${profile.email}`}
                className="text-accent hover:underline"
              >
                {profile.email}
              </a>
              .
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyDraft}
              >
                {copied ? "Copied" : "Copy the message"}
              </Button>
              <a
                href={buildMailto(values)}
                className="text-sm text-muted hover:text-accent"
              >
                Open in mail app
              </a>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
