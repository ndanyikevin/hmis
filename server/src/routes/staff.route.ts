import { Hono } from "hono";

import { requireAuth } from "../middleware/auth.middleware";
import { requireMembership } from "../middleware/membership.middleware";
import { requireFacilityAccess } from "../middleware/facility.middleware";
import { requireRole } from "../middleware/role.middleware";

import { db } from "../db";
import { staffInvitations, memberships } from "../db/schema";

import { createStaffInvitationSchema } from "../validators/staff.validator";
import { generateInvitationToken } from "../lib/invitation";

import { eq } from "drizzle-orm";

export const staffRoute = new Hono()

  // ============================================================
  // CREATE STAFF INVITATION
  // ============================================================

  .post(
    "/invitations",
    requireAuth,
    requireMembership,
    requireFacilityAccess,
    requireRole(
      "organization_admin",
      "facility_admin",
    ),
    async (c) => {
      const user = c.get("user");
      const membership = c.get("membership");

      const body = await c.req.json();

      const result =
        createStaffInvitationSchema.safeParse(body);

      if (!result.success) {
        return c.json(
          {
            success: false,
            message: "Invalid request",
            errors: result.error.flatten(),
          },
          400,
        );
      }

      const { email, facilityId, role } = result.data;

      // Make sure the admin can only invite
      // staff into their current facility.
      if (facilityId !== membership.facilityId) {
        return c.json(
          {
            success: false,
            message:
              "You cannot invite staff to this facility",
          },
          403,
        );
      }

      const token = generateInvitationToken();

      const [invitation] = await db
        .insert(staffInvitations)
        .values({
          email,
          organizationId: membership.organizationId,
          facilityId,
          role,
          token,
          invitedBy: user.id,

          expiresAt: new Date(
            Date.now() +
              1000 * 60 * 60 * 24 * 7,
          ),
        })
        .returning();

      if (!invitation) {
        return c.json(
          {
            success: false,
            message:
              "Failed to create staff invitation",
          },
          500,
        );
      }

      return c.json(
        {
          success: true,
          data: {
            id: invitation.id,
            email: invitation.email,
            facilityId: invitation.facilityId,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
          },
        },
        201,
      );
    },
  )

  // ============================================================
  // GET INVITATION
  // ============================================================

  .get(
    "/invitations/:token",
    async (c) => {
      const token = c.req.param("token");

      const [invitation] = await db
        .select({
          id: staffInvitations.id,
          email: staffInvitations.email,
          organizationId:
            staffInvitations.organizationId,
          facilityId: staffInvitations.facilityId,
          role: staffInvitations.role,
          status: staffInvitations.status,
          expiresAt: staffInvitations.expiresAt,
        })
        .from(staffInvitations)
        .where(
          eq(staffInvitations.token, token),
        )
        .limit(1);

      if (!invitation) {
        return c.json(
          {
            success: false,
            message: "Invitation not found",
          },
          404,
        );
      }

      if (invitation.status !== "pending") {
        return c.json(
          {
            success: false,
            message:
              "This invitation is no longer valid",
          },
          410,
        );
      }

      if (invitation.expiresAt < new Date()) {
        return c.json(
          {
            success: false,
            message:
              "This invitation has expired",
          },
          410,
        );
      }

      return c.json({
        success: true,
        data: {
          invitationId: invitation.id,
          email: invitation.email,
          organizationId:
            invitation.organizationId,
          facilityId: invitation.facilityId,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      });
    },
  )

  // ============================================================
  // ACCEPT STAFF INVITATION
  // ============================================================

  .post(
    "/invitations/:token/accept",
    requireAuth,
    async (c) => {
      const token = c.req.param("token");
      const user = c.get("user");

      // --------------------------------------------------------
      // Find invitation
      // --------------------------------------------------------

      const [invitation] = await db
        .select()
        .from(staffInvitations)
        .where(
          eq(staffInvitations.token, token),
        )
        .limit(1);

      if (!invitation) {
        return c.json(
          {
            success: false,
            message: "Invitation not found",
          },
          404,
        );
      }

      // --------------------------------------------------------
      // Check invitation status
      // --------------------------------------------------------

      if (invitation.status !== "pending") {
        return c.json(
          {
            success: false,
            message:
              "This invitation is no longer valid",
          },
          410,
        );
      }

      // --------------------------------------------------------
      // Check expiration
      // --------------------------------------------------------

      if (invitation.expiresAt < new Date()) {
        return c.json(
          {
            success: false,
            message:
              "This invitation has expired",
          },
          410,
        );
      }

      // --------------------------------------------------------
      // Check email
      // --------------------------------------------------------

      if (
        user.email.toLowerCase() !==
        invitation.email.toLowerCase()
      ) {
        return c.json(
          {
            success: false,
            message:
              "This invitation was sent to a different email address",
          },
          403,
        );
      }

      // --------------------------------------------------------
      // Create membership + accept invitation atomically
      // --------------------------------------------------------

      const result = await db.transaction(
        async (tx) => {
          const [membership] = await tx
            .insert(memberships)
            .values({
              userId: user.id,
              organizationId:
                invitation.organizationId,
              facilityId:
                invitation.facilityId,
              role: invitation.role,
              status: "active",
            })
            .returning();

          if (!membership) {
            throw new Error(
              "Failed to create membership",
            );
          }

          const [updatedInvitation] =
            await tx
              .update(staffInvitations)
              .set({
                status: "accepted",
                acceptedAt: new Date(),
              })
              .where(
                eq(
                  staffInvitations.id,
                  invitation.id,
                ),
              )
              .returning();

          if (!updatedInvitation) {
            throw new Error(
              "Failed to update invitation",
            );
          }

          return membership;
        },
      );

      // --------------------------------------------------------
      // Success response
      // --------------------------------------------------------

      return c.json(
        {
          success: true,
          message:
            "Invitation accepted successfully",
          data: {
            membershipId: result.id,
            organizationId:
              result.organizationId,
            facilityId:
              result.facilityId,
            role: result.role,
          },
        },
        201,
      );
    },
  );