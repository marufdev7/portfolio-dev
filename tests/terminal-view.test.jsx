// ---------------------------------------------------------------
// One end-to-end pass through the real UI (§6.9).
//
// tests/terminal.test.js covers the engine with a fake context; this
// file covers the wiring the engine can't see — that a keystroke in
// the <input> reaches `execute`, and that its blocks come back out as
// DOM. If the provider, the view, and the registry ever stop agreeing,
// this is what fails.
// ---------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../src/context/ThemeContext";
import { TerminalProvider } from "../src/context/TerminalContext";
import TerminalView from "../src/components/terminal/TerminalView";

function setup() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ThemeProvider>
        <TerminalProvider>
          <TerminalView />
        </TerminalProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
  return { user, input: screen.getByLabelText(/terminal input/i) };
}

async function type(user, input, line) {
  await user.click(input);
  await user.type(input, `${line}{Enter}`);
}

describe("terminal view", () => {
  it("runs `help` and renders the command list", async () => {
    const { user, input } = setup();
    await type(user, input, "help");

    await waitFor(() => {
      expect(screen.getByRole("log")).toHaveTextContent("subnet");
    });
    expect(screen.getByRole("log")).toHaveTextContent("help");
  });

  it("computes real subnetting from typed input", async () => {
    const { user, input } = setup();
    await type(user, input, "subnet 192.168.1.10/26");

    await waitFor(() => {
      expect(screen.getByRole("log")).toHaveTextContent("255.255.255.192");
    });
    expect(screen.getByRole("log")).toHaveTextContent("192.168.1.0/26");
  });

  it("suggests the closest command instead of failing silently", async () => {
    const { user, input } = setup();
    await type(user, input, "pign R1");

    await waitFor(() => {
      expect(screen.getByRole("log")).toHaveTextContent(/command not found: pign/i);
    });
    expect(screen.getByRole("log")).toHaveTextContent("ping");
  });

  it("clears the input after a command and keeps it in history", async () => {
    const { user, input } = setup();
    await type(user, input, "whoami");

    await waitFor(() => expect(input).toHaveValue(""));

    await user.type(input, "{ArrowUp}");
    expect(input).toHaveValue("whoami");
  });
});
