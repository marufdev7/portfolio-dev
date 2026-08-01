import { describe, it, expect } from "vitest";
import {
  ipToInt,
  intToIp,
  parseOctets,
  isValidIp,
  parsePrefix,
  maskToPrefix,
  prefixToMask,
  prefixToWildcard,
  parseCidr,
  intToBinary,
  intToHex,
  ipClass,
  classifyIp,
  subnet,
  prefixForHosts,
  vlsm,
  summarize,
  contains,
  describeNumber,
  IpError,
} from "../src/lib/ip";

describe("ipToInt / intToIp", () => {
  const cases = [
    ["0.0.0.0", 0],
    ["1.2.3.4", 16909060],
    ["192.168.1.1", 3232235777],
    ["255.255.255.255", 4294967295],
    // Above 127.x the signed-int32 trap bites without `>>> 0`.
    ["128.0.0.0", 2147483648],
    ["224.0.0.5", 3758096389],
  ];

  it.each(cases)("%s <-> %i", (ip, int) => {
    expect(ipToInt(ip)).toBe(int);
    expect(intToIp(int)).toBe(ip);
  });

  it("never returns a negative integer", () => {
    for (const ip of ["128.0.0.1", "192.168.0.1", "255.0.0.0", "240.1.2.3"]) {
      expect(ipToInt(ip)).toBeGreaterThan(0);
    }
  });

  it("rejects out-of-range integers", () => {
    expect(() => intToIp(-1)).toThrow(IpError);
    expect(() => intToIp(4294967296)).toThrow(IpError);
    expect(() => intToIp(1.5)).toThrow(IpError);
  });
});

describe("parseOctets", () => {
  it("accepts valid addresses", () => {
    expect(parseOctets("10.0.0.1")).toEqual([10, 0, 0, 1]);
    expect(parseOctets("  192.168.1.1  ")).toEqual([192, 168, 1, 1]);
    expect(parseOctets("0.0.0.0")).toEqual([0, 0, 0, 0]);
  });

  it.each([
    ["10.0.0", "too few octets"],
    ["10.0.0.1.5", "too many octets"],
    ["256.0.0.1", "octet over 255"],
    ["10.0.0.-1", "negative octet"],
    ["10.0.0.a", "non-numeric octet"],
    ["10.0.0.", "empty octet"],
    ["", "empty string"],
    ["010.1.1.1", "leading zero reads as octal"],
    ["1000.1.1.1", "octet too long"],
  ])("rejects %s (%s)", (bad) => {
    expect(() => parseOctets(bad)).toThrow(IpError);
  });

  it("rejects non-strings", () => {
    expect(() => parseOctets(null)).toThrow(IpError);
    expect(() => parseOctets(123)).toThrow(IpError);
  });

  it("isValidIp mirrors parseOctets without throwing", () => {
    expect(isValidIp("10.0.0.1")).toBe(true);
    expect(isValidIp("300.0.0.1")).toBe(false);
  });
});

describe("mask <-> prefix", () => {
  const table = [
    [0, "0.0.0.0", "255.255.255.255"],
    [1, "128.0.0.0", "127.255.255.255"],
    [8, "255.0.0.0", "0.255.255.255"],
    [12, "255.240.0.0", "0.15.255.255"],
    [20, "255.255.240.0", "0.0.15.255"],
    [24, "255.255.255.0", "0.0.0.255"],
    [25, "255.255.255.128", "0.0.0.127"],
    [26, "255.255.255.192", "0.0.0.63"],
    [27, "255.255.255.224", "0.0.0.31"],
    [28, "255.255.255.240", "0.0.0.15"],
    [29, "255.255.255.248", "0.0.0.7"],
    [30, "255.255.255.252", "0.0.0.3"],
    [31, "255.255.255.254", "0.0.0.1"],
    [32, "255.255.255.255", "0.0.0.0"],
  ];

  it.each(table)("/%i is %s (wildcard %s)", (prefix, mask, wildcard) => {
    expect(prefixToMask(prefix)).toBe(mask);
    expect(maskToPrefix(mask)).toBe(prefix);
    expect(prefixToWildcard(prefix)).toBe(wildcard);
  });

  it("rejects non-contiguous masks", () => {
    expect(() => maskToPrefix("255.255.0.255")).toThrow(/contiguous/);
    expect(() => maskToPrefix("255.0.255.0")).toThrow(/contiguous/);
    expect(() => maskToPrefix("0.0.0.1")).toThrow(/contiguous/);
  });

  it("rejects out-of-range prefixes", () => {
    expect(() => prefixToMask(33)).toThrow(IpError);
    expect(() => prefixToMask(-1)).toThrow(IpError);
    expect(() => parsePrefix("33")).toThrow(IpError);
  });

  it("parsePrefix accepts /24, 24, and a dotted mask", () => {
    expect(parsePrefix("/24")).toBe(24);
    expect(parsePrefix("24")).toBe(24);
    expect(parsePrefix(24)).toBe(24);
    expect(parsePrefix("255.255.255.0")).toBe(24);
  });
});

describe("parseCidr", () => {
  it("handles slash notation and space-separated masks", () => {
    expect(parseCidr("10.0.0.1/24")).toEqual({ ip: "10.0.0.1", prefix: 24 });
    expect(parseCidr("10.0.0.1 255.255.255.0")).toEqual({ ip: "10.0.0.1", prefix: 24 });
    expect(parseCidr("  10.0.0.1/8  ")).toEqual({ ip: "10.0.0.1", prefix: 8 });
  });

  it.each(["10.0.0.1", "10.0.0.1/", "10.0.0.1/99", "not-an-ip/24", ""])(
    "rejects %s",
    (bad) => {
      expect(() => parseCidr(bad)).toThrow(IpError);
    }
  );
});

describe("binary and hex", () => {
  it("renders dotted binary", () => {
    expect(intToBinary(ipToInt("192.168.1.1"))).toBe("11000000.10101000.00000001.00000001");
    expect(intToBinary(0)).toBe("00000000.00000000.00000000.00000000");
    expect(intToBinary(4294967295)).toBe("11111111.11111111.11111111.11111111");
  });

  it("renders padded hex", () => {
    expect(intToHex(ipToInt("192.168.1.1"))).toBe("0xC0A80101");
    expect(intToHex(0)).toBe("0x00000000");
  });

  it("describeNumber round-trips every input form", () => {
    const expected = { dotted: "192.168.1.1", int: 3232235777 };
    for (const input of [
      "192.168.1.1",
      "3232235777",
      "0xC0A80101",
      "0b11000000101010000000000100000001",
      "11000000101010000000000100000001",
    ]) {
      const out = describeNumber(input);
      expect(out.dotted).toBe(expected.dotted);
      expect(out.int).toBe(expected.int);
    }
  });

  it("rejects garbage and out-of-range numbers", () => {
    expect(() => describeNumber("hello")).toThrow(IpError);
    expect(() => describeNumber("4294967296")).toThrow(IpError);
  });
});

describe("classification", () => {
  it.each([
    ["10.0.0.1", "A"],
    ["126.1.1.1", "A"],
    ["128.0.0.1", "B"],
    ["191.255.255.255", "B"],
    ["192.0.0.1", "C"],
    ["223.1.1.1", "C"],
    ["224.0.0.5", "D (multicast)"],
    ["240.0.0.1", "E (experimental)"],
  ])("%s is class %s", (ip, cls) => {
    expect(ipClass(ip)).toBe(cls);
  });

  it.each([
    ["10.1.2.3", "Private"],
    ["172.16.0.1", "Private"],
    ["172.31.255.255", "Private"],
    ["192.168.1.1", "Private"],
    ["127.0.0.1", "Loopback"],
    ["169.254.10.10", "Link-local (APIPA)"],
    ["100.64.0.1", "Shared address space (CGNAT)"],
    ["224.0.0.5", "Multicast"],
    ["203.0.113.5", "Documentation"],
    ["8.8.8.8", "Public"],
  ])("%s scope is %s", (ip, scope) => {
    expect(classifyIp(ip).scope).toBe(scope);
  });

  it("172.32.0.1 is public — the 172.16.0.0/12 boundary", () => {
    expect(classifyIp("172.32.0.1").scope).toBe("Public");
    expect(classifyIp("172.15.255.255").scope).toBe("Public");
  });
});

describe("subnet", () => {
  it("computes a /24", () => {
    const r = subnet("192.168.1.57/24");
    expect(r.network).toBe("192.168.1.0");
    expect(r.broadcast).toBe("192.168.1.255");
    expect(r.firstHost).toBe("192.168.1.1");
    expect(r.lastHost).toBe("192.168.1.254");
    expect(r.usableHosts).toBe(254);
    expect(r.totalAddresses).toBe(256);
    expect(r.mask).toBe("255.255.255.0");
    expect(r.wildcard).toBe("0.0.0.255");
    expect(r.cidr).toBe("192.168.1.0/24");
  });

  it("computes a /20 across an octet boundary", () => {
    const r = subnet("172.16.135.200/20");
    expect(r.network).toBe("172.16.128.0");
    expect(r.broadcast).toBe("172.16.143.255");
    expect(r.firstHost).toBe("172.16.128.1");
    expect(r.lastHost).toBe("172.16.143.254");
    expect(r.usableHosts).toBe(4094);
  });

  it("computes a /22", () => {
    const r = subnet("172.16.8.0/22");
    expect(r.network).toBe("172.16.8.0");
    expect(r.broadcast).toBe("172.16.11.255");
    expect(r.usableHosts).toBe(1022);
  });

  it("handles /30 point-to-point", () => {
    const r = subnet("10.0.0.1/30");
    expect(r.network).toBe("10.0.0.0");
    expect(r.broadcast).toBe("10.0.0.3");
    expect(r.firstHost).toBe("10.0.0.1");
    expect(r.lastHost).toBe("10.0.0.2");
    expect(r.usableHosts).toBe(2);
  });

  it("handles /31 as RFC 3021 — both addresses usable, no broadcast", () => {
    const r = subnet("10.0.0.0/31");
    expect(r.usableHosts).toBe(2);
    expect(r.firstHost).toBe("10.0.0.0");
    expect(r.lastHost).toBe("10.0.0.1");
    expect(r.broadcast).toBe("—");
    expect(r.note).toMatch(/RFC 3021/);
  });

  it("handles /32 as a host route", () => {
    const r = subnet("10.0.0.7/32");
    expect(r.usableHosts).toBe(1);
    expect(r.network).toBe("10.0.0.7");
    expect(r.firstHost).toBe("10.0.0.7");
    expect(r.lastHost).toBe("10.0.0.7");
    expect(r.broadcast).toBe("—");
    expect(r.totalAddresses).toBe(1);
  });

  it("handles /0 as the whole address space", () => {
    const r = subnet("0.0.0.0/0");
    expect(r.network).toBe("0.0.0.0");
    expect(r.broadcast).toBe("255.255.255.255");
    expect(r.usableHosts).toBe(4294967294);
    expect(r.note).toMatch(/default route/);
  });

  it("handles /8 with a high first octet (signed-int regression)", () => {
    const r = subnet("200.1.2.3/8");
    expect(r.network).toBe("200.0.0.0");
    expect(r.broadcast).toBe("200.255.255.255");
  });

  it("does not require the input to be the network address", () => {
    expect(subnet("192.168.1.200/26").network).toBe("192.168.1.192");
    expect(subnet("192.168.1.200/26").broadcast).toBe("192.168.1.255");
  });

  it("accepts a dotted mask instead of a prefix", () => {
    expect(subnet("10.0.0.5 255.255.255.240").network).toBe("10.0.0.0");
    expect(subnet("10.0.0.5 255.255.255.240").broadcast).toBe("10.0.0.15");
  });

  it.each(["", "10.0.0.0", "10.0.0.0/33", "999.0.0.0/24", "10.0.0.0/abc"])(
    "rejects %s",
    (bad) => {
      expect(() => subnet(bad)).toThrow(IpError);
    }
  );
});

describe("prefixForHosts", () => {
  it.each([
    [1, 32],
    [2, 31],
    [3, 29],
    [5, 29],
    [6, 29],
    [7, 28],
    [12, 28],
    [14, 28],
    [15, 27],
    [28, 27],
    [30, 27],
    [31, 26],
    [60, 26],
    [62, 26],
    [63, 25],
    [126, 25],
    [254, 24],
    [255, 23],
    [1022, 22],
  ])("%i hosts needs /%i", (hosts, prefix) => {
    expect(prefixForHosts(hosts)).toBe(prefix);
  });

  it("rejects invalid counts", () => {
    expect(() => prefixForHosts(0)).toThrow(IpError);
    expect(() => prefixForHosts(-5)).toThrow(IpError);
    expect(() => prefixForHosts(1.5)).toThrow(IpError);
    expect(() => prefixForHosts("many")).toThrow(IpError);
  });
});

describe("vlsm", () => {
  it("allocates the canonical example correctly", () => {
    // This is the exact case the plan's differentiator test uses (§10).
    const { blocks, remaining } = vlsm("192.168.1.0/24", [60, 28, 12, 5]);

    expect(blocks).toHaveLength(4);

    expect(blocks[0]).toMatchObject({
      requested: 60,
      prefix: 26,
      network: "192.168.1.0",
      firstHost: "192.168.1.1",
      lastHost: "192.168.1.62",
      usableHosts: 62,
      wasted: 2,
    });
    expect(blocks[1]).toMatchObject({
      requested: 28,
      prefix: 27,
      network: "192.168.1.64",
      firstHost: "192.168.1.65",
      lastHost: "192.168.1.94",
      wasted: 2,
    });
    expect(blocks[2]).toMatchObject({
      requested: 12,
      prefix: 28,
      network: "192.168.1.96",
      lastHost: "192.168.1.110",
      wasted: 2,
    });
    expect(blocks[3]).toMatchObject({
      requested: 5,
      prefix: 29,
      network: "192.168.1.112",
      lastHost: "192.168.1.118",
      wasted: 1,
    });

    expect(remaining.from).toBe("192.168.1.120");
    expect(remaining.to).toBe("192.168.1.255");
    expect(remaining.addresses).toBe(136);
  });

  it("allocates largest-first regardless of request order", () => {
    const ascending = vlsm("192.168.1.0/24", [5, 12, 28, 60]);
    const descending = vlsm("192.168.1.0/24", [60, 28, 12, 5]);

    // Same networks assigned to the same sizes either way.
    const bySize = (r) =>
      r.blocks.reduce((acc, b) => ({ ...acc, [b.requested]: b.network }), {});
    expect(bySize(ascending)).toEqual(bySize(descending));
    expect(bySize(ascending)[60]).toBe("192.168.1.0");
  });

  it("preserves the original request order in `order`", () => {
    const { blocks } = vlsm("192.168.1.0/24", [5, 60]);
    const five = blocks.find((b) => b.requested === 5);
    const sixty = blocks.find((b) => b.requested === 60);
    expect(five.order).toBe(0);
    expect(sixty.order).toBe(1);
    // 60 was requested second but allocated first.
    expect(sixty.network).toBe("192.168.1.0");
  });

  it("aligns each block on its own size boundary", () => {
    const { blocks } = vlsm("10.0.0.0/22", [500, 200, 100]);
    for (const b of blocks) {
      const size = 2 ** (32 - b.prefix);
      expect(ipToInt(b.network) % size).toBe(0);
    }
  });

  it("throws when the parent cannot hold the request", () => {
    expect(() => vlsm("192.168.1.0/24", [200, 200])).toThrow(/cannot fit/);
    expect(() => vlsm("192.168.1.0/29", [100])).toThrow(/cannot fit/);
  });

  it("rejects an empty or invalid host list", () => {
    expect(() => vlsm("192.168.1.0/24", [])).toThrow(IpError);
    expect(() => vlsm("192.168.1.0/24", [0])).toThrow(IpError);
    expect(() => vlsm("192.168.1.0/24", ["x"])).toThrow(IpError);
  });

  it("handles a single point-to-point request", () => {
    const { blocks } = vlsm("10.0.0.0/24", [2]);
    expect(blocks[0].prefix).toBe(31);
    expect(blocks[0].usableHosts).toBe(2);
  });
});

describe("summarize", () => {
  it("summarizes four contiguous /24s into a /22", () => {
    const r = summarize([
      "192.168.0.0/24",
      "192.168.1.0/24",
      "192.168.2.0/24",
      "192.168.3.0/24",
    ]);
    expect(r.summary).toBe("192.168.0.0/22");
    expect(r.exact).toBe(true);
  });

  it("flags an inexact summary that pulls in extra space", () => {
    const r = summarize(["192.168.0.0/24", "192.168.3.0/24"]);
    expect(r.summary).toBe("192.168.0.0/22");
    expect(r.exact).toBe(false);
    expect(r.covered).toBe(1024);
    expect(r.requested).toBe(512);
  });

  it("summarizes across a /16 boundary", () => {
    const r = summarize(["10.1.0.0/16", "10.2.0.0/16", "10.3.0.0/16"]);
    expect(r.summary).toBe("10.0.0.0/14");
    expect(r.exact).toBe(false);
  });

  it("returns the network itself for a single input", () => {
    const r = summarize(["192.168.1.0/24"]);
    expect(r.summary).toBe("192.168.1.0/24");
    expect(r.exact).toBe(true);
  });

  it("falls back to /0 when nothing is in common", () => {
    const r = summarize(["10.0.0.0/8", "192.168.0.0/16"]);
    expect(r.summary).toBe("0.0.0.0/0");
  });

  it("never returns a prefix longer than its most general member", () => {
    const r = summarize(["10.0.0.0/8", "10.0.0.0/24"]);
    expect(r.prefix).toBe(8);
  });

  it("rejects an empty list", () => {
    expect(() => summarize([])).toThrow(IpError);
  });
});

describe("contains", () => {
  it("tests membership", () => {
    expect(contains("192.168.1.0/24", "192.168.1.57")).toBe(true);
    expect(contains("192.168.1.0/24", "192.168.2.1")).toBe(false);
    expect(contains("0.0.0.0/0", "8.8.8.8")).toBe(true);
    expect(contains("10.0.0.1/32", "10.0.0.1")).toBe(true);
    expect(contains("10.0.0.1/32", "10.0.0.2")).toBe(false);
  });
});
