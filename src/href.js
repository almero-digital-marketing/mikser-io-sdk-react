// Multilingual href() — React-reactive shell around sdk-api's pure
// createHrefIndex. See README for the full pattern.
import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createHrefIndex } from 'mikser-io-sdk-api'
import { useMikserClient } from './client.js'

export const HrefIndexContext = createContext(null)

// Stable signature for an arbitrary filter, used as a useEffect dep so
// subscriptions only rewire when the filter's *shape* changes.
function filterKey(filter) {
    return JSON.stringify(filter ?? null)
}

/**
 * HrefIndexProvider — subscribes to the catalog, rebuilds the href
 * index via sdk-api's createHrefIndex, and exposes it via context.
 *
 *   <HrefIndexProvider defaultLang="en">
 *     <App />
 *   </HrefIndexProvider>
 *
 * Front-matter convention:
 *   meta.href:  '/about'           (logical reference)
 *   meta.lang:  'en'               (language this doc represents)
 *   meta.route: '/en/about'        (deployed URL)
 */
export function HrefIndexProvider({
    client: clientArg,
    filter,
    defaultLang = 'default',
    children,
}) {
    const client = clientArg ?? useMikserClient()
    const [documents, setDocuments] = useState([])

    const effectiveFilter = filter ?? { 'meta.href': { $exists: true } }
    const filterRef = useRef(effectiveFilter)
    filterRef.current = effectiveFilter
    const key = useMemo(() => filterKey(effectiveFilter), [effectiveFilter])

    useEffect(() => {
        let cancelled = false
        const dispose = client.live(
            filterRef.current,
            (docs) => {
                if (cancelled) return
                setDocuments(docs)
            },
            { fields: ['id', 'meta'] },
        )
        return () => {
            cancelled = true
            dispose?.()
        }
    }, [client, key])

    const index = useMemo(() => createHrefIndex(documents, { defaultLang }), [documents, defaultLang])
    const value = useMemo(() => ({ index, defaultLang }), [index, defaultLang])
    return createElement(HrefIndexContext.Provider, { value }, children)
}

/**
 * Read the href index. Returns `{ href, refFor, doc, meta, index }`.
 *
 *   const { href, meta } = useHref(locale)
 *   <Link to={href('/about')}>About</Link>            // ref → URL
 *   {meta('/menu')?.products.map(p => <li>{p.name}</li>)}  // ref → content
 *
 * `href`/`refFor` resolve URLs; `doc`/`meta` resolve the document a
 * logical reference points at — the content companion. All read from
 * the same live index, so they re-render when the referenced document
 * changes.
 *
 * `defaultLang` overrides the provider's default for this hook
 * instance — typically your i18n locale. When the caller doesn't pass
 * a lang, this is the fallback.
 */
export function useHref(defaultLang) {
    const ctx = useContext(HrefIndexContext)
    if (!ctx) {
        throw new Error(
            'useHref: <HrefIndexProvider> must wrap your tree first'
        )
    }
    const { index, defaultLang: providerDefault } = ctx
    const fallback = defaultLang ?? providerDefault

    const api = useMemo(() => ({
        href:   (ref, lang) => index.href(ref, lang ?? fallback),
        refFor: (url) => index.refFor(url),
        doc:    (ref, lang) => index.docFor(ref, lang ?? fallback),
        meta:   (ref, lang) => index.metaFor(ref, lang ?? fallback),
        index,
    }), [index, fallback])

    return api
}

/**
 * useAlternates — alternate-language URLs for a given route. Powers
 * language switchers and SEO hreflang tags.
 *
 *   const { pathname } = useLocation()
 *   const { alternates, current } = useAlternates({ route: pathname })
 *
 * `languages` controls which alternates appear:
 *   - omitted: only languages that actually exist for the current ref
 *   - provided (array): one entry per requested language, with fallback
 */
export function useAlternates({ route, languages } = {}) {
    if (route == null) {
        throw new Error('useAlternates: { route } is required')
    }
    const ctx = useContext(HrefIndexContext)
    if (!ctx) {
        throw new Error(
            'useAlternates: <HrefIndexProvider> must wrap your tree first'
        )
    }
    const { index } = ctx

    return useMemo(
        () => index.alternates({ route, languages }),
        [index, route, languages],
    )
}
