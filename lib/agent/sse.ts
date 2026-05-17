// Server-Sent Events encoding helpers. Each event is a discriminated union
// of StreamEvent; we wrap it in an `event: <type>` + `data: <json>` frame
// because some browsers ignore generic "message" events when filtering.

import type { StreamEvent } from './types'

const enc = new TextEncoder()

export function sseFrame(evt: StreamEvent): Uint8Array {
  // SSE spec: lines starting with `event:` set the event type; `data:` carries
  // the payload; blank line terminates the event.
  const data = JSON.stringify(evt)
  return enc.encode(`event: ${evt.type}\ndata: ${data}\n\n`)
}

export function sseHeartbeat(): Uint8Array {
  // Comment frames keep idle connections alive without firing client handlers.
  return enc.encode(`: ping ${Date.now()}\n\n`)
}

export function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // tell nginx/vercel not to buffer
  }
}
