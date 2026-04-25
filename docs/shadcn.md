# shadcn Presets

The web app uses the shadcn preset configured in `apps/web/components.json`.

- Config lives in `apps/web/components.json`.
- Theme tokens live in `apps/web/app/globals.css`.
- Shared primitives should stay in `packages/ui/src`, with app-local wrappers in `apps/web/components/ui`.
- Root RTL direction is wired in `apps/web/app/layout.tsx`.

To refresh or switch a preset later:

```bash
pnpm dlx shadcn@latest init -c apps/web --preset <preset-code> --template next --rtl --force --no-reinstall
```

To add components:

```bash
pnpm dlx shadcn@latest add -c apps/web <component>
```

Keep app UI built from `@/components/ui/*` components and semantic theme
tokens such as `bg-primary`, `text-muted-foreground`, and `border-border`.
Avoid hard-coded colors, radius, and padding unless the page truly needs a
custom exception; preset switching works best when the preset owns component
shape, spacing, and color.
