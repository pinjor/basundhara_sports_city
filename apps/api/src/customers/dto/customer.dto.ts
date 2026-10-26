import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { SeatPickDto } from "../../ticketing/dto/ticketing.dto";

const BD_MOBILE = /^01[3-9]\d{8}$/;
const BD_MOBILE_MESSAGE = "mobile must be a Bangladesh mobile number (01XXXXXXXXX)";

export class RegisterCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  @MaxLength(120)
  email!: string;

  @Matches(BD_MOBILE, { message: BD_MOBILE_MESSAGE })
  mobile!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

export class CustomerLoginDto {
  /** Email address or mobile number. */
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  login!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @Matches(BD_MOBILE, { message: BD_MOBILE_MESSAGE })
  mobile?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

export class CustomerTicketOrderDto {
  @IsString()
  eventId!: string;

  @Equals(true, { message: "termsAccepted must be true" })
  termsAccepted!: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => SeatPickDto)
  seats!: SeatPickDto[];
}

export class CustomerPayDto {
  @IsIn(["CARD", "BKASH", "NAGAD"])
  method!: string;

  /** Honoured only while sandbox payments are enabled. */
  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}

export class CustomerCancelOrderDto {
  @IsString()
  @MinLength(3)
  @MaxLength(240)
  reason!: string;
}

export class CustomerBookingDto {
  @IsString()
  slotId!: string;

  /** Day of play, YYYY-MM-DD. */
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}
