# Sijo M Peter · portfolio

Live: https://sijompeter.github.io/portfolio/

GitHub Pages serves the `docs/` folder on `main`. **Whatever is in `docs/` on
`main` is the live site**, so the main link always shows the latest version.

```
docs/
  index.html                 home
  work/fresh-journey.html    case study: The webinar experience, rebuilt as a mobile app
  assets/v2/                 logo, favicons, share image, portrait, footer graphic
  about.html, contact.html,
  experience.html            old addresses, forwarding to the matching home section
  work/{keystone,direct-purchase,audio-rooms}.html, v1/, v2/
                             old addresses, forwarding to the home page
```

## Version history

Old versions are not on the website. They are saved as branches, so nothing is ever lost:

| Saved version (branch) | What it is |
|---|---|
| `version-1` | the original site, before the redesign |
| `version-2-launch` | the first launch of the redesign |
| `release-2026-11-05` | the current site |

See every saved version: `git branch -r`

## Restoring an older version

Put any saved version back on the live site (one commit, fully reversible):

```sh
git checkout main && git pull
git fetch origin
git checkout origin/version-1 -- docs   # or any branch from `git branch -r`
git commit -m "Restore version-1" && git push
```

Undo that and return to the latest:

```sh
git revert --no-edit HEAD && git push
```

GitHub Pages republishes within a minute or two after each push.

## Saving a new version

After publishing an update, save it as a branch so it can be restored later:

```sh
git branch release-YYYY-MM-DD && git push origin release-YYYY-MM-DD
```
