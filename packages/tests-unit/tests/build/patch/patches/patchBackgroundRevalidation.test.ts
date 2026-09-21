import {
  applyRule,
  parseCode,
  patchCode,
} from "@opennextjs/aws/build/patch/astCodePatcher.js";
import {
  pathFilter,
  rule,
} from "@opennextjs/aws/build/patch/patches/patchBackgroundRevalidation.js";
import { describe, it } from "vitest";

const codeToPatch = `if (cachedResponse && !isOnDemandRevalidate) {
                    var _cachedResponse_value;
                    if (((_cachedResponse_value = cachedResponse.value) == null ? void 0 : _cachedResponse_value.kind) === _types.CachedRouteKind.FETCH) {
                        throw new Error(\`invariant: unexpected cachedResponse of kind fetch in response cache\`);
                    }
                    resolve({
                        ...cachedResponse,
                        revalidate: cachedResponse.curRevalidate
                    });
                    resolved = true;
                    if (!cachedResponse.isStale || context.isPrefetch) {
                        // The cached value is still valid, so we don't need
                        // to update it yet.
                        return null;
                    }
                }`;

// From Next 16.3 (the variable was renamed in Next 16.0)
const next16CodeToPatch = `if (previousIncrementalCacheEntry && !context.isOnDemandRevalidate && previousIncrementalCacheEntry.isStale !== -1) {
                resolve(previousIncrementalCacheEntry);
                resolved = true;
                if (!previousIncrementalCacheEntry.isStale || context.isPrefetch) {
                    // The cached value is still valid, so we don't need to update it yet.
                    return previousIncrementalCacheEntry;
                }
            }`;

// `ResponseCache.handleGet` as found in the compiled runtime bundles (`next/dist/compiled/next-server/*.runtime.prod.js`)
const minifiedCode = {
  "next@16.3.5 pages.runtime.prod.js":
    'class ResponseCache{async handleGet(e,t,r,n){let a=null,i=!1;try{if((a=this.minimal_mode?null:await r.incrementalCache.get(e,{kind:function(e){switch(e){case tt.PAGES:return eL.PAGES;case tt.APP_PAGE:return eL.APP_PAGE;case tt.IMAGE:return eL.IMAGE;case tt.APP_ROUTE:return eL.APP_ROUTE;case tt.PAGES_API:throw Object.defineProperty(Error(`Unexpected route kind ${e}`),"__NEXT_ERROR_CODE",{value:"E64",enumerable:!1,configurable:!0});default:return e}}(r.routeKind),isRoutePPREnabled:r.isRoutePPREnabled,isFallback:r.isFallback}))&&!r.isOnDemandRevalidate&&-1!==a.isStale&&(n(a),i=!0,!a.isStale||r.isPrefetch))return a;let s=r.isPrefetch&&null===a?await this.handleRevalidate(e,r.incrementalCache,r.isRoutePPREnabled,r.isFallback,t,a,i):await this.revalidate(e,r.incrementalCache,r.isRoutePPREnabled,r.isFallback,t,a,i);if(!s){if(this.minimal_mode){let t=tl(e,r.invocationID);this.cache.remove(t)}return null}return r.isOnDemandRevalidate,s}catch(e){if(i)return console.error(e),null;throw e}}}',
  "next@16.3.5 app-page.runtime.prod.js":
    'class ResponseCache{async handleGet(e,t,r,n){let a=null,i=!1;try{if((a=this.minimal_mode?null:await r.incrementalCache.get(e,{kind:function(e){switch(e){case nd.PAGES:return nc.PAGES;case nd.APP_PAGE:return nc.APP_PAGE;case nd.IMAGE:return nc.IMAGE;case nd.APP_ROUTE:return nc.APP_ROUTE;case nd.PAGES_API:throw Object.defineProperty(Error(`Unexpected route kind ${e}`),"__NEXT_ERROR_CODE",{value:"E64",enumerable:!1,configurable:!0});default:return e}}(r.routeKind),isRoutePPREnabled:r.isRoutePPREnabled,isFallback:r.isFallback}))&&!r.isOnDemandRevalidate&&-1!==a.isStale&&(n(a),i=!0,!a.isStale||r.isPrefetch))return a;let s=r.isPrefetch&&null===a?await this.handleRevalidate(e,r.incrementalCache,r.isRoutePPREnabled,r.isFallback,t,a,i):await this.revalidate(e,r.incrementalCache,r.isRoutePPREnabled,r.isFallback,t,a,i);if(!s){if(this.minimal_mode){let t=nv(e,r.invocationID);this.cache.remove(t)}return null}return r.isOnDemandRevalidate,s}catch(e){if(i)return console.error(e),null;throw e}}}',
  "next@15.5.24 pages.runtime.prod.js":
    'class ResponseCache{async handleGet(e,t,r,n){let i=null,a=!1;try{if((i=this.minimal_mode?null:await r.incrementalCache.get(e,{kind:function(e){switch(e){case e0.PAGES:return eA.PAGES;case e0.APP_PAGE:return eA.APP_PAGE;case e0.IMAGE:return eA.IMAGE;case e0.APP_ROUTE:return eA.APP_ROUTE;case e0.PAGES_API:throw Object.defineProperty(Error(`Unexpected route kind ${e}`),"__NEXT_ERROR_CODE",{value:"E64",enumerable:!1,configurable:!0});default:return e}}(r.routeKind),isRoutePPREnabled:r.isRoutePPREnabled,isFallback:r.isFallback}))&&!r.isOnDemandRevalidate&&(n(i),a=!0,!i.isStale||r.isPrefetch))return i;let o=await this.revalidate(e,r.incrementalCache,r.isRoutePPREnabled,r.isFallback,t,i,null!==i&&!r.isOnDemandRevalidate,void 0,r.invocationID);if(!o){if(this.minimal_mode){let t=e6(e,r.invocationID);this.cache.remove(t)}return null}return r.isOnDemandRevalidate,o}catch(e){if(a)return console.error(e),null;throw e}}}',
  "next@15.5.24 app-page.runtime.prod.js":
    'class ResponseCache{async handleGet(e,t,r,n){let i=null,a=!1;try{if((i=this.minimal_mode?null:await r.incrementalCache.get(e,{kind:function(e){switch(e){case rC.PAGES:return rx.PAGES;case rC.APP_PAGE:return rx.APP_PAGE;case rC.IMAGE:return rx.IMAGE;case rC.APP_ROUTE:return rx.APP_ROUTE;case rC.PAGES_API:throw Object.defineProperty(Error(`Unexpected route kind ${e}`),"__NEXT_ERROR_CODE",{value:"E64",enumerable:!1,configurable:!0});default:return e}}(r.routeKind),isRoutePPREnabled:r.isRoutePPREnabled,isFallback:r.isFallback}))&&!r.isOnDemandRevalidate&&(n(i),a=!0,!i.isStale||r.isPrefetch))return i;let s=await this.revalidate(e,r.incrementalCache,r.isRoutePPREnabled,r.isFallback,t,i,null!==i&&!r.isOnDemandRevalidate,void 0,r.invocationID);if(!s){if(this.minimal_mode){let t=rI(e,r.invocationID);this.cache.remove(t)}return null}return r.isOnDemandRevalidate,s}catch(e){if(a)return console.error(e),null;throw e}}}',
};

describe("patchBackgroundRevalidation", () => {
  it("Should patch code (previousIncrementalCacheEntry)", () => {
    expect(
      patchCode(next16CodeToPatch, rule),
    ).toMatchInlineSnapshot(`"if (previousIncrementalCacheEntry && !context.isOnDemandRevalidate && previousIncrementalCacheEntry.isStale !== -1) {
                resolve(previousIncrementalCacheEntry);
                resolved = true;
                if (true) {
                    // The cached value is still valid, so we don't need to update it yet.
                    return previousIncrementalCacheEntry;
                }
            }"`);
  });

  it("Should patch code", () => {
    expect(
      patchCode(codeToPatch, rule),
    ).toMatchInlineSnapshot(`"if (cachedResponse && !isOnDemandRevalidate) {
                    var _cachedResponse_value;
                    if (((_cachedResponse_value = cachedResponse.value) == null ? void 0 : _cachedResponse_value.kind) === _types.CachedRouteKind.FETCH) {
                        throw new Error(\`invariant: unexpected cachedResponse of kind fetch in response cache\`);
                    }
                    resolve({
                        ...cachedResponse,
                        revalidate: cachedResponse.curRevalidate
                    });
                    resolved = true;
                    if (true) {
                        // The cached value is still valid, so we don't need
                        // to update it yet.
                        return null;
                    }
                }"`);
  });

  describe("compiled runtime bundles", () => {
    it.each(Object.entries(minifiedCode))(
      "Should patch the minified code of %s exactly once",
      (_name, code) => {
        const { matches } = applyRule(rule, parseCode(code));
        expect(matches.map((match) => match.text())).toEqual([
          expect.stringMatching(/^!\w\.isStale\|\|r\.isPrefetch$/),
        ]);

        const patched = patchCode(code, rule);
        expect(patched).not.toContain(".isStale||");
        // Only the matched expression is replaced
        expect(patched).toEqual(code.replace(matches[0].text(), "true"));
        // The entry is still returned without being regenerated...
        expect(patched).toMatch(/,\w=!0,true\)\)return \w;/);
        // ...and the other checks of the condition are untouched
        expect(patched).toContain("&&!r.isOnDemandRevalidate&&");
      },
    );

    it("Should keep the check of expired entries (Next 16)", () => {
      const patched = patchCode(
        minifiedCode["next@16.3.5 pages.runtime.prod.js"],
        rule,
      );
      expect(patched).toContain(
        "&&!r.isOnDemandRevalidate&&-1!==a.isStale&&(n(a),i=!0,true))return a;",
      );
    });
  });

  it("Should not patch other expressions", () => {
    const code = `
      if (!entry.isStale && context.isPrefetch) {}
      if (entry.isStale || context.isPrefetch) {}
      if (!entry.isStale || context.isOnDemandRevalidate) {}
      if (!entry.isMiss || context.isPrefetch) {}
      const isStale = -1 !== entry.isStale;
      const response = context.isPrefetch && null === entry ? a() : b();
    `;
    expect(applyRule(rule, parseCode(code)).matches).toEqual([]);
  });

  describe("pathFilter", () => {
    it.each([
      "node_modules/next/dist/server/response-cache/index.js",
      "node_modules/next/dist/compiled/next-server/pages.runtime.prod.js",
      "node_modules/next/dist/compiled/next-server/pages-turbo.runtime.prod.js",
      "node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js",
      "node_modules/next/dist/compiled/next-server/app-page-turbo-experimental.runtime.prod.js",
      "node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js",
      String.raw`node_modules\next\dist\compiled\next-server\pages.runtime.prod.js`,
    ])("Should match %s", (path) => {
      expect(pathFilter.test(path)).toBe(true);
    });

    it.each([
      "node_modules/next/dist/server/response-cache/utils.js",
      "node_modules/next/dist/compiled/next-server/pages.runtime.dev.js",
      "node_modules/next/dist/compiled/next-server/pages.runtime.prod.js.map",
      "node_modules/next/dist/server/next-server.js",
    ])("Should not match %s", (path) => {
      expect(pathFilter.test(path)).toBe(false);
    });
  });
});
