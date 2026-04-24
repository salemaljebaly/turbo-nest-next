# shadcn Preset

The web app uses the `radix-luma` shadcn preset with RTL enabled.

- Config lives in `apps/web/components.json`.
- Theme tokens live in `apps/web/app/globals.css`.
- Shared primitives should stay in `packages/ui/src`, with app-local wrappers in `apps/web/components/ui`.
- Root RTL direction is wired in `apps/web/app/layout.tsx`.

To refresh the preset later:

```bash
pnpm dlx shadcn@latest init --preset b1VlIttI --template next --rtl --force --no-reinstall
```
