---
"@opennextjs/aws": patch
---

fix: stale fetch cache entries without `next.revalidate` are now refreshed after `revalidateTag(tag, "max")`
