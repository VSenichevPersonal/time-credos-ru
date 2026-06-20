# Webhooks

> Источник: https://docs.twenty.com/developers/extend/webhooks

Receive real-time notifications when events occur in your CRM.

## Setup

1. Navigate to **Settings → APIs & Webhooks → Webhooks**
2. Create a new webhook with a publicly accessible URL
3. The system activates immediately upon creation

---

## Supported Events

| Category | Events |
|----------|--------|
| Record Creation | `person.created`, `company.created`, `note.created` |
| Record Updates | `person.updated`, `company.updated`, `opportunity.updated` |
| Record Deletion | `person.deleted`, `company.deleted` |

---

## Payload Structure

Each POST request includes:
- **event** — event identifier (e.g., `company.created`)
- **data** — complete record data
- **timestamp** — UTC timestamp

---

## Security Validation

Two headers authenticate webhook authenticity:

| Header | Назначение |
|--------|-----------|
| `X-Twenty-Webhook-Signature` | HMAC SHA256 signature |
| `X-Twenty-Webhook-Timestamp` | Timestamp of the event |

### Validation Steps

1. Compute HMAC SHA256 using timestamp + payload + webhook secret
2. Compare against `X-Twenty-Webhook-Signature` header

---

## Response Requirements

- Respond with HTTP status **200-299** to confirm successful receipt
- Other responses register as delivery failures

---

## Alternative Approaches

- **Workflows** — custom logic with filtering and transformations
- **Workflow webhook triggers** — receive external data into Twenty
