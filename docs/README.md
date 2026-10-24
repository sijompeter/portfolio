# Sijo M Peter — portfolio

Senior Product Designer, Bangalore. Eleven years across fintech, proptech and
enterprise SaaS, mostly 0→1 and mostly as the only designer in the room.

**Live site:** https://sijompeter.github.io/portfolio/

## What this is

A static site, hand-built. No framework, no build step, no bundler — four HTML
pages, four case studies, one stylesheet and one script. GitHub Pages serves it
from the `docs/` folder on `main`.

```
index.html          home: the work, proof, fit, contact
about.html          the longer version
experience.html     eleven years, six roles
contact.html        four ways in
work/               the four case studies
assets/site.css     one stylesheet, light and dark
assets/site.js      navigation, theme, the case-study sheet, cursor
assets/logo/        the logo, the favicon and the share image
assets/img/         case-study screens and the portrait
assets/doc/         the résumé, as a PDF
```

GSAP, ScrollTrigger and Lenis are loaded from a CDN; everything else is here.

## The logo

`sijo-full.svg` and `sijo-symbol.svg` are the two the site uses. Their
letterforms are `fill="currentColor"`, so each takes the colour of whatever it
sits on; the dot stays brand lime `#C5EF35` in every case. That is why there is
no light/dark switching logic anywhere: the dark footer inside the light theme
gets a white mark automatically.

The four files as delivered (`*-logo-dark.svg`, `*-logo-light.svg`) are kept
here unchanged for use outside this site.

`favicon.svg` carries its own `prefers-color-scheme` rule so the tab mark flips
with the browser's theme. It is inlined into each page as a data URI, because
the case-study overlay rewrites the URL and a relative icon path would be
re-resolved against the new path.

`og-image.png` (1200×630) is the card shown when the link is shared.

## Analytics

Microsoft Clarity (project `z2o1cdt5c8`) is in the `<head>` of every page:
heatmaps, session recordings, and traffic by device, browser, country and
referrer. It records anonymous sessions, not identities.

`assets/site.js` also fires named Clarity events so the things worth counting
are filterable: `resume_download`, `contact_whatsapp`, `contact_email`,
`contact_phone`, `visit_linkedin`, `visit_dribbble`, `visit_medium`,
`case_open_01`…`case_open_04`, and `reached_footer`.

## Contact

- WhatsApp / phone: +91 94477 84143
- Email: sijompeter@gmail.com
- LinkedIn: https://www.linkedin.com/in/sillysijo/
- Dribbble: https://dribbble.com/sillysijo
- Medium: https://medium.com/@sijompeter

© 2026 Sijo M Peter. The case-study content and images are mine; please don't
reuse them as your own work.
