import { IsIn } from "class-validator";

export const EVENT_DECISIONS = ["Approved", "Rejected"] as const;

export class EventApprovalDto {
  @IsIn([...EVENT_DECISIONS]) decision!: (typeof EVENT_DECISIONS)[number];
}
