import { handle } from 'hono/vercel'
import app from '../server/src/index' // Path to your primary Hono app instance

// Optional: Use Edge runtime for lower latency
export const config = {
  runtime: 'edge',
}

export default handle(app as any)