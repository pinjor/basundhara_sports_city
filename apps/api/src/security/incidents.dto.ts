import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { SEVERITIES, WORKFLOWS } from "@bsc/shared";

const STATUSES = Object.keys(WORKFLOWS.incident.transitions);

export class CreateIncidentDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsIn([...SEVERITIES]) severity!: string;
  @IsOptional() @IsUUID() eventPackId?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}

export class UpdateIncidentDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @IsOptional() @IsIn([...SEVERITIES]) severity?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}

export class IncidentStatusDto {
  @IsIn(STATUSES) status!: string;
}
