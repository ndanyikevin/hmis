import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";

import { organizationRoutes } from "./routes/organizations.route";
import { staffRoute } from "./routes/staff.route";

export const app = new Hono()
  .use(
    "*",
    cors({
      origin: [
        "http://localhost:5173",
        "https://mosetmedicalsystems.vercel.app", // Removed trailing slash
        "http://localhost:3000",
      ],
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
    }),
  )

  .on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
  })
  .route("/api/organizations", organizationRoutes)
  .route("/api/staff", staffRoute)

  .get("/", (c) => {
    return c.text("HMS API");
  })
  .get("/api/me", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json(
      {
        success: false,
        message: "Unauthorized",
      },
      401,
    );
  }

  return c.json({
    success: true,
    user: session.user,
  });
});;

export default app;