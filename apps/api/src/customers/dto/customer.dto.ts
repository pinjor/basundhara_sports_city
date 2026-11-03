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
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { SeatPickDto } from "../../ticketing/dto/ticketing.dto";

const BD_MOBILE = /^01[3-9]\d{8}$/;
const BD_MOBILE_MESSAGE = "mobile must be a Bangladesh mobile number (01XXXXXXXXX)";
const PAY_METHODS = ["CARD", "BKASH", "NAGAD"];

export class ConsentDto {
  @IsString()
  @MaxLength(80)
  purpose!: string;

  @IsBoolean()
  granted!: boolean;

  @IsDateString()
  at!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  language?: string;
}

/** Identity and consent details collected at sign-up. The full ID number never leaves the phone. */
export class CustomerIdentityDto {
  @IsOptional()
  @IsIn(["NID", "Passport"])
  idType?: string;

  @IsOptional()
  @Matches(/^[A-Za-z0-9]{4}$/, { message: "idLast4 must be the last 4 characters of the ID" })
  idLast4?: string;

  /** Date of birth, YYYY-MM-DD. */
  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  guardianName?: string;

  @IsOptional()
  @Matches(BD_MOBILE, { message: BD_MOBILE_MESSAGE })
  guardianMobile?: string;

  @IsOptional()
  @IsBoolean()
  biometricConsent?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ConsentDto)
  consents?: ConsentDto[];
}

export class RegisterCustomerDto extends CustomerIdentityDto {
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

export class UpdateCustomerDto extends CustomerIdentityDto {
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

  @IsOptional()
  @IsBoolean()
  faceEnrolled?: boolean;
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

  /** Exact seats from the seat map. Leave out and send `sectionId` + `quantity` for best available. */
  @ValidateIf((dto: CustomerTicketOrderDto) => !dto.sectionId)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => SeatPickDto)
  seats?: SeatPickDto[];

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  quantity?: number;
}

export class CustomerPayDto {
  @IsIn(PAY_METHODS)
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

export class PurchaseMembershipDto {
  @IsString()
  @MaxLength(40)
  planCode!: string;

  @IsIn(PAY_METHODS)
  method!: string;

  /** Honoured only while sandbox payments are enabled. */
  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}

export class CorporateMembershipDto {
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  code!: string;
}

export class UpdateMembershipDto {
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  /** Family plan: names of the people sharing it. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(80, { each: true })
  holders?: string[];
}

export class FoodLineDto {
  @IsString()
  menuItemId!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  qty!: number;
}

export class FoodOrderDto {
  @IsString()
  outletId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => FoodLineDto)
  lines!: FoodLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}

export class ParkingPassDto {
  @IsString()
  parkingZoneId!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  plateNumber?: string;
}

export class RideRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  from!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  to!: string;

  @IsInt()
  @Min(1)
  @Max(6)
  riders!: number;
}

export class LoungeHoldDto {
  @IsString()
  loungeId!: string;

  /** "Now" or HH:mm. */
  @Matches(/^(Now|([01]\d|2[0-3]):[0-5]\d)$/, { message: "arrival must be Now or HH:mm" })
  arrival!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  extras?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}

export class GuestInviteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  purpose?: string;

  /** Day of the visit, YYYY-MM-DD. Defaults to today. */
  @IsOptional()
  @IsDateString()
  visitDate?: string;
}

export class FreePassDto {
  @IsString()
  @MaxLength(60)
  name!: string;
}

export class CustomerGateScanDto {
  @IsString()
  gateId!: string;

  @IsIn(["QR", "NFC", "Face"])
  method!: string;

  @IsIn(["membership", "booking", "ticket", "pass"])
  kind!: string;

  /** Booking, issued ticket or pass id. Not needed for the membership. */
  @ValidateIf((dto: CustomerGateScanDto) => dto.kind !== "membership")
  @IsString()
  credentialId?: string;
}

export class CustomerCorrectionDto {
  @IsIn(["Name", "ID number", "Date of birth", "Contact", "Other"])
  field!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  detail!: string;
}
