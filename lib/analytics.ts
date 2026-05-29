import { MarketplaceData, UserRole } from "./types";

export function monthlyActiveUsers(data: MarketplaceData, role?: UserRole) {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - 30);

  const activeUserIds = new Set(
    data.activityEvents
      .filter((event) => {
        const happenedAt = new Date(event.createdAt);
        return happenedAt >= windowStart && happenedAt <= now && (!role || event.role === role);
      })
      .map((event) => event.userId)
  );

  return activeUserIds.size;
}

export function activityCount(data: MarketplaceData, role?: UserRole) {
  return data.activityEvents.filter((event) => !role || event.role === role).length;
}

export function activeOrders(data: MarketplaceData) {
  return data.orders.filter((order) => order.status === "active" || order.status === "delivered" || order.status === "revision").length;
}
