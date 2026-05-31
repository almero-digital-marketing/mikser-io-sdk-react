// Connection-status hook.
//
// `useMikserStatus()` answers the simplest question about a mikser
// backend: is it reachable from this browser right now? Returns a
// string that starts at 'connecting', moves to 'ready' on the first
// successful list() probe, and moves to 'unreachable' on probe failure
// or deadline timeout.
//
// The point is to give the consumer something to render with — a
// loading state, a "can't reach the server" message, anything other
// than a silent forever-pending screen.
//
// Implementation notes:
//   - Probe is `client.list({ limit: 1 })` — single round trip, cheap,
//     uses the same configured baseUrl.
//   - Deadline races the probe. Whichever resolves first wins.
//   - Once settled to 'ready' or 'unreachable', the value does not
//     flip back. This is a one-shot connection check, not a heartbeat.
//     For live health, watch useDocuments' `error` ref instead.

import { useEffect, useState } from 'react'
import { useMikserClient } from './client.js'

export function useMikserStatus({ client: clientArg, timeoutMs = 5000 } = {}) {
    const ctxClient = useMikserClient()
    const client = clientArg ?? ctxClient
    const [status, setStatus] = useState('connecting')

    useEffect(() => {
        let cancelled = false
        client.list({ limit: 1 }).then(
            () => { if (!cancelled) setStatus(s => s === 'connecting' ? 'ready' : s) },
            () => { if (!cancelled) setStatus(s => s === 'connecting' ? 'unreachable' : s) },
        )
        const timeoutId = setTimeout(() => {
            if (!cancelled) setStatus(s => s === 'connecting' ? 'unreachable' : s)
        }, timeoutMs)
        return () => { cancelled = true; clearTimeout(timeoutId) }
    }, [client, timeoutMs])

    return status
}
