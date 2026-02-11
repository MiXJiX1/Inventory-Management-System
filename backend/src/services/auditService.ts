
import prisma from "../config/db";

export const logAction = async (
    userId: string | undefined,
    action: string,
    entity: string,
    entityId: string | undefined,
    details?: any
) => {
    try {
        if (!userId) {
            console.warn("Audit log attempted without userId", { action, entity, entityId });
            return;
        }

        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details: details ? JSON.stringify(details) : null,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
};
