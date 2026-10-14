# blog_aws_lambda_web_functions
A repo for testing 20261012 lambda web functions vs amplify for nextjs


## Fin & Feast

A playful fish takeaway demo. The Next.js 15 App Router / TypeScript application lives in `app/`. Terraform lives separately in `iac/amplify/` (resource definitions) and `iac/lambda-web-functions/` (resource definitions and packaging). Neither has been deployed.

```sh
cd app
npm ci
npm run dev
```

Use Node.js 22.13+ (or Node 24 LTS). Open http://localhost:3000.

### Checks and production preview

```sh
cd app
npm run lint
npm run typecheck
npm run build:standalone
HOSTNAME=127.0.0.1 PORT=3100 npm run start:standalone
# In another terminal, from app/:
npm run test:smoke
```

`npm run build` produces the standard Next.js build as well as standalone output. `build:standalone` also copies static assets into the standalone bundle. For future Amplify work, set the app root to `app/`; for a Node HTTP runtime, package `app/.next/standalone` and run `server.js`. Actual platform deployment and compatibility still need verification when infrastructure is added.

### What the demo exercises

- Six dishes, search, category filters, bounded quantities, basket saved in localStorage, checkout and order confirmation.
- A request-rendered `/` route. The `cloudfront-viewer-country: US` header changes the fictional delivery area to Sunset Reef; otherwise it is Coral Crescent. This is demonstration content, not geolocation or a trusted security signal.
- A Suspense boundary streams a simulated kitchen check after an intentional 1.6-second delay. The menu and fallback arrive first. The delay is a controlled fixture, not a real downstream request or a platform latency measurement.
- `POST /api/orders` validates the basket and calculates prices server-side. Orders are not stored, paid for or delivered. No credentials or database are required.
- The smoke test checks initial server HTML, request-dependent rendering, streamed chunk timing, pricing, and invalid orders.

Compare identical production builds and measure both time to first byte and arrival of the delayed panel. Intermediary buffering can change streaming behaviour; local streaming alone does not establish either AWS platform's behaviour. See the [Next.js 15 self-hosting documentation](https://nextjs.org/docs/15/app/guides/self-hosting).

### Notes

The bowl illustration uses CSS, dishes use emoji, and typography uses Google Fonts with local fallback fonts. Fonts and emoji may look different offline or across operating systems. All reviews, food and delivery details are fictional.

The production dependency audit passed at setup. The full audit still reports five high-severity development-tool dependency findings originating in `braces` through Next's ESLint tooling; no patched `braces` release was available. A PostCSS override pins a patched 8.x release while retaining Next.js 15. Recheck dependencies before public deployment.

### Routing and the reason for a server runtime

- `/menu/[slug]`: six pre-rendered dish detail pages with individual metadata and related-dish links. These demonstrate routing and static rendering; routing by itself does not require server hosting.
- `/?dish=flakes`: request-dependent selection when returning from a dish page to order it.
- `/orders/[id]`: checkout navigates to a personalised Server Component page. The server reads an HttpOnly receipt cookie, checks the requested order ID, and renders the name, ordered items and total into the response HTML. A different browser, changed signature, wrong ID or expired receipt gets a 404. Receipt pages are not publicly cached.
- The order summary is sent before a separate Suspense kitchen-status panel. The simulated status is computed on the server from the order timestamp, progressing at 30 and 60 seconds; refresh the order route to see it advance.

The order route requires a request-time Next.js runtime; it cannot be served as a static export alone. A static frontend plus a separate backend could provide similar functionality, but this demo deliberately keeps rendering and backend logic in one portable Next.js application.

Receipts are cookie-backed demo data, not a durable order database: only the latest order is retained, for one hour. No address is stored in the receipt. This avoids process memory or local disk assumptions that would break across Lambda instances. `ORDER_COOKIE_SECRET` can provide a shared signing key across instances; without it, the app uses a **public demo key**, so signatures are not a security boundary for real orders. Use fictional names only. Real order storage, authentication and secrets management belong to a later production design.

See [iac/README.md](iac/README.md) for the two independent Terraform roots.

## Performance comparison

See [benchmarks/README.md](benchmarks/README.md) for Playwright journeys, HTML/CSV reports and optional read-only CloudWatch collection against both deployed demos.
