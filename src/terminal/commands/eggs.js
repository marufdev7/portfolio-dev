// ---------------------------------------------------------------
// Easter eggs (§6.8).
//
// Hidden from `help` so finding one feels like finding something.
// `help --all` reveals them for anyone who'd rather just read the list.
//
// The rule they all follow: an egg can be silly, but it can't lie about
// networking. `handshake` prints the real flag sequence; `ttl` explains
// what TTL actually does. A joke that teaches nothing is just noise.
// ---------------------------------------------------------------

import * as out from "../output";
import { profile } from "../../data/profile";

const egg = (definition) => ({ category: "fun", hidden: true, ...definition });

/* ------------------------------------------------------------------
   sudo
   ------------------------------------------------------------------ */

const sudo = egg({
  name: "sudo",
  usage: "sudo <command>",
  description: "Nice try.",

  run(ctx, { args }) {
    if (args.join(" ").toLowerCase().includes("rm -rf")) {
      return [
        out.error("nope."),
        out.muted("I've seen what happens. Twice."),
      ];
    }
    return [
      out.error(`${ctx.env.USER} is not in the sudoers file. This incident has been reported.`),
      out.muted("(reported to me. I'm flattered.)"),
    ];
  },
});

/* ------------------------------------------------------------------
   handshake — the one egg that's genuinely a teaching aid
   ------------------------------------------------------------------ */

const handshake = egg({
  name: "handshake",
  aliases: ["tcp"],
  usage: "handshake",
  description: "Watch a TCP three-way handshake, flag by flag.",

  async run(ctx) {
    const steps = [
      { line: "client ──  SYN  seq=0            ──▶ server", note: "client picks an ISN and asks to open" },
      { line: "client ◀── SYN-ACK seq=0 ack=1   ──  server", note: "server acknowledges and sends its own ISN" },
      { line: "client ──  ACK  seq=1 ack=1      ──▶ server", note: "client acknowledges — connection ESTABLISHED" },
    ];

    for (const step of steps) {
      await ctx.sleep(650);
      ctx.print(out.success(`  ${step.line}`));
      ctx.print(out.muted(`     ${step.note}`));
    }

    await ctx.sleep(500);
    return [
      out.blank(),
      out.text("  ESTABLISHED"),
      out.blank(),
      out.muted(
        "Teardown takes four: FIN, ACK, FIN, ACK — each direction closes independently, " +
          "which is why you can still receive after you've stopped sending."
      ),
    ];
  },
});

/* ------------------------------------------------------------------
   ttl
   ------------------------------------------------------------------ */

const ttl = egg({
  name: "ttl",
  usage: "ttl [value]",
  description: "What TTL is actually for.",

  run(ctx, { args }) {
    const value = Number(args[0]);
    if (Number.isInteger(value) && value > 0 && value <= 255) {
      const start = value > 128 ? 255 : value > 64 ? 128 : 64;
      return [
        out.text(`TTL ${value}`),
        out.muted(
          `Almost certainly started at ${start} — that's ${start - value} hop${start - value === 1 ? "" : "s"} away.`
        ),
        out.blank(),
        out.muted("Linux and IOS start at 64 and 255; Windows starts at 128. Guessing the origin is a party trick that occasionally solves a real problem."),
      ];
    }

    return [
      out.text("Time To Live: a hop counter, not a timer."),
      out.muted(
        "Every router decrements it by one. At zero the packet is dropped and an ICMP Time Exceeded goes back to the sender — " +
          "which is the entire mechanism traceroute is built on."
      ),
      out.blank(),
      out.muted("`ttl 61` to work out how far away something is."),
    ];
  },
});

/* ------------------------------------------------------------------
   matrix / hack — deliberately brief
   ------------------------------------------------------------------ */

const matrix = egg({
  name: "matrix",
  usage: "matrix",
  description: "Rain, briefly.",

  async run(ctx) {
    const charset = "01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ";
    const width = 46;

    for (let row = 0; row < 10; row++) {
      await ctx.sleep(90);
      const line = Array.from({ length: width }, () =>
        Math.random() > 0.55 ? charset[Math.floor(Math.random() * charset.length)] : " "
      ).join("");
      ctx.print(out.success(line));
    }

    return [out.blank(), out.muted("That's enough of that.")];
  },
});

const hack = egg({
  name: "hack",
  aliases: ["nmap", "exploit"],
  usage: "hack [target]",
  description: "Not that kind of terminal.",

  async run(ctx, { args }) {
    const target = args[0] ?? "the mainframe";
    const stages = [
      "scanning ports…",
      "bypassing firewall…",
      "escalating privileges…",
    ];

    for (const stage of stages) {
      await ctx.sleep(420);
      ctx.print(out.warn(`  ${stage}`));
    }

    await ctx.sleep(500);
    return [
      out.blank(),
      out.error(`  access denied — ${target} is a fixed JSON file in this repo`),
      out.blank(),
      out.muted(
        "Everything this terminal knows about networking is in src/data/labTopology.js. " +
          "There's nothing behind it to break into, which is a good property for a portfolio to have."
      ),
    ];
  },
});

/* ------------------------------------------------------------------
   coffee / cowsay / fortune
   ------------------------------------------------------------------ */

const coffee = egg({
  name: "coffee",
  aliases: ["brew"],
  usage: "coffee",
  description: "418.",

  run() {
    return [
      out.ascii(
        [
          "      (  )   (   )  )",
          "       ) (   )  (  (",
          "       ( )  (    ) )",
          "       _____________",
          "      <_____________> ___",
          "      |             |/ _ \\",
          "      |               | | |",
          "      |               |_| |",
          "   ___|             |\\___/",
          "  /    \\___________/    \\",
          "  \\_____________________/",
        ].join("\n")
      ),
      out.blank(),
      out.error("418 I'm a teapot"),
      out.muted("A real status code (RFC 2324). Some standards are load-bearing jokes."),
    ];
  },
});

const cowsay = egg({
  name: "cowsay",
  usage: "cowsay <message>",
  description: "Moo.",

  run(ctx, { args, raw }) {
    const message = args.length ? args.join(" ") : "subnet it";
    const width = Math.min(message.length, 40);
    const top = ` ${"_".repeat(width + 2)}`;
    const bottom = ` ${"-".repeat(width + 2)}`;

    return out.ascii(
      [
        top,
        `< ${message} >`,
        bottom,
        "        \\   ^__^",
        "         \\  (oo)\\_______",
        "            (__)\\       )\\/\\",
        "                ||----w |",
        "                ||     ||",
      ].join("\n")
    );
  },
});

const FORTUNES = [
  "It's always DNS. Until it's MTU.",
  "The cable is plugged in. Check again.",
  "up/down is layer 2. down/down is layer 1. Learn the difference once, save an hour a week.",
  "Every VLAN problem is a native VLAN problem until proven otherwise.",
  "If it works one way and not the other, you're missing a return route.",
  "A /30 for a point-to-point link wastes two addresses. A /31 wastes none. Nobody uses /31.",
  "Documentation you didn't write is a rumour.",
  "The bug is in the last place you'd look, because you stop looking after you find it.",
  "Ship the boring version first.",
];

const fortune = egg({
  name: "fortune",
  usage: "fortune",
  description: "Something I've learned the hard way.",

  run() {
    return out.text(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
  },
});

/* ------------------------------------------------------------------
   sl / konami / whoareyou
   ------------------------------------------------------------------ */

const sl = egg({
  name: "sl",
  usage: "sl",
  description: "You meant `ls`.",

  async run(ctx) {
    const train = [
      "      ====        ________                ___________",
      "  _D _|  |_______/        \\__I_I_____===__|_________|",
      "   |(_)---  |   H\\________/ |   |        =|___ ___|  ",
      "   /     |  |   H  |  |     |   |         ||_| |_||  ",
      "  |      |  |   H  |__--------------------| [___] |  ",
      "  | ________|___H__/__|_____/[][]~\\_______|       |  ",
      "  |/ |   |-----------I_____I [][] []  D   |=======|__",
    ];

    for (const line of train) {
      await ctx.sleep(70);
      ctx.print(out.ascii(line));
    }
    return out.muted("You typed `sl`. It happens to everyone.");
  },
});

const konami = egg({
  name: "konami",
  aliases: ["xyzzy"],
  usage: "konami",
  description: "↑↑↓↓←→←→BA",

  run() {
    return [
      out.success("30 lives granted."),
      out.muted("They will not help you with subnetting."),
    ];
  },
});

const whoareyou = egg({
  name: "whoareyou",
  aliases: ["hello", "hi"],
  usage: "hello",
  description: "Say hi.",

  run(ctx) {
    return [
      out.text(`Hey. I'm ${profile.firstName}.`),
      out.muted(profile.positioning),
      out.blank(),
      out.muted("`help` if you want the tour, `about` if you want the story."),
    ];
  },
});

export default [
  sudo,
  handshake,
  ttl,
  matrix,
  hack,
  coffee,
  cowsay,
  fortune,
  sl,
  konami,
  whoareyou,
];
