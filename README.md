# Sijo M Peter · portfolio

Live: https://sijompeter.github.io/portfolio/

GitHub Pages serves the `docs/` folder on `main`.

## Versions

| Version | Where it lives | URL |
|---|---|---|
| **V2** (live by default) | `docs/v2/` | https://sijompeter.github.io/portfolio/v2/ |
| V1 (archived, still online) | `docs/v1/`, tag `v1`, branch `version-1` | https://sijompeter.github.io/portfolio/v1/ |

`https://sijompeter.github.io/portfolio/` forwards to `/v2/` and carries V2's
share image, so links to the main address still preview and land correctly.

```
docs/
  index.html                 forwards to v2/ (keeps any #section)
  about.html, contact.html,
  experience.html            old V1 URLs, forwarding to the matching V2 section
  work/fresh-journey.html    forwards to v2/work/fresh-journey.html
  work/{keystone,direct-purchase,audio-rooms}.html
                             old V1 case study URLs, forwarding to v1/work/
  v2/                        the V2 site (index.html, work/, assets/v2/)
  v1/                        the complete V1 site (noindex)
```

**Change which version the main address opens:** edit the three `v2/`
targets in `docs/index.html` (canonical, refresh and `location.replace`)
to `v1/`, commit and push. Both versions stay online either way.

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
