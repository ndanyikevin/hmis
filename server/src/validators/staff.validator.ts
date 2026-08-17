import { z } from "zod";

import { membershipRole } from "../db/membership";

export const createStaffInvitationSchema = z.object({
  email: z.email(),

  facilityId: z.uuid(),

  role: z.enum(membershipRole.enumValues),
});

export type CreateStaffInvitationInput = z.infer<
  typeof createStaffInvitationSchema
>;