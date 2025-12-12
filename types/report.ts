import { User } from "./user";

export type ReportReason = "offensive_content" | "spam" | "harassment" | "other";
export type ResourceType = "user" | "list";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "rejected";

export interface Report {
  id: string;
  reporterId: string;
  resourceType: ResourceType;
  resourceId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  reportedUser?: Pick<User, "id" | "username" | "displayName" | "avatar">;
}

export interface CreateReportDTO {
  resourceType: ResourceType;
  resourceId: string;
  reason: ReportReason;
  description?: string;
}

