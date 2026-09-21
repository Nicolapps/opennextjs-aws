---
"@opennextjs/aws": patch
---

fix: `patchBackgroundRevalidation` no longer applied to recent versions of Next.js, stale ISR pages were regenerated twice

The patch now matches the expression whatever the names of the variables are, and is also applied to the compiled runtime bundles of Next.js (`next/dist/compiled/next-server/*.runtime.prod.js`), which have their own copy of the response cache.
