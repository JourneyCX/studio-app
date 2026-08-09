# CLAUDE.md — Stratum Studio (studio-app)

Studio is the Vite/React (Puck-based) visual page editor embedded in Stratum's Store Builder — the drag-and-drop UI merchants use to design storefront pages. It's served standalone at `studio.stratumengage.com` and loaded cross-origin in an iframe from the Stratum admin panel.

---

## Git workflow

This repo has a private GitHub remote: `git@github.com-studio-app:JourneyCX/studio-app.git` (origin, tracked by `master`), authenticated via a dedicated deploy key/SSH identity separate from the main stratum repo. **After making code changes in this repo, commit them and push to `origin/master` automatically — do not ask for confirmation before each push.** This standing instruction overrides the default "confirm before pushing" behavior specifically for this repository. Still write clear, descriptive commit messages, and still surface to the user what was committed/pushed.

**Pushing to GitHub does not deploy to production.** `studio.stratumengage.com` is a static nginx vhost serving `/www/wwwroot/studio-app/dist/` on the server — that server checkout is **not git-tracked**, so a deploy is a separate manual step (build locally, diff the server's live files against the pre-change baseline for drift, scp, backup, swap in, restore ownership/permissions). See the `reference_studio_app_deployment` memory for the exact procedure. Deploying to that production server is a distinct, higher-stakes action from pushing to GitHub — confirm with the user before doing it unless they've already asked for the deploy explicitly.
