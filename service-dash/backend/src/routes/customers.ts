import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validateToken, extractUser, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all customers for a user
router.get('/my-customers', validateToken, extractUser, async (req, res) => {
  try {
    const userIdp = req.user?.sub;
    
    // Find user by IDP ID
    const user = await prisma.user.findUnique({
      where: { idpId: userIdp },
      include: {
        customerUsers: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customers = user.customerUsers.map((cu) => ({
      id: cu.customer.id,
      name: cu.customer.name,
      slug: cu.customer.slug,
      role: cu.role,
    }));

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create a new customer
router.post('/', validateToken, extractUser, async (req, res) => {
  try {
    const { name, slug } = req.body;
    const userIdp = req.user?.sub;
    const userEmail = req.user?.email;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { idpId: userIdp },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          idpId: userIdp!,
          email: userEmail!,
          name: req.user?.name,
        },
      });
    }

    // Create customer and assign user as admin
    const customer = await prisma.customer.create({
      data: {
        name,
        slug,
        customerUsers: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        customerUsers: true,
      },
    });

    res.json({
      id: customer.id,
      name: customer.name,
      slug: customer.slug,
      role: 'ADMIN',
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get customer details
router.get('/:customerId', validateToken, extractUser, async (req, res) => {
  try {
    const { customerId } = req.params;
    const userIdp = req.user?.sub;

    // Find user
    const user = await prisma.user.findUnique({
      where: { idpId: userIdp },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has access to this customer
    const customerUser = await prisma.customerUser.findUnique({
      where: {
        userId_customerId: {
          userId: user.id,
          customerId,
        },
      },
      include: {
        customer: true,
      },
    });

    if (!customerUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: customerUser.customer.id,
      name: customerUser.customer.name,
      slug: customerUser.customer.slug,
      role: customerUser.role,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Get all users for a customer (Admin only)
router.get('/:customerId/users', validateToken, extractUser, async (req, res) => {
  try {
    const { customerId } = req.params;
    const userIdp = req.user?.sub;

    // Find user
    const user = await prisma.user.findUnique({
      where: { idpId: userIdp },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is admin of this customer
    const customerUser = await prisma.customerUser.findUnique({
      where: {
        userId_customerId: {
          userId: user.id,
          customerId,
        },
      },
    });

    if (!customerUser || customerUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view users' });
    }

    // Get all users for this customer
    const customerUsers = await prisma.customerUser.findMany({
      where: { customerId },
      include: {
        user: true,
      },
    });

    // Get pending invites for this customer
    const pendingInvites = await prisma.invite.findMany({
      where: {
        customerId,
        status: 'PENDING',
      },
    });

    res.json({
      users: customerUsers.map((cu) => ({
        id: cu.user.id,
        email: cu.user.email,
        name: cu.user.name,
        role: cu.role,
        joinedAt: cu.createdAt,
        status: 'ACTIVE',
      })),
      pendingInvites: pendingInvites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        invitedAt: invite.createdAt,
        status: invite.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching customer users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;

