> Источник: https://docs.twenty.com/developers/extend/apps/config/public-assets.md — скачано 2026-06-20

# Public Assets

The `public/` folder stores static files like images, icons, and fonts that are automatically included in builds and synced during development.

## Key Features

Files in `public/` offer several advantages:

- **Public accessibility** — Once synced to the server, assets are served at a public URL without authentication requirements.
- **Component integration** — Asset URLs can be used in React components to display images and media.
- **Logic function support** — Server-side logic can reference asset URLs for emails and API responses.
- **Marketplace metadata** — The `logoUrl` and `screenshots` fields in `defineApplication()` reference these files for marketplace display.
- **Auto-sync capability** — Changes to files sync automatically during development without requiring restarts.
- **Build inclusion** — The `yarn twenty dev:build` command bundles all public assets into distribution output.

## Using `getPublicAssetUrl`

The `getPublicAssetUrl` helper from `twenty-sdk` retrieves the full URL of files in the `public/` directory. It functions in both logic functions and front components.

**Logic function example:**

```ts
import { defineLogicFunction } from 'twenty-sdk/define';
import { getPublicAssetUrl } from 'twenty-sdk/utils';

const handler = async (): Promise<any> => {
  const logoUrl = getPublicAssetUrl('logo.png');
  const invoiceUrl = getPublicAssetUrl('templates/invoice.png');

  const response = await fetch(invoiceUrl);
  const buffer = await response.arrayBuffer();

  return { logoUrl, size: buffer.byteLength };
};

export default defineLogicFunction({
  universalIdentifier: 'a1b2c3d4-...',
  name: 'send-invoice',
  description: 'Sends an invoice with the app logo',
  timeoutSeconds: 10,
  handler,
});
```

**Front component example:**

```tsx
import { defineFrontComponent } from 'twenty-sdk/define';
import { getPublicAssetUrl } from 'twenty-sdk/utils';

const CompanyCard = () => {
  const logoUrl = getPublicAssetUrl('logo.png');
  return <img src={logoUrl} alt="App logo" />;
};

export default defineFrontComponent({
  universalIdentifier: '...',
  name: 'company-card',
  component: CompanyCard,
});
```

The path argument is relative to the `public/` folder. Both `getPublicAssetUrl('logo.png')` and `getPublicAssetUrl('public/logo.png')` resolve identically, with the `public/` prefix stripped automatically if included.
