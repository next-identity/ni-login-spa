import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validateToken, extractUser } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get or create current user
router.get('/me', validateToken, extractUser, async (req, res) => {
  try {
    const userIdp = req.user?.sub;
    const userEmail = req.user?.email;

    const includeOptions = {
      customerUsers: {
        include: {
          customer: true,
        },
      },
      invites: {
        where: {
          status: 'PENDING' as const,
        },
      },
    };

    // First, try to find user by idpId
    let user = await prisma.user.findUnique({
      where: { idpId: userIdp },
      include: includeOptions,
    });

    // If not found by idpId, try to find by email
    // This handles the case where a user switches OIDC providers (e.g., Auth0 to Google)
    if (!user && userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: includeOptions,
      });

      // If found by email, update the idpId to the new provider's sub
      if (user) {
        console.log(`User ${userEmail} found by email, updating idpId from ${user.idpId} to ${userIdp}`);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            idpId: userIdp!,
            // Also update name if it changed
            name: req.user?.name || user.name,
          },
          include: includeOptions,
        });
      }
    }

    // Create user if doesn't exist by either idpId or email
    if (!user) {
      user = await prisma.user.create({
        data: {
          idpId: userIdp!,
          email: userEmail!,
          name: req.user?.name,
        },
        include: includeOptions,
      });
    }

    // Check for pending invites matching user's email
    const pendingInvites = await prisma.invite.findMany({
      where: {
        email: userEmail,
        status: 'PENDING',
      },
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      customers: user.customerUsers.map((cu) => ({
        id: cu.customer.id,
        name: cu.customer.name,
        slug: cu.customer.slug,
        role: cu.role,
      })),
      pendingInvites: pendingInvites.length,
      hasCustomers: user.customerUsers.length > 0,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;

