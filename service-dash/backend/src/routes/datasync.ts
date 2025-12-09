import express from 'express';
import { validateToken, extractUser } from '../middleware/auth';

const router = express.Router();

// DataSync API configuration
const DATASYNC_URL = process.env.DATASYNC_URL;
const DATASYNC_API_KEY = process.env.DATASYNC_API_KEY;

// Helper to make requests to DataSync API
async function datasyncRequest(
  method: string,
  path: string,
  body?: any,
  customerId?: string
): Promise<{ status: number; data: any }> {
  if (!DATASYNC_URL || !DATASYNC_API_KEY) {
    throw new Error('DataSync configuration missing. Set DATASYNC_URL and DATASYNC_API_KEY environment variables.');
  }

  const url = `${DATASYNC_URL.replace(/\/$/, '')}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': DATASYNC_API_KEY,
  };

  // Add customer ID header if provided
  if (customerId) {
    headers['x-customer-id'] = customerId;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  return { status: response.status, data };
}

// ============================================
// Health Check
// ============================================

// GET /datasync/health - Check DataSync service health
router.get('/health', validateToken, extractUser, async (req, res) => {
  try {
    const deep = req.query.deep === 'true';
    const { status, data } = await datasyncRequest('GET', `/health${deep ? '?deep=true' : ''}`);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync health check error:', error);
    res.status(500).json({ error: error.message || 'Failed to check DataSync health' });
  }
});

// ============================================
// Customer Configuration
// ============================================

// GET /datasync/config/customers - List all customers
router.get('/config/customers', validateToken, extractUser, async (req, res) => {
  try {
    const { limit, nextToken } = req.query;
    let path = '/config/customers';
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (nextToken) params.append('nextToken', String(nextToken));
    if (params.toString()) path += `?${params.toString()}`;

    const { status, data } = await datasyncRequest('GET', path);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync list customers error:', error);
    res.status(500).json({ error: error.message || 'Failed to list customers' });
  }
});

// GET /datasync/config/customer/:customerId - Get customer configuration
router.get('/config/customer/:customerId', validateToken, extractUser, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, data } = await datasyncRequest('GET', `/config/customer/${customerId}`);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync get customer config error:', error);
    res.status(500).json({ error: error.message || 'Failed to get customer configuration' });
  }
});

// PUT /datasync/config/customer/:customerId - Create/Update customer configuration
router.put('/config/customer/:customerId', validateToken, extractUser, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, data } = await datasyncRequest('PUT', `/config/customer/${customerId}`, req.body);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync update customer config error:', error);
    res.status(500).json({ error: error.message || 'Failed to update customer configuration' });
  }
});

// DELETE /datasync/config/customer/:customerId - Delete customer configuration
router.delete('/config/customer/:customerId', validateToken, extractUser, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, data } = await datasyncRequest('DELETE', `/config/customer/${customerId}`);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync delete customer config error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete customer configuration' });
  }
});

// ============================================
// Plan Management
// ============================================

// GET /datasync/config/plans - List available plans
router.get('/config/plans', validateToken, extractUser, async (req, res) => {
  try {
    const { status, data } = await datasyncRequest('GET', '/config/plans');
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync list plans error:', error);
    res.status(500).json({ error: error.message || 'Failed to list plans' });
  }
});

// GET /datasync/config/customer/:customerId/plan - Get customer plan
router.get('/config/customer/:customerId/plan', validateToken, extractUser, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, data } = await datasyncRequest('GET', `/config/customer/${customerId}/plan`);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync get customer plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to get customer plan' });
  }
});

// PUT /datasync/config/customer/:customerId/plan - Assign plan to customer
router.put('/config/customer/:customerId/plan', validateToken, extractUser, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, data } = await datasyncRequest('PUT', `/config/customer/${customerId}/plan`, req.body);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync assign plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to assign plan' });
  }
});

// ============================================
// Transform Rules
// ============================================

// GET /datasync/config/transform-rules - List transform rules
router.get('/config/transform-rules', validateToken, extractUser, async (req, res) => {
  try {
    const { sourceSystem, limit, nextToken } = req.query;
    const customerId = req.headers['x-customer-id'] as string | undefined;
    
    let path = '/config/transform-rules';
    const params = new URLSearchParams();
    if (sourceSystem) params.append('sourceSystem', String(sourceSystem));
    if (limit) params.append('limit', String(limit));
    if (nextToken) params.append('nextToken', String(nextToken));
    if (params.toString()) path += `?${params.toString()}`;

    const { status, data } = await datasyncRequest('GET', path, undefined, customerId);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync list transform rules error:', error);
    res.status(500).json({ error: error.message || 'Failed to list transform rules' });
  }
});

// POST /datasync/config/transform-rule - Create transform rule
router.post('/config/transform-rule', validateToken, extractUser, async (req, res) => {
  try {
    const customerId = req.headers['x-customer-id'] as string;
    if (!customerId) {
      return res.status(400).json({ error: 'x-customer-id header required' });
    }
    const { status, data } = await datasyncRequest('POST', '/config/transform-rule', req.body, customerId);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync create transform rule error:', error);
    res.status(500).json({ error: error.message || 'Failed to create transform rule' });
  }
});

// GET /datasync/config/transform-rule/:ruleId - Get transform rule
router.get('/config/transform-rule/:ruleId', validateToken, extractUser, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const customerId = req.headers['x-customer-id'] as string | undefined;
    const { status, data } = await datasyncRequest('GET', `/config/transform-rule/${ruleId}`, undefined, customerId);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync get transform rule error:', error);
    res.status(500).json({ error: error.message || 'Failed to get transform rule' });
  }
});

// PUT /datasync/config/transform-rule/:ruleId - Update transform rule
router.put('/config/transform-rule/:ruleId', validateToken, extractUser, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const customerId = req.headers['x-customer-id'] as string;
    if (!customerId) {
      return res.status(400).json({ error: 'x-customer-id header required' });
    }
    const { status, data } = await datasyncRequest('PUT', `/config/transform-rule/${ruleId}`, req.body, customerId);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync update transform rule error:', error);
    res.status(500).json({ error: error.message || 'Failed to update transform rule' });
  }
});

// DELETE /datasync/config/transform-rule/:ruleId - Delete transform rule
router.delete('/config/transform-rule/:ruleId', validateToken, extractUser, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const customerId = req.headers['x-customer-id'] as string;
    if (!customerId) {
      return res.status(400).json({ error: 'x-customer-id header required' });
    }
    const { status, data } = await datasyncRequest('DELETE', `/config/transform-rule/${ruleId}`, undefined, customerId);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync delete transform rule error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete transform rule' });
  }
});

// ============================================
// Usage Statistics
// ============================================

// GET /datasync/usage/customer/:customerId - Get customer usage
router.get('/usage/customer/:customerId', validateToken, extractUser, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { windowId, startWindow, endWindow } = req.query;
    
    let path = `/usage/customer/${customerId}`;
    const params = new URLSearchParams();
    if (windowId) params.append('windowId', String(windowId));
    if (startWindow) params.append('startWindow', String(startWindow));
    if (endWindow) params.append('endWindow', String(endWindow));
    if (params.toString()) path += `?${params.toString()}`;

    const { status, data } = await datasyncRequest('GET', path);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync get usage error:', error);
    res.status(500).json({ error: error.message || 'Failed to get usage statistics' });
  }
});

// ============================================
// Idempotency
// ============================================

// GET /datasync/idempotency/:eventId - Get idempotency status
router.get('/idempotency/:eventId', validateToken, extractUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, data } = await datasyncRequest('GET', `/idempotency/${eventId}`);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync get idempotency status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get idempotency status' });
  }
});

// ============================================
// Dead Letter Queue (DLQ) Management
// ============================================

// GET /datasync/dlq/:queueName/stats - Get DLQ statistics
router.get('/dlq/:queueName/stats', validateToken, extractUser, async (req, res) => {
  try {
    const { queueName } = req.params;
    const { status, data } = await datasyncRequest('GET', `/dlq/${queueName}/stats`);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync get DLQ stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get DLQ statistics' });
  }
});

// GET /datasync/dlq/:queueName - List DLQ messages
router.get('/dlq/:queueName', validateToken, extractUser, async (req, res) => {
  try {
    const { queueName } = req.params;
    const { maxMessages } = req.query;
    
    let path = `/dlq/${queueName}`;
    if (maxMessages) path += `?maxMessages=${maxMessages}`;

    const { status, data } = await datasyncRequest('GET', path);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync list DLQ messages error:', error);
    res.status(500).json({ error: error.message || 'Failed to list DLQ messages' });
  }
});

// POST /datasync/dlq/:queueName/resend - Resend DLQ message
router.post('/dlq/:queueName/resend', validateToken, extractUser, async (req, res) => {
  try {
    const { queueName } = req.params;
    const { status, data } = await datasyncRequest('POST', `/dlq/${queueName}/resend`, req.body);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync resend DLQ message error:', error);
    res.status(500).json({ error: error.message || 'Failed to resend DLQ message' });
  }
});

// POST /datasync/dlq/:queueName/resend-all - Resend all DLQ messages
router.post('/dlq/:queueName/resend-all', validateToken, extractUser, async (req, res) => {
  try {
    const { queueName } = req.params;
    const { status, data } = await datasyncRequest('POST', `/dlq/${queueName}/resend-all`);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync resend all DLQ messages error:', error);
    res.status(500).json({ error: error.message || 'Failed to resend all DLQ messages' });
  }
});

// DELETE /datasync/dlq/:queueName/message - Delete DLQ message
router.delete('/dlq/:queueName/message', validateToken, extractUser, async (req, res) => {
  try {
    const { queueName } = req.params;
    const { receiptHandle } = req.query;
    
    if (!receiptHandle) {
      return res.status(400).json({ error: 'receiptHandle query parameter required' });
    }

    const { status, data } = await datasyncRequest(
      'DELETE', 
      `/dlq/${queueName}/message?receiptHandle=${encodeURIComponent(String(receiptHandle))}`
    );
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync delete DLQ message error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete DLQ message' });
  }
});

// DELETE /datasync/dlq/:queueName/purge - Purge DLQ
router.delete('/dlq/:queueName/purge', validateToken, extractUser, async (req, res) => {
  try {
    const { queueName } = req.params;
    const { status, data } = await datasyncRequest('DELETE', `/dlq/${queueName}/purge`);
    res.status(status).json(data);
  } catch (error: any) {
    console.error('DataSync purge DLQ error:', error);
    res.status(500).json({ error: error.message || 'Failed to purge DLQ' });
  }
});

export default router;

