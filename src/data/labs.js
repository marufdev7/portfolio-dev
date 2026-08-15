// ---------------------------------------------------------------
// The lab log. Renders /network/labs, backs the VFS at
// ~/network/labs/, and `topology` reads topologyAscii from here.
//
// `whatBroke` / `howIFixedIt` are mandatory fields, not optional
// colour. Clean lab writeups look copied; documented failures look
// lived (plan §7).
// ---------------------------------------------------------------

import { topologyAscii } from "./labTopology";

/** @typedef {Object} Lab
 *  @property {string}   id
 *  @property {string}   slug
 *  @property {string}   title
 *  @property {string}   date          ISO
 *  @property {string[]} topics
 *  @property {string}   objective
 *  @property {string}   topologyAscii
 *  @property {string}   config        real IOS, shown mono
 *  @property {string}   verification  the show/ping output that proved it worked
 *  @property {string}   whatBroke
 *  @property {string}   howIFixedIt
 *  @property {string}   takeaway
 */

/** @type {Lab[]} */
export const labs = [
    {
        id: "01",
        slug: "01-vlan-trunking",
        title: "VLANs, 802.1Q trunking, and inter-VLAN routing",
        date: "2026-08-04",
        topics: ["VLAN", "Trunking", "802.1Q", "Router-on-a-stick"],
        objective:
            "Segment the lab into three VLANs (Users, Servers, Mgmt), carry them over a single trunk to R1, and route between them with subinterfaces — one physical link doing the work of three.",
        topologyAscii,
        config: `! ---- SW1 ----
vlan 10
 name USERS
vlan 20
 name SERVERS
vlan 30
 name MGMT
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
!
interface GigabitEthernet0/1
 description Trunk to R1
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
 switchport trunk native vlan 999
!
! ---- R1 (router-on-a-stick) ----
interface GigabitEthernet0/0
 no ip address
 no shutdown
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
 ip address 192.168.30.1 255.255.255.0`,
        verification: `SW1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      999

Port        Vlans allowed on trunk
Gi0/1       10,20,30

PC1> ping 192.168.20.10
Reply from 192.168.20.10: bytes=32 time=2ms TTL=127`,
        whatBroke:
            "Nothing crossed the trunk. PC1 could reach its own gateway at 192.168.10.1 but nothing in VLAN 20, and `show interfaces trunk` looked correct on both ends. R1's subinterfaces were up/up. I spent most of an evening re-reading the access-port config, which was fine.",
        howIFixedIt:
            "The native VLAN was 999 on SW1 and still 1 on the R1 side, so untagged frames were landing in the wrong place and CDP was logging a mismatch I hadn't looked at. `show interfaces trunk` doesn't compare the two ends for you — `show cdp neighbors detail` and the console log did. Setting the native VLAN consistently on both ends fixed it immediately. The real lesson was to read the log before re-reading the config.",
        takeaway:
            "A trunk that says `trunking` on both ends is not the same as a trunk that agrees on both ends. Native VLAN, allowed VLAN list, and encapsulation all have to match, and the syslog will usually tell you first.",
    },
    {
        id: "02",
        slug: "02-static-routing",
        title: "Static and default routing between R1 and R2",
        date: "2026-08-11",
        topics: ["Static routing", "Default route", "Longest prefix match"],
        objective:
            "Reach the ISP from the VLANs using nothing but static routes, then prove I understood why each route was needed before letting OSPF do it automatically in lab 03.",
        topologyAscii,
        config: `! ---- R1 ----
interface GigabitEthernet0/1
 description P2P to R2
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
ip route 0.0.0.0 0.0.0.0 10.0.0.2
!
! ---- R2 ----
interface GigabitEthernet0/0
 ip address 10.0.0.2 255.255.255.252
 no shutdown
!
ip route 192.168.10.0 255.255.255.0 10.0.0.1
ip route 192.168.20.0 255.255.255.0 10.0.0.1
ip route 192.168.30.0 255.255.255.0 10.0.0.1
ip route 0.0.0.0 0.0.0.0 203.0.113.1`,
        verification: `R1# show ip route
Gateway of last resort is 10.0.0.2 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 10.0.0.2
C     10.0.0.0/30 is directly connected, GigabitEthernet0/1
C     192.168.10.0/24 is directly connected, GigabitEthernet0/0.10

R1# traceroute 203.0.113.1
  1  10.0.0.2  2 msec  1 msec  2 msec
  2  203.0.113.1  9 msec  8 msec  9 msec`,
        whatBroke:
            "Pings from PC1 to the ISP left and never came back. R1 had its default route, R2 had its default route, and a traceroute from R1 itself reached 203.0.113.1 fine — so the path outbound was correct and I assumed the problem was upstream.",
        howIFixedIt:
            "It was the return path. R2 had no idea 192.168.10.0/24 existed, so replies were being handed to its own default route and sent out to the internet. Three static routes back toward R1 fixed it. Debugging from the router hid the problem because R1 was sourcing from an interface R2 already knew.",
        takeaway:
            "Routing is not symmetric unless you make it symmetric. Test from the host, not the router — and when traffic leaves but never returns, the missing route is on the far end.",
    },
    {
        id: "03",
        slug: "03-ospf-single-area",
        title: "OSPF single-area, replacing the static routes",
        date: "2026-08-19",
        topics: ["OSPF", "Area 0", "Router-ID", "Passive interfaces"],
        objective:
            "Replace every static route from lab 02 with single-area OSPF, originate a default route from R2, and watch the two routers form an adjacency.",
        topologyAscii,
        config: `! ---- R1 ----
interface Loopback0
 ip address 1.1.1.1 255.255.255.255
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
! ---- R2 ----
interface Loopback0
 ip address 2.2.2.2 255.255.255.255
!
router ospf 1
 router-id 2.2.2.2
 network 10.0.0.0 0.0.0.3 area 0
 default-information originate
!
ip route 0.0.0.0 0.0.0.0 203.0.113.1`,
        verification: `R1# show ip ospf neighbor
Neighbor ID   Pri  State     Dead Time  Address    Interface
2.2.2.2         1  FULL/DR   00:00:34   10.0.0.2   GigabitEthernet0/1

R1# show ip route ospf
O*E2  0.0.0.0/0 [110/1] via 10.0.0.2, 3w2d, GigabitEthernet0/1
O     2.2.2.2/32 [110/2] via 10.0.0.2, 3w2d, GigabitEthernet0/1`,
        whatBroke:
            "The adjacency stalled in EXSTART and flapped between EXSTART and DOWN every 40 seconds. Both routers could ping each other across 10.0.0.0/30, the network statements matched, and area 0 was area 0 on both sides.",
        howIFixedIt:
            "MTU mismatch. I'd set `ip mtu 1400` on R1's Gi0/1 during an earlier experiment and forgotten it. OSPF checks MTU during database exchange, which is exactly why it dies in EXSTART rather than failing to see the neighbour at all. `show ip ospf interface` printed both values side by side and the fix was one line. The stuck-state-tells-you-the-stage insight was worth more than the fix.",
        takeaway:
            "OSPF's stuck state names the problem. INIT means hellos are one-way, 2WAY-on-a-p2p-link points at a DR/priority issue, and EXSTART/EXCHANGE is almost always MTU or a duplicate router-ID.",
    },
    {
        id: "04",
        slug: "04-acl-standard",
        title: "Standard ACLs — locking management down to one VLAN",
        date: "2026-08-26",
        topics: ["ACL", "Standard ACL", "Wildcard mask", "VTY access-class"],
        objective:
            "Allow SSH to R1's VTY lines only from the Mgmt VLAN, and stop the Users VLAN from reaching the Servers VLAN, without breaking internet access for either.",
        topologyAscii,
        config: `! ---- R1: management access ----
ip access-list standard MGMT-ONLY
 permit 192.168.30.0 0.0.0.255
 deny   any log
!
line vty 0 4
 access-class MGMT-ONLY in
 login local
 transport input ssh
!
! ---- R1: keep Users out of Servers ----
ip access-list extended USERS-RESTRICT
 deny ip 192.168.10.0 0.0.0.255 192.168.20.0 0.0.0.255
 permit ip any any
!
interface GigabitEthernet0/0.10
 ip access-group USERS-RESTRICT in`,
        verification: `R1# show access-lists
Standard IP access list MGMT-ONLY
    10 permit 192.168.30.0, wildcard bits 0.0.0.255 (4 matches)
    20 deny   any log (2 matches)

PC1> ping 192.168.20.10
Reply from 192.168.10.1: Destination host unreachable.

PC1> ping 8.8.8.8
Reply from 8.8.8.8: bytes=32 time=14ms TTL=52`,
        whatBroke:
            "My first attempt was a standard ACL applied inbound on Gi0/0.10 to block traffic to the Servers VLAN. It killed everything from the Users VLAN — no internet, no gateway, nothing. Reverting restored service, which told me the ACL was the cause but not why.",
        howIFixedIt:
            "A standard ACL only matches source addresses, so `deny 192.168.10.0 0.0.0.255` denied every packet from that VLAN regardless of where it was going. Blocking one source-destination pair needs an extended ACL. I also had the implicit `deny any` working against me — the `permit ip any any` at the end is what keeps internet access alive.",
        takeaway:
            "Standard ACLs match source only, so place them close to the destination; extended ACLs match both, so place them close to the source. And every ACL ends in an invisible `deny any` — if traffic you never mentioned stops working, that's what stopped it.",
    },
    {
        id: "05",
        slug: "05-nat-pat",
        title: "NAT and PAT — many private hosts, one public address",
        date: "2026-09-02",
        topics: ["NAT", "PAT", "Overload", "inside/outside"],
        objective:
            "Translate both internal VLANs to R2's single public address on Gi0/1 and read the translation table well enough to explain what's happening to someone else.",
        topologyAscii,
        config: `! ---- R2 ----
interface GigabitEthernet0/0
 description P2P to R1
 ip nat inside
!
interface GigabitEthernet0/1
 description ISP uplink
 ip nat outside
!
ip access-list standard NAT-ACL
 permit 192.168.10.0 0.0.0.255
 permit 192.168.20.0 0.0.0.255
!
ip nat inside source list NAT-ACL interface GigabitEthernet0/1 overload`,
        verification: `R2# show ip nat translations
Pro  Inside global        Inside local         Outside local     Outside global
tcp  203.0.113.2:1034     192.168.10.10:1034   93.184.216.34:80  93.184.216.34:80
tcp  203.0.113.2:1035     192.168.20.10:1035   93.184.216.34:80  93.184.216.34:80

R2# show ip nat statistics
Total active translations: 2 (0 static, 2 dynamic; 2 extended)
Hits: 184  Misses: 2`,
        whatBroke:
            "`show ip nat translations` was empty and nothing from the VLANs reached the internet, even though the ACL matched and the NAT statement looked right. `show ip nat statistics` showed zero hits, so packets weren't even being considered for translation.",
        howIFixedIt:
            "I'd marked Gi0/1 as `ip nat outside` but never marked Gi0/0 as `ip nat inside` — NAT only translates traffic crossing an inside-to-outside boundary, and with one side unmarked there was no boundary. One line on Gi0/0 and translations appeared immediately. The zero-hits counter was the clue I should have read first.",
        takeaway:
            "NAT needs both sides declared; it's a boundary, not a filter. And `show ip nat statistics` distinguishes 'my rule doesn't match' from 'my rule never ran' — hits versus misses is the first thing to check.",
    },
];

export const labTopics = [...new Set(labs.flatMap((l) => l.topics))].sort();

/** @param {string} slug */
export function getLab(slug) {
    return labs.find((l) => l.slug === slug || l.id === slug) ?? null;
}
