# Docker Images

The production images are built for small, generic template deployments:

- API: bundle the compiled NestJS app with `@vercel/ncc`, then copy only the bundle and a stripped Node binary into Alpine.
- Web: use Next.js standalone output, disable unused server image optimization, remove unused `sharp` files, then copy only standalone assets and a stripped Node binary into Alpine.

Current local baselines:

- `turbo-nest-next-api:local`: about 177 MB
- `turbo-nest-next-web:local`: about 196 MB

SlimToolkit can still be tested as an optional release optimization, but keep it out of the default Dockerfiles unless CI smoke probes cover every required route. Runtime probing can remove files that dynamic Node or Next.js code later needs.
