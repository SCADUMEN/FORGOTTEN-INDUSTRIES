// The CxR dossier: what the instrument itself is and does, as an expandable
// disclosure beside the CONTINUANCE persona dossier. This is the canonical,
// user-facing record of CxR's capabilities - important feature changes should
// be reflected here (see CLAUDE.md) so the dossier never drifts from what ships.
export default function CxrDossier() {
  return (
    <details className="continuance-dossier">
      <summary>
        The <span className="cxr-brand">CxR</span> dossier
      </summary>

      <div className="continuance-dossier-body">
        <p>
          CxR (CONTINUANCExRESEARCH) is the research instrument that carries the
          CONTINUANCE persona: a surface for searching and cross-referencing
          archive sources two at a time. The work continues.
        </p>

        <h2 className="section-label">&gt; How it works</h2>
        <ul>
          <li>Pick a data source for each of the two columns.</li>
          <li>One search box queries both sources at once.</li>
          <li>
            Select any result to anchor it; the centre panel cross-references
            that anchor against the other column&rsquo;s source, ranked by
            shared terms and tags.
          </li>
          <li>
            Changing the opposite column re-scores the cross-reference; changing
            the anchor&rsquo;s own column clears it.
          </li>
        </ul>

        <h2 className="section-label">&gt; Sources</h2>
        <ul>
          <li>The Forgotten Industries archive.</li>
          <li>
            Northern Information (
            <a href="https://nor.the-rn.info" target="_blank" rel="noopener">
              nor.the-rn.info
            </a>
            ), via its published JSON feed.
          </li>
          <li>
            Any pasted URL &mdash; a JSON Feed, a JSON document, or a web page
            &mdash; fetched through a CORS proxy and indexed live in the
            browser.
          </li>
        </ul>

        <h2 className="section-label">&gt; URLs</h2>
        <p>
          The URL source is the sharp edge: paste any URL and CxR fetches it
          live (through the CORS proxy), reads it &mdash; a JSON Feed, a JSON
          document, or a plain web page &mdash; and cross-references it against
          the other column. A few to try:
        </p>
        <ul className="continuance-dossier-urls">
          <li>
            <a
              href="https://arxiv.org/abs/2607.13309"
              target="_blank"
              rel="noopener"
            >
              https://arxiv.org/abs/2607.13309
            </a>
          </li>
          <li>
            <a
              href="https://brainwashed.com/godspeed/deadmetheney/monologues/hungover.htm"
              target="_blank"
              rel="noopener"
            >
              https://brainwashed.com/godspeed/deadmetheney/monologues/hungover.htm
            </a>
          </li>
          <li>
            <a
              href="https://en.wikipedia.org/wiki/Stuxnet"
              target="_blank"
              rel="noopener"
            >
              https://en.wikipedia.org/wiki/Stuxnet
            </a>
          </li>
        </ul>

        <h2 className="section-label">&gt; Bookmarks</h2>
        <ul>
          <li>
            Save a whole cross-reference &mdash; the anchored post, both column
            sources, and the query &mdash; from the cross-reference panel.
          </li>
          <li>
            Recall it later from the chip bar to restore that exact
            configuration.
          </li>
        </ul>

        <h2 className="section-label">&gt; State</h2>
        <p>
          Source selections, the query, pasted URLs, and bookmarks persist in
          the browser (localStorage) across sessions. The only requests that
          reach a server are URL-source fetches, each proxied to retrieve the
          page &mdash; no state is ever saved server-side.
        </p>
      </div>
    </details>
  )
}
