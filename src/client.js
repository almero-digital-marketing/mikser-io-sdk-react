// Client context — the entities client is shared app-wide via React
// Context. Every other hook in the SDK either takes a client explicitly
// or grabs it via useMikserClient().
import { createContext, createElement, useContext } from 'react'

export const MikserClientContext = createContext(null)

/**
 * MikserProvider — wrap your app to make the entities client available
 * to every hook below it.
 *
 *   <MikserProvider client={docs}>
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
