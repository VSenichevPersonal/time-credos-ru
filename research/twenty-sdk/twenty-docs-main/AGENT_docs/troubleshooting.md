Troubleshooting
If you encounter any problem while setting up environment for development, upgrading your instance or self-hosting, here are some solutions for common problems.
​
Self-hosting
​
First install results in password authentication failed for user "postgres"
🚨 IMPORTANT: This solution is ONLY for fresh installations 🚨 If you have an existing Twenty instance with production data, DO NOT follow these steps as they will permanently delete your database!
While installing Twenty for the first time, you might want to change the default database password. The password you set during the first installation becomes permanently stored in the database volume. If you later try to change this password in your configuration without removing the old volume, you’ll get authentication errors because the database is still using the original password.
⚠️ WARNING: Following steps will PERMANENTLY DELETE all database data! ⚠️ Only proceed if this is a fresh installation with no important data.
In order to update the PG_DATABASE_PASSWORD you need to:
# Update the PG_DATABASE_PASSWORD in .env
docker compose down --volumes
docker compose up -d
​
CR line breaks found [Windows]
This is due to the line break characters of Windows and the git configuration. Try running:
git config --global core.autocrlf false
Then delete the repository and clone it again.
​
Missing metadata schema
During Twenty installation, you need to provision your postgres database with the right schemas, extensions, and users. If you’re successful in running this provisioning, you should have default and metadata schemas in your database. If you don’t, make sure you don’t have more than one postgres instance running on your computer.
​
Cannot find module ‘twenty-emails’ or its corresponding type declarations.
You have to build the package twenty-emails before running the initialization of the database with npx nx run twenty-emails:build
​
Missing twenty-x package
Make sure to run yarn in the root directory and then run npx nx server:dev twenty-server. If this still doesn’t work try building the missing package manually.
​
Lint on Save not working
This should work out of the box with the eslint extension installed. If this doesn’t work try adding this to your vscode setting (on the dev container scope):
"editor.codeActionsOnSave": {

  "source.fixAll.eslint": "explicit"

}
​
While running npx nx start or npx nx start twenty-front, Out of memory error is thrown
In packages/twenty-front/.env uncomment VITE_DISABLE_TYPESCRIPT_CHECKER=true to disable background checks thus reducing amount of needed RAM.
If it does not work: Run only the services you need, instead of npx nx start. For instance, if you work on the server, run only npx nx worker twenty-server
If it does not work: If you tried to run only npx nx run twenty-server:start on WSL and it’s failing with the below memory error:
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
Workaround is to execute below command in terminal or add it in .bashrc profile to get setup automatically:
export NODE_OPTIONS="--max-old-space-size=8192"
The —max-old-space-size=8192 flag sets an upper limit of 8GB for the Node.js heap; usage scales with application demand. Reference: https://stackoverflow.com/questions/56982005/where-do-i-set-node-options-max-old-space-size-2048
If it does not work: Investigate which processes are taking you most of your machine RAM. At Twenty, we noticed that some VScode extensions were taking a lot of RAM so we temporarily disable them.
If it does not work: Restart your machine helps to clean up ghost processes.
​
While running npx nx start there are weird [0] and [1] in logs
That’s expected as command npx nx start is running more commands under the hood
​
No emails are sent
Most of the time, it’s because the worker is not running in the background. Try to run
npx nx worker twenty-server
​
Cannot connect my Microsoft 365 account
Most of the time, it’s because your admin has not enabled the Microsoft 365 Licence for your account. Check https://admin.microsoft.com/.
If you have an error code AADSTS50020, it probably means that you are using a personal Microsoft account. This is not supported yet. More info here
​
While running yarn warnings appear in console
Warnings are informing about pulling additional dependencies which aren’t explicitly stated in package.json, so as long as no breaking error appears, everything should work as expected.
​
When user accesses login page, error about unauthorized user trying to access workspace appears in logs
That’s expected as user is unauthorized when logged out since its identity is not verified.
​
How to check if your worker is running?
Go to webhook-test.com and copy Your Unique Webhook URL.
Webhook test
Open your Twenty app, navigate to /settings, and enable the Advanced toggle at the bottom left of the screen.
Create a new webhook.
Paste Your Unique Webhook URL in the Endpoint Url field in Twenty. Set the Filters to Companies and Created.
Webhook settings
Go to /objects/companies and create a new company record.
Return to webhook-test.com and check if a new POST request has been received.
Webhook test result
If a POST request is received, your worker is running successfully. Otherwise, you need to troubleshoot your worker.
​
Front-end fails to start and returns error TS5042: Option ‘project’ cannot be mixed with source files on a command line
Comment out checker plugin in packages/twenty-ui/vite-config.ts like in example below
plugins: [
      react({ jsxImportSource: '@emotion/react' }),
      tsconfigPaths(),
      svgr(),
      dts(dtsConfig),
      // checker(checkersConfig),
      wyw({
        include: [
          '**/OverflowingTextWithTooltip.tsx',
          '**/Chip.tsx',
          '**/Tag.tsx',
          '**/Avatar.tsx',
          '**/AvatarChip.tsx',
        ],
        babelOptions: {
          presets: ['@babel/preset-typescript', '@babel/preset-react'],
        },
      }),
    ],
​
Admin panel not accessible
Run UPDATE core."user" SET "canAccessFullAdminPanel" = TRUE WHERE email = 'you@yourdomain.com'; in database container to get access to admin panel.
​
1-click Docker compose
​
Unable to Log In
If you can’t log in after setup:
Run the following commands:
docker exec -it twenty-server-1 yarn
docker exec -it twenty-server-1 npx nx database:reset  --configuration=no-seed
Restart the Docker containers:
docker compose down
docker compose up -d
Note the database:reset command will completely erase your database and recreate it from scratch.
​
Connection Issues Behind a Reverse Proxy
If you’re running Twenty behind a reverse proxy and experiencing connection issues:
Verify SERVER_URL:
Ensure SERVER_URL in your .env file matches your external access URL, including https if SSL is enabled.
Check Reverse Proxy Settings:
Confirm that your reverse proxy is correctly forwarding requests to the Twenty server.
Ensure headers like X-Forwarded-For and X-Forwarded-Proto are properly set.
Restart Services:
After making changes, restart both the reverse proxy and Twenty containers.
​
Error when uploading an image - permission denied
Switching the data folder ownership on the host from root to another user and group resolves this problem.
​
Getting Help
If you encounter issues not covered in this guide:
Check Logs:
View container logs for error messages:
docker compose logs
Community Support:
Reach out to the Twenty community or support channels for assistance.
