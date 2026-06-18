import { prisma } from './prisma'

/**
 * Utility function to automatically log activities in the database
 */
export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details,
      },
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // We don't throw the error because failing to log shouldn't break the main action
  }
}
