/**
 * Settings Service — User preferences management.
 */

import { prisma } from "../config/database.js";
import { ForbiddenError } from "../utils/errors.js";
import * as creditsService from "./credits.service.js";
import type { UpdateSettingsInput } from "../validators/settings.schema.js";

export async function getSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId },
    });
  }

  return settings;
}

export async function updateSettings(userId: string, input: UpdateSettingsInput) {
  // Cloud recording is Business plan only
  if (input.cloudRecordingEnabled === true) {
    const balance = await creditsService.getBalance(userId);
    if (!balance.hasBusinessPlan) {
      throw new ForbiddenError("Cloud recording is only available on the Business plan.");
    }
  }

  // Only pass defined keys so Prisma doesn't receive undefined
  const updateData = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  ) as UpdateSettingsInput;

  if (Object.keys(updateData).length === 0) {
    return prisma.userSettings.findUniqueOrThrow({ where: { userId } });
  }

  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...updateData },
    update: updateData,
  });
}
