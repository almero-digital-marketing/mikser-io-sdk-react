// Client context — the entities client is shared app-wide via React
// Context. Every other hook in the SDK either takes a client explicitly
// or grabs it via useMikserClient().
//
// SDK source files are plain .js (not .jsx) so the package ships
// without a JSX build step. createElement() is used in place of JSX
// inside the SDK itself; consumers write JSX freely in their own
// apps.
import { createContext, createElement, useContext } from 'react'

export const MikserClientContext = createContext(null)

/**
 * MikserProvider — wrap your app to make the entities client available
 * to every hook below it.
 *
 *   <MikserProvider client={documents}>
 *     <App />
 *   </MikserProvider>
 */
export function MikserProvider({ client, children }) {
    if (!client) {
        throw new Error('MikserProvider: { client } prop is required')
    }
    return createElement(MikserClientContext.Provider, { value: client }, children)
}

/**
 * Read the configured entities client from context. Usually you don't
 * need this — useDocument / useDocuments / etc. read it for you. Useful
 * when you want to make ad-hoc calls (urlFor, render, etc.).
 */
export function useMikserClient() {
    const client = useContext(MikserClientContext)
    if (!client) {
        throw new Error(
            'useMikserClient: no client found. Did you wrap your tree in ' +
            '<MikserProvider client={...}>?'
        )
    }
    return client
}
