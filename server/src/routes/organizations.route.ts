import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { requireAuth } from "../middleware/auth.middleware";
import { requireMembership } from "../middleware/membership.middleware";
import { requireFacilityAccess } from "../middleware/facility.middleware";
import { requireRole } from "../middleware/role.middleware";
import {
  organizations,
  facilities,
  memberships,
} from "../db/schema";

import { eq } from "drizzle-orm";

const createOrganizationSchema = z.object({
  organization: z.object({
    name: z.string().trim().min(2).max(100),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers, and hyphens",
      ),
  }),

  facility: z.object({
    name: z.string().trim().min(2).max(150),
    code: z
      .string()
      .trim()
      .min(2)
      .max(20)
      .regex(
        /^[A-Z0-9-]+$/,
        "Facility code must contain only uppercase letters, numbers, and hyphens",
      ),
    type: z.enum([
      "hospital",
      "clinic",
      "medical_center",
      "health_center",
    ]),

    careType: z.enum([
      "outpatient",
      "inpatient",
      "both",
    ]),
  }),
});

export const organizationRoutes = new Hono().post(
  "/", requireAuth,
  async (c) => {
    const user = c.get("user");

    const body = await c.req.json();

    const result = createOrganizationSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid request",
          errors: result.error.issues,
        },
        400,
      );
    }

    const { organization, facility } = result.data;

    // 3. Create everything in one transaction
    const resultData = await db.transaction(async (tx) => {
      const [createdOrganization] = await tx
        .insert(organizations)
        .values({
          name: organization.name,
          slug: organization.slug,
        })
        .returning();

      if (!createdOrganization) {
        throw new Error("Failed to create organization");
      }

      const [createdFacility] = await tx
        .insert(facilities)
        .values({
            organizationId: createdOrganization.id,
            name: facility.name,
            code: facility.code,
            type: facility.type,
            careType: facility.careType,
          })
        .returning();

      if (!createdFacility) {
        throw new Error("Failed to create facility");
      }

      const [membership] = await tx
        .insert(memberships)
        .values({
          userId: user.id,
          organizationId: createdOrganization.id,
          facilityId: createdFacility.id,
          role: "organization_admin",
        })
        .returning();

      if (!membership) {
        throw new Error("Failed to create organization membership");
      }

      return {
        organization: createdOrganization,
        facility: createdFacility,
        membership,
      };
    });

    return c.json(
      {
        success: true,
        data: resultData,
      },
      201,
    );
  },
)
 .get("/", requireAuth, async (c) => {

    const user = c.get("user");
  
    
    const userMemberships = await db
      .select({
        membershipId: memberships.id,
        role: memberships.role,
        membershipStatus: memberships.status,

        organizationId: organizations.id,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,

        facilityId: facilities.id,
        facilityName: facilities.name,
        facilityCode: facilities.code,
        facilityType: facilities.type,
        facilityCareType: facilities.careType,
      })
      .from(memberships)
      .innerJoin(
        organizations,
        eq(memberships.organizationId, organizations.id),
      )
      .leftJoin(
        facilities,
        eq(memberships.facilityId, facilities.id),
      )
      .where(eq(memberships.userId, user.id));

    return c.json({
      success: true,
      data: userMemberships,
    });
  })
  .get(
  "/test-access",
  requireAuth,
  requireMembership,
  (c) => {
    const user = c.get("user");
    const membership = c.get("membership");

    return c.json({
      success: true,
      message: "Access granted",
      data: {
        userId: user.id,
        membershipId: membership.id,
        organizationId: membership.organizationId,
        facilityId: membership.facilityId,
        role: membership.role,
      },
    });
  },
)
.get(
  "/test-facility-access",
  requireAuth,
  requireMembership,
  requireFacilityAccess,
  (c) => {
    const user = c.get("user");
    const membership = c.get("membership");

    return c.json({
      success: true,
      message: "Facility access granted",
      data: {
        userId: user.id,
        membershipId: membership.id,
        organizationId: membership.organizationId,
        facilityId: membership.facilityId,
        role: membership.role,
      },
    });
  },
)
.get(
  "/test-admin",
  requireAuth,
  requireMembership,
  requireFacilityAccess,
  requireRole("organization_admin"),
  (c) => {
    const user = c.get("user");
    const membership = c.get("membership");

    return c.json({
      success: true,
      message: "You are an organization administrator",
      data: {
        userId: user.id,
        membershipId: membership.id,
        role: membership.role,
      },
    });
  },
);