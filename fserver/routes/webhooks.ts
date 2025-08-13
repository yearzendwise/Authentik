import { Router } from 'express';
import { createHmac } from 'crypto';
import { db } from '../database.js';
import { emailEvents } from '../schema.js';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Resend webhook signing secret
const RESEND_WEBHOOK_SECRET = 'whsec_f0Qe1KQ1+HNNPb54UExrkndtmfOj284A';

// Function to verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Remove the 'whsec_' prefix from the secret if present
    const cleanSecret = secret.startsWith('whsec_') ? secret.substring(6) : secret;
    
    // Create HMAC signature
    const hmac = createHmac('sha256', cleanSecret);
    hmac.update(payload, 'utf8');
    const expectedSignature = hmac.digest('hex');
    
    // Resend signatures are typically in the format: sha256=<signature>
    const actualSignature = signature.startsWith('sha256=') ? signature.substring(7) : signature;
    
    // Use timing-safe comparison
    return expectedSignature === actualSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Type definitions for Resend webhook events
interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    [key: string]: any;
  };
}

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: ResendWebhookEvent['data'];
}

// Valid Resend event types
const VALID_EVENT_TYPES = [
  'email.sent',
  'email.delivered',
  'email.bounced',
  'email.failed',
  'email.opened',
  'email.clicked',
  'email.complained',
  'email.delivery_delayed',
  'email.scheduled'
] as const;

type ValidEventType = typeof VALID_EVENT_TYPES[number];

// Helper function to extract tenant ID from email metadata or domain
function extractTenantId(webhookData: ResendWebhookEvent['data']): string {
  // Try to extract tenant ID from tags/metadata if available
  if (webhookData.tags && Array.isArray(webhookData.tags)) {
    const tenantTag = webhookData.tags.find((tag: any) => 
      tag.name === 'tenant_id' || tag.key === 'tenant_id'
    );
    if (tenantTag && tenantTag.value) {
      return tenantTag.value;
    }
  }

  // Try to extract from custom headers or metadata
  if (webhookData.headers && webhookData.headers['X-Tenant-ID']) {
    return webhookData.headers['X-Tenant-ID'];
  }

  // Fallback: use a default tenant ID or extract from domain
  // This should be improved based on your tenant identification strategy
  return 'default-tenant';
}

// Helper function to extract recipient email
function extractRecipientEmail(webhookData: ResendWebhookEvent['data']): string {
  if (Array.isArray(webhookData.to) && webhookData.to.length > 0) {
    return webhookData.to[0];
  }
  if (typeof webhookData.to === 'string') {
    return webhookData.to;
  }
  return '';
}

// POST /api/webhooks/resend - Handle Resend webhook events
router.post('/resend', async (req, res) => {
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['resend-signature'] as string;
    
    // Verify webhook signature if provided
    if (signature && RESEND_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature, RESEND_WEBHOOK_SECRET);
      if (!isValid) {
        console.log('Invalid webhook signature received');
        return res.status(401).json({
          error: 'Invalid webhook signature'
        });
      }
      console.log('Webhook signature verified successfully');
    } else if (RESEND_WEBHOOK_SECRET) {
      console.log('Warning: Webhook signature not provided but secret is configured');
    }

    const payload: ResendWebhookPayload = req.body;
    
    // Validate webhook payload structure
    if (!payload || !payload.type || !payload.data) {
      return res.status(400).json({
        error: 'Invalid webhook payload structure'
      });
    }

    // Extract event type (remove 'email.' prefix if present)
    const eventType = payload.type.startsWith('email.') 
      ? payload.type.substring(6) 
      : payload.type;

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(payload.type as ValidEventType)) {
      console.log(`Received unknown event type: ${payload.type}`);
      return res.status(200).json({
        message: 'Event type not tracked',
        eventType: payload.type
      });
    }

    const webhookData = payload.data;
    
    // Extract required fields
    const emailId = webhookData.email_id;
    const tenantId = extractTenantId(webhookData);
    const recipientEmail = extractRecipientEmail(webhookData);

    if (!emailId) {
      return res.status(400).json({
        error: 'Missing email_id in webhook data'
      });
    }

    // Check for duplicate webhook (idempotency)
    const existingEvent = await db
      .select()
      .from(emailEvents)
      .where(
        and(
          eq(emailEvents.emailId, emailId),
          eq(emailEvents.eventType, eventType),
          eq(emailEvents.tenantId, tenantId)
        )
      )
      .limit(1);

    if (existingEvent.length > 0) {
      console.log(`Duplicate webhook event received: ${eventType} for email ${emailId}`);
      return res.status(200).json({
        message: 'Event already processed',
        eventId: existingEvent[0].id
      });
    }

    // Store the email event
    const [savedEvent] = await db
      .insert(emailEvents)
      .values({
        tenantId,
        emailId,
        eventType,
        eventData: JSON.stringify(payload),
        recipientEmail,
        webhookId: req.headers['x-resend-webhook-id'] as string || null,
        processed: false,
        timestamp: new Date(payload.created_at),
      })
      .returning();

    console.log(`Stored email event: ${eventType} for email ${emailId} (tenant: ${tenantId})`);

    // TODO: Process the event based on type
    await processEmailEvent(savedEvent, payload);

    res.status(200).json({
      message: 'Webhook processed successfully',
      eventId: savedEvent.id,
      eventType: eventType
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      error: 'Internal server error processing webhook'
    });
  }
});

// Function to process different email event types
async function processEmailEvent(event: any, payload: ResendWebhookPayload) {
  try {
    const eventType = event.eventType;
    const emailId = event.emailId;
    const tenantId = event.tenantId;

    console.log(`Processing ${eventType} event for email ${emailId}`);

    switch (eventType) {
      case 'sent':
        // Email was successfully sent
        console.log(`Email ${emailId} was sent successfully`);
        break;

      case 'delivered':
        // Email was delivered to recipient's inbox
        console.log(`Email ${emailId} was delivered`);
        break;

      case 'opened':
        // Email was opened by recipient
        console.log(`Email ${emailId} was opened`);
        // TODO: Update email contact engagement metrics
        break;

      case 'clicked':
        // Link in email was clicked
        console.log(`Email ${emailId} had a link clicked`);
        // TODO: Update email contact engagement metrics and track click data
        break;

      case 'bounced':
        // Email bounced - update contact status
        console.log(`Email ${emailId} bounced`);
        // TODO: Update email contact status to 'bounced'
        break;

      case 'failed':
        // Email failed to send
        console.log(`Email ${emailId} failed to send`);
        break;

      case 'complained':
        // Recipient marked email as spam
        console.log(`Email ${emailId} was marked as spam`);
        // TODO: Update email contact status to 'unsubscribed' or 'complained'
        break;

      case 'delivery_delayed':
        // Email delivery was delayed
        console.log(`Email ${emailId} delivery was delayed`);
        break;

      case 'scheduled':
        // Email was scheduled for future delivery
        console.log(`Email ${emailId} was scheduled`);
        break;

      default:
        console.log(`Unknown event type: ${eventType}`);
    }

    // Mark event as processed
    await db
      .update(emailEvents)
      .set({ processed: true })
      .where(eq(emailEvents.id, event.id));

  } catch (error) {
    console.error(`Error processing email event ${event.id}:`, error);
  }
}

// GET /api/webhooks/resend/events - Get email events for debugging/monitoring
router.get('/resend/events', async (req, res) => {
  try {
    const { 
      tenantId, 
      emailId, 
      eventType, 
      limit = '50',
      offset = '0' 
    } = req.query;

    // Build conditions array with proper typing
    const conditions: any[] = [];
    if (tenantId) conditions.push(eq(emailEvents.tenantId, tenantId as string));
    if (emailId) conditions.push(eq(emailEvents.emailId, emailId as string));
    if (eventType) conditions.push(eq(emailEvents.eventType, eventType as string));

    // Build query with proper typing
    let events;
    if (conditions.length > 0) {
      events = await db
        .select()
        .from(emailEvents)
        .where(and(...conditions))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string))
        .orderBy(desc(emailEvents.createdAt));
    } else {
      events = await db
        .select()
        .from(emailEvents)
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string))
        .orderBy(desc(emailEvents.createdAt));
    }

    res.json({
      events,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        count: events.length
      }
    });

  } catch (error) {
    console.error('Error fetching email events:', error);
    res.status(500).json({
      error: 'Internal server error fetching email events'
    });
  }
});

export { router as webhookRouter };