import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ContactForm from "../src/components/sections/ContactForm";
import { profile } from "../src/data/profile";

/* ---------------------------------------------------------------
   The live relay cannot be exercised from here — Web3Forms rejects
   non-browser requests on the free plan, so any assertion against the
   real endpoint would test their bot filter, not our code.

   What is worth pinning down is the request we build and how each
   response shape is handled: a wrong field name or a swallowed error
   fails silently in production, which is exactly the failure mode
   this form already had once.
   --------------------------------------------------------------- */

const ENDPOINT = "https://api.web3forms.com/submit";

const setup = () =>
  render(
    <MemoryRouter>
      <ContactForm />
    </MemoryRouter>
  );

const fill = async (user, { name = "Ada", email = "ada@example.com", message } = {}) => {
  await user.type(screen.getByLabelText(/name/i), name);
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/message/i), message ?? "Hello, this is long enough.");
};

const ok = () => ({ ok: true, json: async () => ({ success: true, message: "Email sent" }) });

describe("ContactForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(ok));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts to the Web3Forms endpoint as JSON", async () => {
    const user = userEvent.setup();
    setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("sends the field names the relay expects", async () => {
    const user = userEvent.setup();
    setup();
    await fill(user, { name: "Ada", email: "ada@example.com", message: "Ten chars plus." });
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const body = JSON.parse(fetch.mock.calls[0][1].body);

    expect(body).toMatchObject({
      name: "Ada",
      message: "Ten chars plus.",
      // Reply-To is derived from this — if it drifts, replying in
      // Gmail answers the relay instead of the sender.
      email: "ada@example.com",
    });
    expect(body.access_key).toBeTruthy();
    expect(body.subject).toContain("Ada");
  });

  it("confirms on success and clears the form", async () => {
    const user = userEvent.setup();
    setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/sent — thanks/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue("");
  });

  it("surfaces the fallback when the relay reports failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ success: false, message: "Invalid access key" }),
      }))
    );

    const user = userEvent.setup();
    setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/didn't go through/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid access key/i)).toBeInTheDocument();
    // The escape hatch — the address must stay reachable on failure.
    expect(screen.getByRole("link", { name: profile.email })).toHaveAttribute(
      "href",
      `mailto:${profile.email}`
    );
  });

  it("surfaces the fallback when the request never lands", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Failed to fetch");
      })
    );

    const user = userEvent.setup();
    setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/didn't go through/i)).toBeInTheDocument();
  });

  it("does not post when validation fails", async () => {
    const user = userEvent.setup();
    setup();
    await fill(user, { email: "not-an-email", message: "short" });
    await user.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText(/doesn't look right/i)).toBeInTheDocument();
    expect(screen.getByText(/10 characters minimum/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("drops honeypot submissions without posting", async () => {
    const user = userEvent.setup();
    const { container } = setup();
    await fill(user);

    const trap = container.querySelector('input[name="botcheck"]');
    expect(trap).toHaveAttribute("aria-hidden", "true");
    expect(trap).toHaveAttribute("tabindex", "-1");

    // A bot fills what it cannot see.
    await user.type(trap, "http://spam.example");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    // Reports success, sends nothing — never tell a bot it was caught.
    expect(await screen.findByText(/sent — thanks/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
