// ---------------------------------------------------------------
// A deliberately small OUI subset for the `mac` command.
// The full IEEE registry is ~35,000 entries and 3MB — not something
// to ship in a portfolio bundle. These are the vendors that show up
// in the lab, plus the ones people recognise.
// ---------------------------------------------------------------

/** First three octets, uppercase, no separators. */
export const ouiVendors = {
  "0060 5C": "Cisco Systems",
  "0090 2B": "Cisco Systems",
  "000C 29": "VMware, Inc.",
  "0050 56": "VMware, Inc.",
  "0800 27": "Oracle VirtualBox",
  "5254 00": "QEMU / KVM virtual NIC",
  "B827 EB": "Raspberry Pi Foundation",
  "DCA6 32": "Raspberry Pi Trading",
  "001B 63": "Apple, Inc.",
  "A45E 60": "Apple, Inc.",
  "F0189E": "Apple, Inc.",
  "3C0754": "Apple, Inc.",
  "001A11": "Google, Inc.",
  "F4F5E8": "Google, Inc.",
  "0017 F2": "Apple, Inc.",
  "0021 6A": "Intel Corporate",
  "3C9754": "Intel Corporate",
  "8C1645": "Intel Corporate",
  "00E04C": "Realtek Semiconductor",
  "5254AB": "Realtek Semiconductor",
  "001CC0": "Intel Corporate",
  "0018 8B": "Dell Inc.",
  "B8CA3A": "Dell Inc.",
  "001731": "ASUSTek Computer",
  "2C56DC": "ASUSTek Computer",
  "000FB5": "NETGEAR",
  "A040A0": "NETGEAR",
  "0014BF": "Linksys / Cisco-Linksys",
  "C0C1C0": "Cisco-Linksys",
  "0025 9C": "Cisco-Linksys",
  "001E58": "D-Link Corporation",
  "3C1E04": "D-Link Corporation",
  "0009 5B": "NETGEAR",
  "00248C": "ASUSTek Computer",
  "D8EB97": "TP-LINK Technologies",
  "5C6329": "TP-LINK Technologies",
  "A85E45": "ASUSTek Computer",
  "FCECDA": "Ubiquiti Networks",
  "245A4C": "Ubiquiti Networks",
  "0418D6": "Ubiquiti Networks",
  "001185": "Hewlett Packard",
  "3CD92B": "Hewlett Packard",
  "000E7F": "Hewlett Packard",
  "0021 5A": "Hewlett Packard",
  "00155D": "Microsoft (Hyper-V)",
  "0003FF": "Microsoft Corporation",
  "001DD8": "Microsoft Corporation",
  "0016 6F": "Intel Corporate",
  "F81654": "Intel Corporate",
  "001FF3": "Apple, Inc.",
  "0026BB": "Apple, Inc.",
  "0050F2": "Microsoft Corporation",
  "001CB3": "Apple, Inc.",
  "0004 96": "Extreme Networks",
  "000B86": "Aruba / HPE Networking",
  "6CF37F": "Aruba / HPE Networking",
  "000D 88": "D-Link Corporation",
  "00259C": "Cisco-Linksys",
  "001DE0": "Intel Corporate",
  "F0DEF1": "Wistron Infocomm",
  "001E 4F": "Dell Inc.",
  "0090 27": "Intel Corporate",
  "00D0B7": "Intel Corporate",
  "001320": "Intel Corporate",
  "0002B3": "Intel Corporate",
  "00AA00": "Intel Corporate",
  "444553": "Microsoft (software loopback)",
};

/**
 * @param {string} mac accepts aabb.ccdd.eeff, aa:bb:cc:dd:ee:ff, aa-bb-.., or bare hex
 * @returns {string|null}
 */
export function lookupOui(mac) {
  const hex = String(mac).replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  if (hex.length < 6) return null;
  const oui = hex.slice(0, 6);
  for (const [key, vendor] of Object.entries(ouiVendors)) {
    if (key.replace(/\s/g, "") === oui) return vendor;
  }
  return null;
}
