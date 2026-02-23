/**
 * Settings Service — User preferences management.
 */

import { prisma } from "../config/database.js";
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
  // Upsert: create if doesn't exist, update if it does
  return prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...input,
    },
    update: input,
  });
}
