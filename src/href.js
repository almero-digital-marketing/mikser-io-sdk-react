// Multilingual href() — abstract logical references (/about) from
// deployed URLs (/en/about, /fr/a-propos). See README for the full
// pattern; this module is the React implementation of the same shape
// shipped in mikser-io-sdk-vue's href.js.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useMikserClient } from './client.js'

export const HrefIndexContext = createContext(null)

/**
 * HrefIndexProvider — builds a reactive href→{lang: url} index from
 * the catalog and makes it available to useHref / useAlternates.
 *
 *   <HrefIndexProvider defaultLang="en">
 *     <App />
 *   </HrefIndexProvider>
 *
 * Front-matter convention:
 *   meta.href:  '/about'           (logical reference)
 *   meta.lang:  'en'               (which language this doc represents)
 *   meta.route: '/en/about'        (actual URL — what useHref returns)
 */
export function HrefIndexProvider({
    client: clientArg,
    filter,
    defaultLang = 'default',
    children,
}) {
    const client = clientArg ?? useMikserClient()
    const [index, setIndex] = useState({})

    const effectiveFilter = filter ?? { 'meta.href': { $exists: true } }
    const filterKey = useMemo(() => JSON.stringify(effectiveFilter), [effectiveFilter])

    useEffect(() => {
        let cancelled = false
        const dispose = client.live(
            JSON.parse(filterKey),
            (docs) => {
                if (cancelled) return
                const next = {}
                for (const doc of docs) {
                    const ref = doc.meta?.href
                    if (!ref) continue
                    const lang = doc.meta?.lang ?? defaultLang
                    const url  = doc.meta?.route ?? doc.meta?.destination ?? ref
                    if (!next[ref]) next[ref] = {}
                    next[ref][lang] = url
                }
                setIndex(next)
            },
            { fields: ['id', 'meta'] },
        )
        return () => {
            cancelled = true
            dispose?.()
        }
    }, [client, filterKey, defaultLang])

    const value = useMemo(() => ({ index, defaultLang }), [index, defaultLang])
    return createElement(HrefIndexContext.Provider, { value }, children)
}

/**
 * Read the href index. Returns `{ href, refFor, index }`.
 *
 *   const { href } = useHref(locale)
 *   <Link to={href('/about')}>About</Link>
 *
 * `defaultLang` overrides the provider's default for this hook
 * instance — typically your i18n locale. When the caller doesn't pass
 * a lang to href(), this is the fallback.
 *
 * Resolution falls back: requested lang → 'default' bucket → any
 * available language → the input reference (so broken refs stay
 * visible instead of silently becoming undefined).
 *
 * `refFor(url)` is the reverse — given a deployed URL, return the
 * logical reference it belongs to (or null). Powers useAlternates().
 */
export function useHref(defaultLang) {
    const ctx = useContext(HrefIndexContext)
    if (!ctx) {
        throw new Error(
            'useHref: <HrefIndexProvider> must wrap your tree first'
        )
    }
    const { index, defaultLang: providerDefault } = ctx

    const href = useCallback(
        (ref, lang) => {
            const target = lang ?? defaultLang ?? providerDefault ?? 'default'
            const entry = index[ref]
            if (!entry) return ref
            return entry[target]
                ?? entry['default']
                ?? Object.values(entry)[0]
                ?? ref
        },
        [index, defaultLang, providerDefault],
    )

    const refFor = useCallback(
        (url) => {
            if (url == null) return null
            for (const [ref, byLang] of Object.entries(index)) {
                if (Object.values(byLang).includes(url)) return ref
            }
            return null
        },
        [index],
    )

    return { href, refFor, index }
}

/**
 * useAlternates — alternate-language URLs for a given route. Powers
 * language switchers and SEO hreflang tags.
 *
 *   const location = useLocation()
 *   const { alternates, current } = useAlternates({ route: location.pathname })
 *   // alternates = [{ lang: 'fr', url: '/fr/a-propos' }, ...]
 *   // current    = { lang: 'en', url: '/en/about', ref: '/about' }
 *
 * `route` is the URL to find alternates for. Required. Pass
 * location.pathname (react-router) or whatever else you have.
 *
 * `languages` controls which alternates appear:
 *   - omitted: only languages that actually exist for the current ref.
 *     Right shape for hreflang tags — don't advertise translations
 *     that don't exist.
 *   - provided (array): one entry per requested language, falling back
 *     via href() resolution when a real translation doesn't exist.
 *     Right shape for language switchers — show every locale you
 *     support, even if a particular page hasn't been translated yet.
 *
 * The current page's own language is excluded from `alternates`.
 */
export function useAlternates({ route, languages } = {}) {
    if (route == null) {
        throw new Error('useAlternates: { route } is required')
    }
    const { href, refFor, index } = useHref()

    const current = useMemo(() => {
        if (route == null) return null
        const ref = refFor(route)
        if (ref == null) return null
        const entry = index[ref] ?? {}
        const lang = Object.entries(entry).find(([, url]) => url === route)?.[0] ?? null
        return { lang, url: route, ref }
    }, [route, refFor, index])

    const alternates = useMemo(() => {
        if (!current) return []
        const entry = index[current.ref] ?? {}

        if (languages && Array.isArray(languages)) {
            return languages
                .filter(lang => lang !== current.lang)
                .map(lang => ({ lang, url: href(current.ref, lang) }))
        }
        return Object.entries(entry)
            .filter(([lang]) => lang !== current.lang && lang !== 'default')
            .map(([lang, url]) => ({ lang, url }))
    }, [current, index, languages, href])

    return { alternates, current }
}
