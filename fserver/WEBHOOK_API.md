# Resend Webhook API Documentation

This document describes the webhook endpoints available in the fserver for handling Resend email events.

## Webhook Endpoint

### POST `/api/webhooks/resend`

Receives webhook events from Resend email service.

**Supported Event Types:**
- `email.sent` - Email was successfully sent
- `email.delivered` - Email was delivered to recipient's inbox
- `email.bounced` - Email bounced (recipient address invalid/unreachable)
- `email.failed` - Email failed to send
- `email.opened` - Email was opened by recipient
- `email.clicked` - Link in email was clicked
- `email.complained` - Recipient marked email as spam
- `email.delivery_delayed` - Email delivery was delayed
- `email.scheduled` - Email was scheduled for future delivery

**Request Headers:**
- `Content-Type: application/json`
- `X-Resend-Webhook-ID` (optional) - Webhook ID for deduplication
- `Resend-Signature` (recommended) - HMAC SHA256 signature for webhook verification

**Request Body Example:**
```json
{
  "type": "email.delivered",
  "created_at": "2025-08-11T17:00:00.000Z",
  "data": {
    "email_id": "re_abc123def456",
    "from": "noreply@example.com",
    "to": ["user@example.com"],
    "subject": "Welcome to our service",
    "created_at": "2025-08-11T16:55:00.000Z"
  }
}
```

**Response:**
- `200 OK` - Event processed successfully
- `400 Bad Request` - Invalid payload structure
- `401 Unauthorized` - Invalid webhook signature
- `500 Internal Server Error` - Processing error

**Success Response Example:**
```json
{
  "message": "Webhook processed successfully",
  "eventId": "evt_abc123def456",
  "eventType": "delivered"
}
```

## Event Monitoring Endpoint

### GET `/api/webhooks/resend/events`

Retrieves stored email events for debugging and monitoring.

**Query Parameters:**
- `tenantId` (optional) - Filter by tenant ID
- `emailId` (optional) - Filter by specific email ID
- `eventType` (optional) - Filter by event type
- `limit` (optional, default: 50) - Number of events to return
- `offset` (optional, default: 0) - Pagination offset

**Response Example:**
```json
{
  "events": [
    {
      "id": "evt_abc123def456",
      "tenantId": "tenant_123",
      "emailId": "re_abc123def456",
      "eventType": "delivered",
      "eventData": "{\"type\":\"email.delivered\",\"data\":{...}}",
      "recipientEmail": "user@example.com",
      "timestamp": "2025-08-11T17:00:00.000Z",
      "webhookId": "wh_abc123",
      "processed": true,
      "createdAt": "2025-08-11T17:00:01.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

## Tenant ID Extraction

The webhook handler attempts to extract tenant ID from:
1. Resend email tags (looking for `tenant_id` tag)
2. Custom headers (`X-Tenant-ID`)
3. Falls back to `default-tenant`

## Database Schema

Events are stored in the `email_events` table:

```sql
CREATE TABLE email_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL,
  email_id VARCHAR NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL,
  recipient_email TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  webhook_id VARCHAR,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Setup Instructions

1. **Configure Resend Webhook:**
   - Go to your Resend dashboard
   - Navigate to Webhooks section
   - Add new webhook with URL: `https://your-domain.com/api/webhooks/resend`
   - Select the email events you want to track

2. **Security (Implemented):**
   - Webhook signature verification is configured with secret: `whsec_f0Qe1KQ1+HNNPb54UExrkndtmfOj284A`
   - HMAC SHA256 signature verification for all incoming webhooks
   - Use HTTPS for webhook URL in production
   - Consider IP whitelist for Resend webhook IPs

3. **Monitoring:**
   - Check webhook processing logs in fserver console
   - Use the events endpoint to monitor stored events
   - Set up alerts for failed webhook processing

## Event Processing

Each webhook event triggers:
1. Payload validation
2. Duplicate event checking (idempotency)
3. Event storage in database
4. Event-specific processing (bounces, opens, clicks, etc.)
5. Marking event as processed

Future enhancements may include:
- Updating email contact statuses based on bounces/complaints
- Tracking engagement metrics (opens/clicks)
- Integration with email campaign analytics