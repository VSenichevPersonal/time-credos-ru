Migrating from Self-Hosted to Cloud
Step-by-step guide to migrate your Twenty self-hosted instance to Twenty Cloud.

​
Overview
This guide walks you through migrating your data from a Twenty self-hosted instance to Twenty Cloud. The process involves setting up your cloud workspace, exporting your data, and re-importing it.
Views, workflows, and roles must be recreated manually after migration. Plan time for this configuration work.
​
Step 1: Create Your Cloud Workspace
Go to app.twenty.com and create a new workspace
Complete the initial setup wizard
Note your new workspace URL
​
Step 2: Recreate Your Data Model
Before importing data, recreate your custom objects and fields:
Go to Settings → Data Model in your cloud instance
Create custom objects that match your self-hosted setup
Add custom fields to standard and custom objects
Configure field settings (unique, required, etc.)
Take screenshots of your self-hosted data model for reference, or keep both instances open side by side.
​
Step 3: Invite All Users
Critical: Invite users BEFORE importing data.
Users must accept their invitations before you import any records that reference them (like Account Owner fields). If users don’t exist yet, those relations cannot be mapped.
Go to Settings → Members in your cloud instance
Invite all team members who had accounts on self-hosted
Wait for everyone to accept their invitation
Verify all users appear in your Members list
​
Step 4: Export Data from Self-Hosted
Export each object from your self-hosted instance:
Navigate to each object (Companies, People, Opportunities, etc.)
Configure the view to show all columns you want to migrate
Click ⋮ → Export view
Save each CSV file with a clear name (e.g., companies-export.csv)
Export in this order (for reference when importing):
Companies
People
Opportunities
Custom objects (following their dependencies)
Tasks, Notes
​
Step 5: Update Workspace Member References
The exported CSVs contain user IDs from your self-hosted instance. These IDs won’t match your cloud instance, so you need to replace them with emails.
For each CSV file with user references (Owner, Assignee, etc.):
Open the CSV in a spreadsheet application
Add a new column next to each user ID column (e.g., accountOwnerEmail next to accountOwnerId)
Fill in the email address of each user
You can delete the old ID column or leave it (it will be skipped during import)
Example:
Before:
name,domain,accountOwnerId
Acme Corp,https://acme.com,old-uuid-123
After:
name,domain,accountOwnerEmail
Acme Corp,https://acme.com,john@yourcompany.com
Use the same email addresses that users used to accept their cloud workspace invitation.
​
Step 6: Plan Your Import Order
Import files in the correct order to maintain relationships:
Companies first (no dependencies)
People second (link to Companies)
Opportunities third (link to Companies and People)
Custom objects (following their dependencies)
Tasks and Notes last (link to other records)
See How to Import Relations for details on maintaining relationships.
​
Step 7: Import to Cloud
For each CSV file, in order:
Navigate to the object in your cloud instance
Click ⋮ → Import records
Upload the CSV file
Map columns to fields:
Map user email columns to the appropriate relation fields
Map other columns as usual
Review and fix any errors
Confirm the import
Verify a few records before proceeding to the next file
​
Step 8: Recreate Configuration
After importing data, manually recreate:
​
Views
Recreate saved views with filters, sorts, and column configurations
Set up any kanban or calendar views
​
Workflows
Recreate automations in Settings → Workflows
Test each workflow before relying on it
​
Roles and Permissions
Configure roles in Settings → Roles
Assign users to appropriate roles
​
Integrations
Reconnect email and calendar sync for each user
Reconfigure any API integrations with new API keys
​
Post-Migration Checklist
All data imported successfully
Relations between objects working correctly
User assignments (Owner, Assignee) mapped correctly
Views recreated
Workflows recreated and tested
Roles and permissions configured
Email/calendar sync reconnected
API integrations updated with new keys
​
FAQ
Can I migrate workflows automatically?

What about file attachments and images?

Can I keep both instances running during migration?

What if a user hasn't accepted their invitation yet?

​
Need Help?
For complex migrations or large datasets, contact us at contact@twenty.com or explore our Implementation Services.
