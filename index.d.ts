// Type declarations for mikser-io-sdk-react.

import type { ReactNode } from 'react'
import type {
    EntitiesClient,
    Filter,
    ListQuery,
} from 'mikser-io-sdk-api'
// React Router types are optional — we declare a minimal RouteObject
// shape so consumers without react-router-dom installed still get
// useful types from useMikserRoutes / generateMikserRoutes.
interface RouteObjectLike {
    path?: string
    element?: ReactNode
    children?: RouteObjectLike[]
    [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Provider + client hook
// ---------------------------------------------------------------------------

export interface MikserProviderProps {
    /** The entities client returned by createClient(...).entities(name). */
    client: EntitiesClient
    children?: ReactNode
}

export declare function MikserProvider(props: MikserProviderProps): JSX.Element

/**
 * Read the configured EntitiesClient from context. Useful for ad-hoc
 * calls like client.urlFor() or client.render().
 */
export declare function useMikserClient(): EntitiesClient

// ---------------------------------------------------------------------------
// Document hooks
// ---------------------------------------------------------------------------

export interface UseDocumentResult<T = unknown> {
    /** The resolved document, or null while loading / when missing. */
    document: T | null
    /** True until the initial fetch resolves. */
    loading:  boolean
    /** Populated when an error fires through onError. */
    error:    unknown
    /** Manually re-trigger the subscription. */
    refresh:  () => void
}

export interface UseHookOptions {
    /** Override the context client (rare — tests / multi-client apps). */
    client?: EntitiesClient
}

/**
 * Live single-document hook. Re-subscribes automatically when `id`
 * changes between renders.
 */
export declare function useDocument<T = unknown>(
    id: string | null | undefined,
    options?: UseHookOptions,
): UseDocumentResult<T>

export interface UseDocumentsResult<T = unknown> {
    documents: T[]
    loading:   boolean
    error:     unknown
    refresh:   () => void
}

/**
 * Live list hook. Accepts a ListQuery (filter + sort + fields + limit
 * + skip); re-subscribes when the query shape changes.
 */
export declare function useDocuments<T = unknown>(
    query?: ListQuery,
    options?: UseHookOptions,
): UseDocumentsResult<T>

// ---------------------------------------------------------------------------
// Router integration
// ---------------------------------------------------------------------------

export interface UseMikserRoutesOptions {
    client?: EntitiesClient
    /** Filter for which documents become routes. Default `meta.published: true` + `meta.route` exists. */
    filter?: Filter
    /** Maps a document into a React Router RouteObject. Receives `{ id, meta }`. */
    mapRoute: (document: any) => RouteObjectLike | null | undefined
    /** Hand-coded routes (login, dashboard) mounted before content. */
    staticRoutes?: RouteObjectLike[]
    /** Element for the catch-all '*' route. Omit to skip. */
    notFoundElement?: ReactNode
}

/**
 * Live array of React Router route objects from the catalog. Pass the
 * return value to `useRoutes()` (or to a memoized `createBrowserRouter()`).
 */
export declare function useMikserRoutes(
    options: UseMikserRoutesOptions,
): RouteObjectLike[]

export interface GenerateMikserRoutesOptions<R = RouteObjectLike> {
    client: EntitiesClient
    filter?: Filter
    mapRoute: (document: any) => R
}

/**
 * Build-time helper. One-shot list() that returns an array of route
 * definitions for static-site generators (Vite SSG, Next static
 * export, etc.). The mapper return shape is whatever your build step
 * consumes — this helper only enumerates the catalog.
 */
export declare function generateMikserRoutes<R = RouteObjectLike>(
    options: GenerateMikserRoutesOptions<R>,
): Promise<R[]>

// ---------------------------------------------------------------------------
// href() — multilingual URL abstraction
// ---------------------------------------------------------------------------

export interface HrefIndexProviderProps {
    client?: EntitiesClient
    /** Default: `{ 'meta.href': { $exists: true } }`. */
    filter?: Filter
    /** Bucket for documents without meta.lang. Default 'default'. */
    defaultLang?: string
    children?: ReactNode
}

export declare function HrefIndexProvider(props: HrefIndexProviderProps): JSX.Element

/** Map of logical href → { lang → resolved URL }. */
export type HrefIndex = Record<string, Record<string, string>>

export interface UseHrefResult {
    /**
     * Resolve a logical href + optional language to a real URL.
     * Returns the input unchanged when no entry matches.
     */
    href: (ref: string, lang?: string) => string
    /**
     * Reverse lookup — given a deployed URL, return the logical
     * reference it belongs to (or null). Used by useAlternates().
     */
    refFor: (url: string | null | undefined) => string | null
    /** Direct access to the underlying index. */
    index: HrefIndex
}

/**
 * Read the href index. `defaultLang` is the fallback when the caller
 * doesn't pass a lang to href() — typically your current locale.
 */
export declare function useHref(defaultLang?: string): UseHrefResult

export interface Alternate {
    lang: string
    url:  string
}

export interface CurrentRoute {
    lang: string | null
    url:  string
    ref:  string
}

export interface UseAlternatesOptions {
    /** The URL to find alternates for. Typically `useLocation().pathname`. */
    route: string
    /**
     * Optional list of languages to include. When provided, every
     * language appears (falling back via href()). When omitted, only
     * languages with real translations appear — right for hreflang.
     */
    languages?: string[]
}

export interface UseAlternatesResult {
    /** Alternates excluding the current page's own language. */
    alternates: Alternate[]
    /** The matched current route, or null if no document corresponds. */
    current:    CurrentRoute | null
}

export declare function useAlternates(options: UseAlternatesOptions): UseAlternatesResult

// ---------------------------------------------------------------------------
// asset() — asset / image reference resolution
// ---------------------------------------------------------------------------

export interface AssetRecord {
    url:    string
    width?: number
    height?: number
    srcset?: string
    alt?:   string
    meta?:  Record<string, unknown>
}

export interface AssetIndexProviderProps {
    client?: EntitiesClient
    filter?: Filter
    children?: ReactNode
}

export declare function AssetIndexProvider(props: AssetIndexProviderProps): JSX.Element

export type AssetIndex = Record<string, AssetRecord>

export interface UseAssetResult {
    asset: (ref: string) => AssetRecord | null
    /** Returns props suitable for spreading onto a JSX <img>. */
    image: (ref: string) => {
        src:    string
        width?: number
        height?: number
        srcSet?: string
        alt?:   string
    } | null
    index: AssetIndex
}

export declare function useAsset(): UseAssetResult

// ---------------------------------------------------------------------------
// vector() — semantic search (pairs with mikser-io-sdk-vector)
// ---------------------------------------------------------------------------

/**
 * Shape the vector client must conform to. Match the one returned by
 * `createClient(...)` from `mikser-io-sdk-vector` — the framework SDK
 * doesn't import that package directly (it's an optional runtime
 * dependency), it just expects this surface.
 */
export interface MikserVectorClient {
    vector(storeName: string, options?: { token?: string }): {
        findSimilar(q: string, options?: { limit?: number }): Promise<{
            results: Array<{ id: string; distance: number; data?: any }>
        }>
    }
}

export interface MikserVectorProviderProps {
    client: MikserVectorClient
    children?: ReactNode
}

export declare function MikserVectorProvider(props: MikserVectorProviderProps): JSX.Element

/**
 * Read the configured vector client from context. useSimilar reads it
 * for you; this is for ad-hoc calls.
 */
export declare function useMikserVectorClient(): MikserVectorClient

export interface UseSimilarOptions {
    /** Override the context client. Rare — useful in tests / multi-client apps. */
    client?: MikserVectorClient
    /** Max hits per request. Default 5. */
    limit?: number
    /** ms to wait after the last query change before firing. Default 200. 0 = fire immediately. */
    debounce?: number
    /** Skip the request when the trimmed query is shorter than this. Default 1. */
    minLength?: number
}

export interface SimilarHit<T = unknown> {
    id: string
    distance: number
    data?: T
}

export interface UseSimilarResult<T = unknown> {
    /** Latest results. Empty array before the first response. */
    results: SimilarHit<T>[]
    /** True while a request is in flight (not while debouncing). */
    loading: boolean
    /** Populated when findSimilar() rejects. */
    error:   unknown
    /** Force a fresh request against the current query. */
    refresh: () => void
}

/**
 * Live semantic search hook. Re-fires the search when `query` changes,
 * debounced. Stale results from races are discarded — only the most
 * recently-issued query's response can update `results`.
 */
export declare function useSimilar<T = unknown>(
    storeName: string,
    query: string,
    options?: UseSimilarOptions,
): UseSimilarResult<T>
