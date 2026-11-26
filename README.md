# Justin Varghese John — Portfolio

A lightweight, responsive portfolio for robotics research and engineering. Plain HTML, CSS, and JavaScript, with no third-party scripts, web fonts, analytics, forms, or runtime dependencies.

## Preview and check

Serve the repository using any local static HTTP server, then open its address in a browser. Run `node --check script.js` and `node scripts/build.mjs` to validate references and create a publication-only `_site/` directory. The build uses Node.js built-ins and needs no package installation. The existing root `index.html` remains compatible with GitHub Pages publishing from `main` / root.

Projects and research remain readable without JavaScript. Native disclosure controls support keyboard access; JavaScript adds filtering, live status announcements, and optional clipboard copying. Reduced-motion preferences are respected.

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
- The content-security policy blocks third-party scripts and connections. External profile links use `noopener noreferrer`.

## Content maintenance

Edit `index.html` for the biography, research, case studies, dates, and links. Edit `styles.css` for design and responsive behavior. Project diagrams are original conceptual SVG sketches, explicitly labeled; they are not experimental screenshots. The portrait is a compressed derivative of the existing public photograph.

The research metrics describe the supplied November 2026 thesis: three measured runs per implementation and domain, comparing complete configured pipelines. The timing differences include software and data-preparation changes; they are not isolated effects of clustering. The existing LAMP framework supplies the underlying planning approach. Degree completion remains “expected December 2026.”

Avoid adding unsupported performance numbers or suggesting a project has a public code repository when none is linked. The contact address and professional profile links were retained from existing portfolio materials.
