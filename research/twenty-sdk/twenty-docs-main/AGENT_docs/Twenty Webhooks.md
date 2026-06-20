Webhooks
Receive real-time notifications when events occur in your CRM.

Webhooks push data to your systems in real-time when events occur in Twenty — no polling required. Use them to keep external systems in sync, trigger automations, or send alerts.
​
Create a Webhook
Go to Settings → APIs & Webhooks → Webhooks
Click + Create webhook
Enter your webhook URL (must be publicly accessible)
Click Save
The webhook activates immediately and starts sending notifications.

​
Manage Webhooks
Edit: Click the webhook → Update URL → Save
Delete: Click the webhook → Delete → Confirm
​
Events
Twenty sends webhooks for these event types:
Event	Example
Record Created	person.created, company.created, note.created
Record Updated	person.updated, company.updated, opportunity.updated
Record Deleted	person.deleted, company.deleted
All event types are sent to your webhook URL. Event filtering may be added in future releases.
​
Payload Format
Each webhook sends an HTTP POST with a JSON body:
{
  "event": "person.created",
  "data": {
    "id": "abc12345",
    "firstName": "Alice",
    "lastName": "Doe",
    "email": "alice@example.com",
    "createdAt": "2025-02-10T15:30:45Z",
    "createdBy": "user_123"
  },
  "timestamp": "2025-02-10T15:30:50Z"
}
Field	Description
event	What happened (e.g., person.created)
data	The full record that was created/updated/deleted
timestamp	When the event occurred (UTC)
Respond with a 2xx HTTP status (200-299) to acknowledge receipt. Non-2xx responses are logged as delivery failures.
​
Webhook Validation
Twenty signs each webhook request for security. Validate signatures to ensure requests are authentic.
​
Headers
Header	Description
X-Twenty-Webhook-Signature	HMAC SHA256 signature
X-Twenty-Webhook-Timestamp	Request timestamp
​
Validation Steps
Get the timestamp from X-Twenty-Webhook-Timestamp
Create the string: {timestamp}:{JSON payload}
Compute HMAC SHA256 using your webhook secret
Compare with X-Twenty-Webhook-Signature
​
Example (Node.js)
const crypto = require("crypto");

const timestamp = req.headers["x-twenty-webhook-timestamp"];
const payload = JSON.stringify(req.body);
const secret = "your-webhook-secret";

const stringToSign = `${timestamp}:${payload}`;
const expectedSignature = crypto
  .createHmac("sha256", secret)
  .update(stringToSign)
  .digest("hex");

const isValid = expectedSignature === req.headers["x-twenty-webhook-signature"];
​
Webhooks vs Workflows
Method	Direction	Use Case
Webhooks	OUT	Automatically notify external systems of any record change
Workflow + HTTP Request	OUT	Send data out with custom logic (filters, transformations)
Workflow Webhook Trigger	IN	Receive data into Twenty from external systems
