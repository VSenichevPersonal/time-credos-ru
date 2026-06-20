APIs
Query and modify your CRM data programmatically using REST or GraphQL.

Twenty was built to be developer-friendly, offering powerful APIs that adapt to your custom data model. We provide four distinct API types to meet different integration needs.
​
Developer-First Approach
Twenty generates APIs specifically for your data model:
No long IDs required: Use your object and field names directly in endpoints
Standard and custom objects treated equally: Your custom objects get the same API treatment as built-in ones
Dedicated endpoints: Each object and field gets its own API endpoint
Custom documentation: Generated specifically for your workspace’s data model
Your personalized API documentation is available under Settings → API & Webhooks after creating an API key. Since Twenty generates APIs that match your custom data model, the documentation is unique to your workspace.
​
The Two API Types
​
Core API
Accessed on /rest/ or /graphql/
Work with your actual records (the data):
Create, read, update, delete People, Companies, Opportunities, etc.
Query and filter data
Manage record relationships
​
Metadata API
Accessed on /rest/metadata/ or /metadata/
Manage your workspace and data model:
Create, modify, or delete objects and fields
Configure workspace settings
Define relationships between objects
​
REST vs GraphQL
Both Core and Metadata APIs are available in REST and GraphQL formats:
Format	Available Operations
REST	CRUD, batch operations, upserts
GraphQL	Same + batch upserts, relationship queries in one call
Choose based on your needs — both formats access the same data.
​
API Endpoints
Environment	Base URL
Cloud	https://api.twenty.com/
Self-Hosted	https://{your-domain}/
​
Authentication
Every API request requires an API key in the header:
Authorization: Bearer YOUR_API_KEY
​
Create an API Key
Go to Settings → APIs & Webhooks
Click + Create key
Configure:
Name: Descriptive name for the key
Expiration Date: When the key expires
Click Save
Copy immediately — the key is only shown once

Your API key grants access to sensitive data. Don’t share it with untrusted services. If compromised, disable it immediately and generate a new one.
​
Assign a Role to an API Key
For better security, assign a specific role to limit access:
Go to Settings → Roles
Click on the role to assign
Open the Assignment tab
Under API Keys, click + Assign to API key
Select the API key
The key will inherit that role’s permissions. See Permissions for details.
​
Manage API Keys
Regenerate: Settings → APIs & Webhooks → Click key → Regenerate
Delete: Settings → APIs & Webhooks → Click key → Delete
​
API Playground
Test your APIs directly in the browser with our built-in playground — available for both REST and GraphQL.
​
Access the Playground
Go to Settings → APIs & Webhooks
Create an API key (required)
Click on REST API or GraphQL API to open the playground
​
What You Get
Interactive documentation: Generated for your specific data model
Live testing: Execute real API calls against your workspace
Schema explorer: Browse available objects, fields, and relationships
Request builder: Construct queries with autocomplete
The playground reflects your custom objects and fields, so documentation is always accurate for your workspace.
​
Batch Operations
Both REST and GraphQL support batch operations:
Batch size: Up to 60 records per request
Operations: Create, update, delete multiple records
GraphQL-only features:
Batch Upsert: Create or update in one call
Use plural object names (e.g., CreateCompanies instead of CreateCompany)
​
Rate Limits
API requests are throttled to ensure platform stability:
Limit	Value
Requests	100 calls per minute
Batch size	60 records per call
Use batch operations to maximize throughput — process up to 60 records in a single API call instead of making individual requests.
