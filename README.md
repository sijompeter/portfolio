# Sijo M Peter · portfolio

Live: https://sijompeter.github.io/portfolio/

GitHub Pages serves the `docs/` folder on `main`.

## Versions

| Version | Where it lives | URL |
|---|---|---|
| **V2** (live by default) | `docs/` | https://sijompeter.github.io/portfolio/ |
| V1 (archived, still online) | `docs/v1/`, tag `v1`, branch `version-1` | https://sijompeter.github.io/portfolio/v1/ |

```
docs/
  index.html                 V2 home
  work/fresh-journey.html    V2 case study: The webinar experience, rebuilt as a mobile app
  work/*.html                old V1 case study URLs, forwarding to docs/v1/work/
  about.html, contact.html,
  experience.html            old V1 URLs, forwarding to the matching V2 section
  assets/v2/                 logo, favicons, share image, portrait, footer graphic
  v1/                        the complete V1 site, untouched apart from noindex
                             and its own share image path
```

Old links people already have keep working: V1 case study URLs forward to their
archived copies, and V1 page URLs forward to the matching V2 section.

## Rolling back

You never lose V1. It is always viewable at `/v1/`, and the exact pre-V2 state
is saved as the tag `v1` and the branch `version-1`.

**Make V1 the live site again** (one commit, fully reversible):

```sh
git checkout main && git pull
git revert --no-edit v1..HEAD   # undoes every V2 commit, newest first
git push
```

**Bring V2 back** after a rollback:

```sh
git revert --no-edit HEAD~N..HEAD   # N = number of revert commits the rollback made (2 today)
git push
```

GitHub Pages republishes within a minute or two after each push.

## Editing V2

V2 is generated from a small build (source in the session that produced it):
shared `base.css`/`base.js`, the home template and the case study template.
The pages in `docs/` are self-contained HTML, so small text fixes can also be
made directly in `docs/index.html` and `docs/work/fresh-journey.html`.
