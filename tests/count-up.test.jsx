import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CountUp from "../src/components/ui/CountUp";

/* jsdom has no IntersectionObserver, so framer's useInView never fires and
   the animation would sit at its start value. A trivial stub that reports
   "in view" immediately is enough for these assertions. */
class ObserverStub {
  constructor(cb) {
    this.cb = cb;
  }
  observe(el) {
    this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this);
  }
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = ObserverStub;
globalThis.IntersectionObserver = ObserverStub;

describe("CountUp", () => {
  it("lands on the target number", async () => {
    render(<CountUp value="3" duration={0.05} />);
    await waitFor(() => expect(screen.getByText("3", { selector: "[aria-hidden]" })).toBeTruthy());
  });

  it("always exposes the final value to assistive tech", () => {
    const { container } = render(<CountUp value="5" duration={0.05} />);
    expect(container.querySelector(".sr-only")).toHaveTextContent("5");
  });

  it("renders a non-numeric value as plain text", () => {
    render(<CountUp value="CCNA" />);
    expect(screen.getByText("CCNA", { selector: "[aria-hidden]" })).toBeTruthy();
  });
});
