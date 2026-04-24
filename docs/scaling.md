# Scaling Path

The template is microservice-ready by boundary, not by default complexity. Do
not split services until a module needs independent ownership, deployment, or
scaling.

## Small Product

Use the repo as-is:

- one API app
- one web app
- one database
- local Docker Compose for dependencies
- contract generation in CI

This is the fastest path and should stay the default.

## Medium Product

Keep the same runtime shape, but harden ownership:

- create feature modules under `apps/api/src`
- keep controllers thin and services domain-focused
- keep database access inside backend providers
- add focused tests around important workflows
- keep OpenAPI contract checks required in CI

## Large Product

Split only stable boundaries:

- extract a module when it has a separate team, lifecycle, or scaling profile
- publish shared contracts instead of importing service internals
- keep each service responsible for its own data ownership
- use events/queues only when asynchronous workflows are real requirements
- add cloud IaC after runtime boundaries are stable

## Future Infra

IaC is a good next layer for this template. Add it as optional infrastructure,
not as a requirement for local development:

- local: Docker Compose
- staging/production: IaC stacks
- CI: build, test, contract check, image build
- deploy: one app at a time, then split services when needed

This keeps the template useful for small apps while still giving large systems a
clean upgrade path.
