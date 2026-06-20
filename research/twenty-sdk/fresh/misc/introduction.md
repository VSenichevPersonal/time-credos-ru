> Источник: https://docs.twenty.com/developers/introduction.md — скачано 2026-06-20

# Developers

> Build apps, use the API, self-host, or contribute to the codebase.

export const CardTitle = ({children}) => {
  return <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </div>;
};

<CardGroup cols={3}>
  <Card href="/developers/extend/apps/getting-started" img="https://mintcdn.com/twenty/zz3tLxIdf6G4nr1Z/images/user-guide/halftone/dev-apps.png?fit=max&auto=format&n=zz3tLxIdf6G4nr1Z&q=85&s=0cbb3112417045a4259ad0a3443455d9" width="2880" height="1360" data-path="images/user-guide/halftone/dev-apps.png">
    <CardTitle>Apps</CardTitle>
    Extend Twenty with custom objects, server-side logic, UI components, and AI agents — all as TypeScript packages.
  </Card>

  <Card href="/developers/extend/api" img="https://mintcdn.com/twenty/zz3tLxIdf6G4nr1Z/images/user-guide/halftone/dev-api.png?fit=max&auto=format&n=zz3tLxIdf6G4nr1Z&q=85&s=2d16b6101a58ba6af45a44d9e89335fb" width="1440" height="680" data-path="images/user-guide/halftone/dev-api.png">
    <CardTitle>API</CardTitle>
    REST and GraphQL APIs, webhooks, and OAuth.
  </Card>

  <Card href="/developers/self-host/capabilities/docker-compose" img="https://mintcdn.com/twenty/zz3tLxIdf6G4nr1Z/images/user-guide/halftone/dev-self-host.png?fit=max&auto=format&n=zz3tLxIdf6G4nr1Z&q=85&s=51da481429b1f204cd5b6da118636c29" width="1194" height="562" data-path="images/user-guide/halftone/dev-self-host.png">
    <CardTitle>Self-Host</CardTitle>
    Run Twenty on your own infrastructure.
  </Card>

  <Card href="/developers/contribute/capabilities/local-setup" img="https://mintcdn.com/twenty/zz3tLxIdf6G4nr1Z/images/user-guide/halftone/dev-contribute.png?fit=max&auto=format&n=zz3tLxIdf6G4nr1Z&q=85&s=335c66b6bb3cb71d75954f42c32dd59b" width="2880" height="1360" data-path="images/user-guide/halftone/dev-contribute.png">
    <CardTitle>Contribute</CardTitle>
    Set up the monorepo locally and submit PRs.
  </Card>
</CardGroup>
