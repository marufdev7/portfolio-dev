import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Seo from "../components/layout/Seo";
import PageShell from "../components/layout/PageShell";
import Tag from "../components/ui/Tag";
import Reveal from "../components/ui/Reveal";
import LabCard from "../components/network/LabCard";
import { labTopics, labs } from "../data/labs";
import { scrollToHash } from "../lib/scroll";

/* ---------------------------------------------------------------
   The lab log (§7). Filter state lives in the URL like /projects, so
   `?topic=OSPF` is shareable and the back button undoes it.

   The deep-link effect exists because this route is lazy: by the time
   the chunk mounts, ScrollToTop has already looked for `#02-static-
   routing` and found nothing. Re-running it here is what makes a link
   from /network land on the right card.

   It runs on mount only. ScrollToTop owns every later hash change —
   the element exists by then, and re-running this would cut its smooth
   pan short with a jump.
   --------------------------------------------------------------- */

export default function NetworkLabs() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const active = params.get("topic");

  const visible = active ? labs.filter((lab) => lab.topics.includes(active)) : labs;

  const deepLink = useRef(hash);
  useEffect(() => {
    if (deepLink.current) scrollToHash(deepLink.current, { smooth: false });
  }, []);

  const setTopic = (topic) => {
    const next = new URLSearchParams(params);
    if (topic === active || topic === null) next.delete("topic");
    else next.set("topic", topic);
    setParams(next, { replace: true });
  };

  return (
    <>
      <Seo
        title="Lab log"
        description="Five CCNA labs with the real IOS config, the verification output, and — the part that matters — what broke and how I fixed it."
        path="/network/labs"
      />

      <PageShell
        eyebrow="net / labs"
        title="Lab log"
        lead="Every lab here was built in Packet Tracer and every one of them broke first. The config and the show output are collapsed; what broke is not, because that's the part worth reading."
        tone="net"
        grid
      >
        <div className="mt-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 font-mono text-xs tracking-widest text-faint">TOPIC</span>
            <Tag tone="net" active={!active} onClick={() => setTopic(null)}>
              All
            </Tag>
            {labTopics.map((topic) => (
              <Tag
                key={topic}
                tone="net"
                active={topic === active}
                onClick={() => setTopic(topic)}
              >
                {topic}
              </Tag>
            ))}
          </div>

          <p aria-live="polite" className="mt-4 text-sm text-muted">
            {visible.length} {visible.length === 1 ? "lab" : "labs"}
            {active ? ` covering ${active}` : ""}
          </p>

          <div className="mt-8 space-y-6">
            {visible.map((lab, i) => (
              <Reveal key={lab.slug} delay={i * 0.05}>
                <LabCard lab={lab} />
              </Reveal>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-8 text-muted">
              No lab covers {active} yet.{" "}
              <button
                type="button"
                onClick={() => setTopic(null)}
                className="text-net hover:underline"
              >
                Clear the filter
              </button>
              .
            </p>
          )}
        </div>
      </PageShell>
    </>
  );
}
