import { Helmet } from "react-helmet-async";
import { profile } from "../../data/profile";

const SITE = profile.name;
const BASE_DESCRIPTION = profile.tagline;

/**
 * Per-route meta (§9 Phase 3). Title falls back to the site name so a
 * route that forgets to pass one still gets something sensible.
 *
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.path]      canonical path, e.g. '/projects'
 * @param {boolean} [props.noIndex]
 */
export default function Seo({ title, description, path, noIndex = false }) {
  const fullTitle = title ? `${title} — ${SITE}` : `${SITE} — ${profile.role}`;
  const desc = description ?? BASE_DESCRIPTION;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {path && <meta property="og:url" content={path} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {noIndex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
}
