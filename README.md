# Justin Varghese John — Portfolio

A lightweight, responsive portfolio for robotics research and engineering. Plain HTML, CSS, and JavaScript, with no third-party scripts, web fonts, analytics, or runtime packages. The contact form uses the owner's existing Formspree endpoint.

## Preview and check

Serve the repository using any local static HTTP server, then open its address in a browser. Run `node --check script.js` and `node scripts/build.mjs` to validate references and create a publication-only `_site/` directory. The build uses Node.js built-ins and needs no package installation. The existing root `index.html` remains compatible with GitHub Pages publishing from `main` / root.

All six original projects, their substantive descriptions, all original skill categories, and twelve credentials are retained. Projects lead the page. The thesis is a compact research feature with optional evaluation details. Native disclosure controls work without JavaScript.

JavaScript adds filtering, live status announcements, optional clipboard copying, and coordinated SVG motion. Animations are conceptual explanations, not performance recordings. Motion has a global pause control, starts paused for reduced-motion preferences, and stops updating scenes outside the viewport or while the tab is hidden. Without JavaScript, illustrations remain static.

## Contact form

The original form at `https://formspree.io/f/xqapawaq` is restored. Standard HTML POST works without JavaScript; JavaScript adds a sending state and inline success/error messages. A failed or unconfirmed submission retains the visitor's text. Fields include name, email, topic, message, and a honeypot. No attachments or keys are embedded. The site's content-security policy permits requests and form submissions to Formspree while continuing to block third-party scripts.

Local verification intercepts test submissions and simulates success, rejection, rate limiting, and network failure without emailing the owner. Actual inbox delivery and account limits depend on the existing Formspree account. [Formspree submission documentation](https://formspree.io/blog/formspree-ajax/).

## Document privacy

The thesis PDF must never be copied into this repository, its history, a release, or a Pages artifact. The site contains a written research summary only. It does not reproduce thesis pages, figures, or attachments.

Résumé and credential links open a request email. This does not grant document access or send email automatically. Keep originals outside this repository. For private sharing, use a separate Google Drive folder with **General access: Restricted**, add individual recipients as **Viewer**, and check parent-folder access. Do not use “Anyone with the link” for confidential material. Downloads can still be copied or photographed by authorized viewers.

Public certificate scans and the old résumé were removed from the current tree. They may remain accessible through earlier Git commits, raw URLs, caches, or existing downloads. Removing a page link or adding `.gitignore` does not revoke those copies. A history rewrite is a separate disruptive operation and has not been performed.

References: [GitHub Pages publishing and public visibility](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Google Drive restricted sharing](https://support.google.com/drive/answer/7166529).

## Publishing safeguards

- `.gitignore` excludes common private documents, archives, keys, and environment files from routine additions. It is a convenience, not access control.
- The build rejects document/key formats, environment files, symlinks, unreviewed media, broken anchors, and legacy local paths.
- `_site/` contains only explicitly listed public files. If using an Actions-based Pages deployment, upload **only `_site/`**, never the whole repository.
- The validation workflow checks changes but does not change the existing Pages publishing configuration.
- GitHub Pages has no private-document backend. A client-side password, hidden URL, or `robots.txt` rule cannot protect a downloadable document.
- The content-security policy blocks third-party scripts and permits the existing Formspree connection for contact submissions. External profile links use `noopener noreferrer`.

## Content maintenance

Edit `index.html` for the biography, research, case studies, dates, and links. Edit `styles.css` for design and responsive behavior. Project diagrams are original conceptual SVG sketches, explicitly labeled; they are not experimental screenshots. The portrait is a compressed derivative of the existing public photograph.

The research metrics describe the supplied November 2026 thesis: three measured runs per implementation and domain, comparing complete configured pipelines. The timing differences include software and data-preparation changes; they are not isolated effects of clustering. The existing LAMP framework supplies the underlying planning approach. Degree completion remains “expected December 2026.”

Avoid adding unsupported performance numbers or suggesting a project has a public code repository when none is linked. The contact address and professional profile links were retained from existing portfolio materials.
