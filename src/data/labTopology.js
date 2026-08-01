// ---------------------------------------------------------------
// The home lab / Packet Tracer topology.
//
// This file is deliberately FIXED and SMALL (plan §11). The `show`
// commands read it; they do not simulate a control plane. Every
// address below is internally consistent — routes match interfaces,
// MAC table matches switchports, CDP matches physical links — because
// anyone who knows IOS will check.
//
// Addressing
//   VLAN 10 Users    192.168.10.0/24   gw .1  (R1 Gi0/0.10)
//   VLAN 20 Servers  192.168.20.0/24   gw .1  (R1 Gi0/0.20)
//   VLAN 30 Mgmt     192.168.30.0/24   gw .1  (R1 Gi0/0.30)
//   R1 <-> R2        10.0.0.0/30       R1 .1, R2 .2
//   R2 <-> ISP       203.0.113.0/30    R2 .2, ISP .1
//   OSPF area 0 between R1 and R2; R2 default-originates, NAT/PAT on Gi0/1
// ---------------------------------------------------------------

export const topologyAscii = `
                              ( Internet )
                                    |
                            203.0.113.1/30
                                    |
                         Gi0/1 .2 [ R2 ]  NAT/PAT + default route
                                    |  Gi0/0 10.0.0.2/30
                                    |          OSPF area 0
                                    |  Gi0/1 10.0.0.1/30
                         Gi0/0 [ R1 ]  router-on-a-stick
                                    |  Gi0/0.10 .20 .30 (802.1Q)
                                    |
                          Gi0/1 [ SW1 ]  2960 — trunk Gi0/1
                            /       |       \\
                     Fa0/1 /   Fa0/2|        \\ Gi0/2 (trunk)
                          /         |         \\
                   [ PC1 ]     [ SRV1 ]     [ SW2 ]
                  VLAN 10      VLAN 20        |  Fa0/1
                192.168.10.10  192.168.20.10  |
                                          [ PC2 ]  VLAN 10
                                        192.168.10.11
`.trim();

/** @typedef {Object} Interface
 *  @property {string}  name
 *  @property {string}  ip        'unassigned' for switchports
 *  @property {string}  mask
 *  @property {'up'|'administratively down'|'down'} status
 *  @property {'up'|'down'} protocol
 *  @property {string}  [description]
 *  @property {string}  [mac]
 *  @property {number}  [vlan]
 *  @property {'access'|'trunk'} [switchportMode]
 */

/** @typedef {Object} Device
 *  @property {string} hostname
 *  @property {'router'|'switch'|'pc'|'server'} kind
 *  @property {string} model
 *  @property {string} [iosVersion]
 *  @property {string} [uptime]
 *  @property {string} [serial]
 *  @property {Interface[]} interfaces
 */

/** @type {Device[]} */
export const devices = [
  {
    hostname: "R1",
    kind: "router",
    model: "CISCO2911/K9",
    iosVersion: "15.1(4)M4",
    uptime: "3 weeks, 2 days, 7 hours, 41 minutes",
    serial: "FTX1524A0NM",
    interfaces: [
      {
        name: "GigabitEthernet0/0",
        ip: "unassigned",
        mask: "",
        status: "up",
        protocol: "up",
        description: "802.1Q trunk to SW1 Gi0/1",
        mac: "0060.5C7B.1A01",
      },
      {
        name: "GigabitEthernet0/0.10",
        ip: "192.168.10.1",
        mask: "255.255.255.0",
        status: "up",
        protocol: "up",
        description: "VLAN 10 Users gateway",
        vlan: 10,
      },
      {
        name: "GigabitEthernet0/0.20",
        ip: "192.168.20.1",
        mask: "255.255.255.0",
        status: "up",
        protocol: "up",
        description: "VLAN 20 Servers gateway",
        vlan: 20,
      },
      {
        name: "GigabitEthernet0/0.30",
        ip: "192.168.30.1",
        mask: "255.255.255.0",
        status: "up",
        protocol: "up",
        description: "VLAN 30 Mgmt gateway",
        vlan: 30,
      },
      {
        name: "GigabitEthernet0/1",
        ip: "10.0.0.1",
        mask: "255.255.255.252",
        status: "up",
        protocol: "up",
        description: "P2P to R2 Gi0/0 — OSPF area 0",
        mac: "0060.5C7B.1A02",
      },
      {
        name: "GigabitEthernet0/2",
        ip: "unassigned",
        mask: "",
        status: "administratively down",
        protocol: "down",
        mac: "0060.5C7B.1A03",
      },
      {
        name: "Loopback0",
        ip: "1.1.1.1",
        mask: "255.255.255.255",
        status: "up",
        protocol: "up",
        description: "OSPF router-id",
      },
    ],
  },
  {
    hostname: "R2",
    kind: "router",
    model: "CISCO2911/K9",
    iosVersion: "15.1(4)M4",
    uptime: "3 weeks, 2 days, 7 hours, 39 minutes",
    serial: "FTX1524A0NP",
    interfaces: [
      {
        name: "GigabitEthernet0/0",
        ip: "10.0.0.2",
        mask: "255.255.255.252",
        status: "up",
        protocol: "up",
        description: "P2P to R1 Gi0/1 — OSPF area 0",
        mac: "0060.5C7B.2B01",
      },
      {
        name: "GigabitEthernet0/1",
        ip: "203.0.113.2",
        mask: "255.255.255.252",
        status: "up",
        protocol: "up",
        description: "ISP uplink — NAT outside",
        mac: "0060.5C7B.2B02",
      },
      {
        name: "GigabitEthernet0/2",
        ip: "unassigned",
        mask: "",
        status: "administratively down",
        protocol: "down",
        mac: "0060.5C7B.2B03",
      },
      {
        name: "Loopback0",
        ip: "2.2.2.2",
        mask: "255.255.255.255",
        status: "up",
        protocol: "up",
        description: "OSPF router-id",
      },
    ],
  },
  {
    hostname: "SW1",
    kind: "switch",
    model: "WS-C2960-24TT-L",
    iosVersion: "15.0(2)SE4",
    uptime: "3 weeks, 2 days, 7 hours, 44 minutes",
    serial: "FOC1533X0X7",
    interfaces: [
      {
        name: "FastEthernet0/1",
        ip: "unassigned",
        mask: "",
        status: "up",
        protocol: "up",
        description: "PC1",
        vlan: 10,
        switchportMode: "access",
      },
      {
        name: "FastEthernet0/2",
        ip: "unassigned",
        mask: "",
        status: "up",
        protocol: "up",
        description: "SRV1",
        vlan: 20,
        switchportMode: "access",
      },
      {
        name: "FastEthernet0/3",
        ip: "unassigned",
        mask: "",
        status: "down",
        protocol: "down",
        vlan: 10,
        switchportMode: "access",
      },
      {
        name: "GigabitEthernet0/1",
        ip: "unassigned",
        mask: "",
        status: "up",
        protocol: "up",
        description: "Trunk to R1 Gi0/0",
        switchportMode: "trunk",
      },
      {
        name: "GigabitEthernet0/2",
        ip: "unassigned",
        mask: "",
        status: "up",
        protocol: "up",
        description: "Trunk to SW2 Gi0/1",
        switchportMode: "trunk",
      },
      {
        name: "Vlan30",
        ip: "192.168.30.11",
        mask: "255.255.255.0",
        status: "up",
        protocol: "up",
        description: "Management SVI",
      },
    ],
  },
  {
    hostname: "SW2",
    kind: "switch",
    model: "WS-C2960-24TT-L",
    iosVersion: "15.0(2)SE4",
    uptime: "3 weeks, 2 days, 7 hours, 44 minutes",
    serial: "FOC1533X0X9",
    interfaces: [
      {
        name: "FastEthernet0/1",
        ip: "unassigned",
        mask: "",
        status: "up",
        protocol: "up",
        description: "PC2",
        vlan: 10,
        switchportMode: "access",
      },
      {
        name: "GigabitEthernet0/1",
        ip: "unassigned",
        mask: "",
        status: "up",
        protocol: "up",
        description: "Trunk to SW1 Gi0/2",
        switchportMode: "trunk",
      },
      {
        name: "Vlan30",
        ip: "192.168.30.12",
        mask: "255.255.255.0",
        status: "up",
        protocol: "up",
        description: "Management SVI",
      },
    ],
  },
];

/** VLAN database as `show vlan brief` reports it. */
export const vlans = [
  {
    id: 1,
    name: "default",
    status: "active",
    ports: ["Fa0/4", "Fa0/5", "Fa0/6", "Fa0/7", "Fa0/8"],
  },
  { id: 10, name: "USERS", status: "active", ports: ["Fa0/1", "Fa0/3"] },
  { id: 20, name: "SERVERS", status: "active", ports: ["Fa0/2"] },
  { id: 30, name: "MGMT", status: "active", ports: [] },
  { id: 999, name: "PARKING-LOT", status: "active", ports: [] },
];

/** `show ip route` per device. */
export const routeTables = {
  R1: [
    { code: "O", proto: "ospf", network: "2.2.2.2/32", metric: "110/2", via: "10.0.0.2", iface: "GigabitEthernet0/1", age: "3w2d" },
    { code: "C", proto: "connected", network: "1.1.1.1/32", iface: "Loopback0" },
    { code: "C", proto: "connected", network: "10.0.0.0/30", iface: "GigabitEthernet0/1" },
    { code: "L", proto: "local", network: "10.0.0.1/32", iface: "GigabitEthernet0/1" },
    { code: "C", proto: "connected", network: "192.168.10.0/24", iface: "GigabitEthernet0/0.10" },
    { code: "L", proto: "local", network: "192.168.10.1/32", iface: "GigabitEthernet0/0.10" },
    { code: "C", proto: "connected", network: "192.168.20.0/24", iface: "GigabitEthernet0/0.20" },
    { code: "L", proto: "local", network: "192.168.20.1/32", iface: "GigabitEthernet0/0.20" },
    { code: "C", proto: "connected", network: "192.168.30.0/24", iface: "GigabitEthernet0/0.30" },
    { code: "L", proto: "local", network: "192.168.30.1/32", iface: "GigabitEthernet0/0.30" },
    { code: "O*E2", proto: "ospf-external", network: "0.0.0.0/0", metric: "110/1", via: "10.0.0.2", iface: "GigabitEthernet0/1", age: "3w2d" },
  ],
  R2: [
    { code: "O", proto: "ospf", network: "1.1.1.1/32", metric: "110/2", via: "10.0.0.1", iface: "GigabitEthernet0/0", age: "3w2d" },
    { code: "C", proto: "connected", network: "2.2.2.2/32", iface: "Loopback0" },
    { code: "C", proto: "connected", network: "10.0.0.0/30", iface: "GigabitEthernet0/0" },
    { code: "L", proto: "local", network: "10.0.0.2/32", iface: "GigabitEthernet0/0" },
    { code: "O", proto: "ospf", network: "192.168.10.0/24", metric: "110/2", via: "10.0.0.1", iface: "GigabitEthernet0/0", age: "3w2d" },
    { code: "O", proto: "ospf", network: "192.168.20.0/24", metric: "110/2", via: "10.0.0.1", iface: "GigabitEthernet0/0", age: "3w2d" },
    { code: "O", proto: "ospf", network: "192.168.30.0/24", metric: "110/2", via: "10.0.0.1", iface: "GigabitEthernet0/0", age: "3w2d" },
    { code: "C", proto: "connected", network: "203.0.113.0/30", iface: "GigabitEthernet0/1" },
    { code: "L", proto: "local", network: "203.0.113.2/32", iface: "GigabitEthernet0/1" },
    { code: "S*", proto: "static", network: "0.0.0.0/0", via: "203.0.113.1" },
  ],
};

/** `show ip ospf neighbor` per device. */
export const ospfNeighbors = {
  R1: [
    {
      id: "2.2.2.2",
      pri: 1,
      state: "FULL/DR",
      dead: "00:00:34",
      address: "10.0.0.2",
      iface: "GigabitEthernet0/1",
    },
  ],
  R2: [
    {
      id: "1.1.1.1",
      pri: 1,
      state: "FULL/BDR",
      dead: "00:00:31",
      address: "10.0.0.1",
      iface: "GigabitEthernet0/0",
    },
  ],
};

/** `show mac address-table` on SW1. */
export const macTable = [
  { vlan: 10, mac: "0090.2BA1.10AA", type: "DYNAMIC", port: "Fa0/1" },
  { vlan: 20, mac: "0090.2BA1.20BB", type: "DYNAMIC", port: "Fa0/2" },
  { vlan: 10, mac: "0090.2BA1.10CC", type: "DYNAMIC", port: "Gi0/2" },
  { vlan: 10, mac: "0060.5C7B.1A01", type: "DYNAMIC", port: "Gi0/1" },
  { vlan: 20, mac: "0060.5C7B.1A01", type: "DYNAMIC", port: "Gi0/1" },
  { vlan: 30, mac: "0060.5C7B.1A01", type: "DYNAMIC", port: "Gi0/1" },
];

/** `show cdp neighbors` per device. */
export const cdpNeighbors = {
  R1: [
    { id: "SW1", localIface: "Gig 0/0", holdtime: 142, capability: "S I", platform: "2960", portId: "Gig 0/1" },
    { id: "R2", localIface: "Gig 0/1", holdtime: 168, capability: "R B", platform: "2911", portId: "Gig 0/0" },
  ],
  R2: [
    { id: "R1", localIface: "Gig 0/0", holdtime: 155, capability: "R B", platform: "2911", portId: "Gig 0/1" },
  ],
  SW1: [
    { id: "R1", localIface: "Gig 0/1", holdtime: 133, capability: "R B", platform: "2911", portId: "Gig 0/0" },
    { id: "SW2", localIface: "Gig 0/2", holdtime: 147, capability: "S I", platform: "2960", portId: "Gig 0/1" },
  ],
  SW2: [
    { id: "SW1", localIface: "Gig 0/1", holdtime: 161, capability: "S I", platform: "2960", portId: "Gig 0/2" },
  ],
};

/** `arp -a` — the view from PC1 in VLAN 10, plus lab-wide entries. */
export const arpTable = [
  { ip: "192.168.10.1", mac: "0060.5C7B.1A01", type: "dynamic", iface: "Gi0/0.10", host: "R1" },
  { ip: "192.168.10.10", mac: "0090.2BA1.10AA", type: "dynamic", iface: "Fa0/1", host: "PC1" },
  { ip: "192.168.10.11", mac: "0090.2BA1.10CC", type: "dynamic", iface: "Gi0/2", host: "PC2" },
  { ip: "192.168.20.1", mac: "0060.5C7B.1A01", type: "dynamic", iface: "Gi0/0.20", host: "R1" },
  { ip: "192.168.20.10", mac: "0090.2BA1.20BB", type: "dynamic", iface: "Fa0/2", host: "SRV1" },
  { ip: "192.168.30.11", mac: "000C.2999.30D1", type: "dynamic", iface: "Vlan30", host: "SW1" },
  { ip: "192.168.30.12", mac: "000C.2999.30D2", type: "dynamic", iface: "Vlan30", host: "SW2" },
  { ip: "10.0.0.2", mac: "0060.5C7B.2B01", type: "dynamic", iface: "Gi0/1", host: "R2" },
];

/**
 * Hosts the simulated `ping` / `traceroute` / `dig` know about.
 * `hops` is the hop count used to derive a plausible TTL and latency.
 */
export const knownHosts = [
  { name: "R1", ip: "192.168.10.1", hops: 1, baseRtt: 1.2 },
  { name: "R2", ip: "10.0.0.2", hops: 2, baseRtt: 2.4 },
  { name: "SW1", ip: "192.168.30.11", hops: 1, baseRtt: 0.9 },
  { name: "SW2", ip: "192.168.30.12", hops: 2, baseRtt: 1.4 },
  { name: "PC2", ip: "192.168.10.11", hops: 1, baseRtt: 0.8 },
  { name: "SRV1", ip: "192.168.20.10", hops: 2, baseRtt: 1.6 },
  { name: "isp-gw", ip: "203.0.113.1", hops: 3, baseRtt: 8.5 },
];

/** Full `show running-config` output per device — trimmed to what the labs actually configure. */
export const runningConfigs = {
  R1: `Building configuration...

Current configuration : 1489 bytes
!
version 15.1
service timestamps debug datetime msec
service timestamps log datetime msec
no service password-encryption
!
hostname R1
!
interface Loopback0
 ip address 1.1.1.1 255.255.255.255
!
interface GigabitEthernet0/0
 no ip address
 duplex auto
 speed auto
!
interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0
!
interface GigabitEthernet0/0.20
 encapsulation dot1Q 20
 ip address 192.168.20.1 255.255.255.0
!
interface GigabitEthernet0/0.30
 encapsulation dot1Q 30
 ip address 192.168.30.1 255.255.255.0
!
interface GigabitEthernet0/1
 description P2P to R2
 ip address 10.0.0.1 255.255.255.252
 duplex auto
 speed auto
!
interface GigabitEthernet0/2
 no ip address
 shutdown
!
router ospf 1
 router-id 1.1.1.1
 passive-interface GigabitEthernet0/0.10
 passive-interface GigabitEthernet0/0.20
 network 10.0.0.0 0.0.0.3 area 0
 network 192.168.10.0 0.0.0.255 area 0
 network 192.168.20.0 0.0.0.255 area 0
 network 192.168.30.0 0.0.0.255 area 0
!
ip access-list standard MGMT-ONLY
 permit 192.168.30.0 0.0.0.255
 deny   any log
!
line con 0
 logging synchronous
line vty 0 4
 access-class MGMT-ONLY in
 login local
 transport input ssh
!
end`,
  R2: `Building configuration...

Current configuration : 1122 bytes
!
version 15.1
!
hostname R2
!
interface Loopback0
 ip address 2.2.2.2 255.255.255.255
!
interface GigabitEthernet0/0
 description P2P to R1
 ip address 10.0.0.2 255.255.255.252
 ip nat inside
!
interface GigabitEthernet0/1
 description ISP uplink
 ip address 203.0.113.2 255.255.255.252
 ip nat outside
!
router ospf 1
 router-id 2.2.2.2
 network 10.0.0.0 0.0.0.3 area 0
 default-information originate
!
ip nat inside source list NAT-ACL interface GigabitEthernet0/1 overload
ip route 0.0.0.0 0.0.0.0 203.0.113.1
!
ip access-list standard NAT-ACL
 permit 192.168.10.0 0.0.0.255
 permit 192.168.20.0 0.0.0.255
!
end`,
  SW1: `Building configuration...

Current configuration : 1310 bytes
!
version 15.0
!
hostname SW1
!
spanning-tree mode rapid-pvst
spanning-tree vlan 10,20,30 priority 24576
!
vlan 10
 name USERS
!
vlan 20
 name SERVERS
!
vlan 30
 name MGMT
!
vlan 999
 name PARKING-LOT
!
interface FastEthernet0/1
 description PC1
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
!
interface FastEthernet0/2
 description SRV1
 switchport mode access
 switchport access vlan 20
 spanning-tree portfast
!
interface FastEthernet0/3
 switchport mode access
 switchport access vlan 10
 shutdown
!
interface GigabitEthernet0/1
 description Trunk to R1
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
 switchport trunk native vlan 999
!
interface GigabitEthernet0/2
 description Trunk to SW2
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
 switchport trunk native vlan 999
!
interface Vlan30
 ip address 192.168.30.11 255.255.255.0
!
ip default-gateway 192.168.30.1
!
end`,
  SW2: `Building configuration...

Current configuration : 902 bytes
!
version 15.0
!
hostname SW2
!
spanning-tree mode rapid-pvst
!
vlan 10
 name USERS
!
vlan 20
 name SERVERS
!
vlan 30
 name MGMT
!
vlan 999
 name PARKING-LOT
!
interface FastEthernet0/1
 description PC2
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
!
interface GigabitEthernet0/1
 description Trunk to SW1
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
 switchport trunk native vlan 999
!
interface Vlan30
 ip address 192.168.30.12 255.255.255.0
!
ip default-gateway 192.168.30.1
!
end`,
};

/** Default device the `show` commands answer as. */
export const defaultDevice = "R1";

export const deviceNames = devices.map((d) => d.hostname);

/** @param {string} hostname */
export function getDevice(hostname) {
  const target = String(hostname).toUpperCase();
  return devices.find((d) => d.hostname.toUpperCase() === target) ?? null;
}
