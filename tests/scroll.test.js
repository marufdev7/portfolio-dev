import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SCROLL_OFFSET, scrollToElement, scrollToHash, scrollToTop } from "../src/lib/scroll";

/* jsdom implements window.scrollTo as a no-op that logs "Not implemented",
   and getBoundingClientRect always returns zeroes because there is no
   layout engine. Both are stubbed so the maths is what gets asserted. */

function mockRect(el, top) {
    el.getBoundingClientRect = () => ({
        top,
        bottom: top + 100,
        left: 0,
        right: 0,
        width: 0,
        height: 100,
        x: 0,
        y: top,
        toJSON: () => { },
    });
}

describe("lib/scroll", () => {
    let scrollTo;

    beforeEach(() => {
        scrollTo = vi.fn();
        window.scrollTo = scrollTo;
        window.scrollY = 0;
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    describe("scrollToTop", () => {
        it("cuts to the top instantly by default", () => {
            scrollToTop();
            expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
        });

        it("animates when asked to", () => {
            scrollToTop({ smooth: true });
            expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
        });
    });

    describe("scrollToElement", () => {
        it("offsets the target clear of the sticky header", () => {
            const el = document.createElement("div");
            document.body.append(el);
            window.scrollY = 500;
            mockRect(el, 300);

            expect(scrollToElement(el)).toBe(true);
            // 300 (viewport-relative) + 500 (scrolled) - 80 (header)
            expect(scrollTo).toHaveBeenCalledWith({ top: 720, left: 0, behavior: "smooth" });
        });

        it("never asks for a negative offset near the top of the page", () => {
            const el = document.createElement("div");
            document.body.append(el);
            mockRect(el, 10);

            scrollToElement(el);
            expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
        });

        it("reports a miss for a null target and does not scroll", () => {
            expect(scrollToElement(null)).toBe(false);
            expect(scrollTo).not.toHaveBeenCalled();
        });
    });

    describe("scrollToHash", () => {
        it("finds the element a hash names", () => {
            const el = document.createElement("section");
            el.id = "02-static-routing";
            document.body.append(el);
            mockRect(el, 400);

            expect(scrollToHash("#02-static-routing")).toBe(true);
            expect(scrollTo).toHaveBeenCalledWith({
                top: 400 - SCROLL_OFFSET,
                left: 0,
                behavior: "smooth",
            });
        });

        it("decodes a percent-encoded fragment", () => {
            const el = document.createElement("section");
            el.id = "vlan trunking";
            document.body.append(el);
            mockRect(el, 200);

            expect(scrollToHash("#vlan%20trunking")).toBe(true);
        });

        it("reports a miss for an empty hash, a bare '#', or an unknown id", () => {
            expect(scrollToHash("")).toBe(false);
            expect(scrollToHash("#")).toBe(false);
            expect(scrollToHash("#nothing-here")).toBe(false);
            expect(scrollTo).not.toHaveBeenCalled();
        });
    });

    describe("prefers-reduced-motion", () => {
        it("collapses a smooth scroll to an instant one", () => {
            const original = window.matchMedia;
            window.matchMedia = (query) => ({
                ...original(query),
                matches: query.includes("prefers-reduced-motion"),
            });

            scrollToTop({ smooth: true });
            expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });

            window.matchMedia = original;
        });
    });
});
