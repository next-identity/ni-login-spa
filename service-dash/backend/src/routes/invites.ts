import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validateToken, extractUser } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get pending invites for current user
router.get('/pending', validateToken, extractUser, async (req, res) => {
  try {
    const userEmail = req.user?.email;

    const invites = await prisma.invite.findMany({
      where: {
        email: userEmail,
        status: 'PENDING',
      },
    });

    res.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

// Create invite (admin only)
router.post('/', validateToken, extractUser, async (req, res) => {
  try {
    const { email, customerId, role = 'READ_ONLY' } = req.body;
    const userIdp = req.user?.sub;

    if (!email || !customerId) {
      return res.status(400).json({ error: 'Email and customer ID are required' });
    }

    // Find inviter
    const inviter = await prisma.user.findUnique({
      where: { idpId: userIdp },
    });

    if (!inviter) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if inviter is admin of the customer
    const customerUser = await prisma.customerUser.findUnique({
      where: {
        userId_customerId: {
          userId: inviter.id,
          customerId,
        },
      },
    });

    if (!customerUser || customerUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can send invites' });
    }

    // Create or update user for the invited email
    let invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    // Create invite
    const invite = await prisma.invite.create({
      data: {
        email,
        customerId,
        role,
        inviterId: inviter.id,
        status: 'PENDING',
      },
    });

    res.json(invite);
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// Accept invite
router.post('/:inviteId/accept', validateToken, extractUser, async (req, res) => {
  try {
    const { inviteId } = req.params;
    const userIdp = req.user?.sub;
    const userEmail = req.user?.email;

    // Find user
    const user = await prisma.user.findUnique({
      where: { idpId: userIdp },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find invite
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.email !== userEmail) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invite already processed' });
    }

    // Create customer user and update invite
    await prisma.$transaction([
      prisma.customerUser.create({
        data: {
          userId: user.id,
          customerId: invite.customerId,
          role: invite.role,
        },
      }),
      prisma.invite.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    res.json({ message: 'Invite accepted' });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// Decline invite
router.post('/:inviteId/decline', validateToken, extractUser, async (req, res) => {
  try {
    const { inviteId } = req.params;
    const userEmail = req.user?.email;

    // Find invite
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.email !== userEmail) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invite already processed' });
    }

    // Update invite status
    await prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'DECLINED' },
    });

    res.json({ message: 'Invite declined' });
  } catch (error) {
    console.error('Error declining invite:', error);
    res.status(500).json({ error: 'Failed to decline invite' });
  }
});

export default router;

