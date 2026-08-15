import { useContext } from "react";
import { TerminalContext } from "../context/TerminalContext";

/** @returns {ReturnType<typeof import('../context/TerminalContext')>} the live terminal session */
export function useTerminal() {
    const ctx = useContext(TerminalContext);
    if (!ctx) throw new Error("useTerminal must be used inside <TerminalProvider>");
    return ctx;
}
