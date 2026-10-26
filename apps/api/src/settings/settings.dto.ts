import { IsBoolean, IsOptional } from "class-validator";

export class PreferencesDto {
  @IsOptional() @IsBoolean() email?: boolean;
  @IsOptional() @IsBoolean() desktop?: boolean;
  @IsOptional() @IsBoolean() sound?: boolean;
  @IsOptional() @IsBoolean() digest?: boolean;
  @IsOptional() @IsBoolean() compact?: boolean;
}
