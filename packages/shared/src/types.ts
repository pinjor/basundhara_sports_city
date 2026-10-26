// type/status are stored and validated as plain strings against the enums in
// ./enums (see apps/api/prisma/schema.prisma header) rather than typed as the
// enum itself, so forms can hold an in-progress value while editing.

export interface ZoneDto {
  id: string;
  name: string;
  type: string;
  parentZoneId: string | null;
  building: string | null;
  floor: string | null;
  capacity: number;
  liveOccupancy: number;
  mapX: number | null;
  mapY: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityDto {
  id: string;
  name: string;
  zoneId: string;
  zone?: Pick<ZoneDto, "id" | "name" | "type">;
  type: string;
  capacity: number;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  status: string;
  currentBookingRef: string | null;
  nextBookingRef: string | null;
  lastInspectionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingDto {
  id: string;
  facilityId: string;
  facility?: Pick<FacilityDto, "id" | "name" | "type">;
  customerName: string;
  memberId: string | null;
  type: string;
  date: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  status: string;
  amount: string | number;
  paymentStatus: string;
  featureKey?: string;
  detail?: string;
  qrConfirmationCode: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  eventPack?: EventPackDto | null;
}

export interface EventPackDto {
  id: string;
  bookingId?: string;
  title: string;
  status: string;
  expectedCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tier: string;
  joinDate: string;
  expiryDate: string;
  status: string;
  checkInCount: number;
  lastCheckIn: string | null;
  lockerId: string | null;
  billingCycle: string;
  createdAt: string;
  updatedAt: string;
}

export interface GateDto {
  id: string;
  name: string;
  zoneId: string;
  zone?: Pick<ZoneDto, "id" | "name" | "type">;
  type: string;
  status: string;
  entriesToday: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccessLogEntryDto {
  id: string;
  gateId: string;
  gate?: Pick<GateDto, "id" | "name" | "type">;
  personRef: string;
  credentialRef: string | null;
  method: string;
  result: string;
  reason?: string | null;
  timestamp: string;
}

export interface VisitorDto {
  id: string;
  name: string;
  host: string;
  purpose: string;
  category: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  escortRequired: boolean;
  qrPassCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface VIPGuestDto {
  id: string;
  name: string;
  designation: string | null;
  classification: string;
  arrivalDatetime: string;
  protocolOfficerId: string | null;
  status: string;
  loungeAssignment: string | null;
  seatAllocation: string | null;
  mealPreference: string | null;
  privacyFlag: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoungeDto {
  id: string;
  name: string;
  zoneId: string;
  zone?: Pick<ZoneDto, "id" | "name" | "type">;
  capacity: number;
  currentOccupancy: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestDto {
  id: string;
  partyRef: string;
  loungeId: string;
  lounge?: Pick<LoungeDto, "id" | "name">;
  item: string;
  status: string;
  requestedAt: string;
  updatedAt: string;
}

export interface OutletDto {
  id: string;
  name: string;
  type: string;
  zoneId: string;
  zone?: Pick<ZoneDto, "id" | "name" | "type">;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDto {
  id: string;
  outletId: string;
  outlet?: Pick<OutletDto, "id" | "name" | "type">;
  items: { name: string; qty: number }[];
  amount: string | number;
  status: string;
  placedAt: string;
  updatedAt: string;
}

export interface SurfaceDto {
  id: string;
  facilityId: string;
  facility?: Pick<FacilityDto, "id" | "name" | "type">;
  surfaceType: string;
  condition: string;
  moisturePercent: number | null;
  lastInspection: string | null;
  nextMaintenance: string | null;
  closureStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentDto {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingZoneDto {
  id: string;
  name: string;
  type: string;
  zoneId: string | null;
  zone?: Pick<ZoneDto, "id" | "name" | "type">;
  capacity: number;
  occupied: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleLogEntryDto {
  id: string;
  plateNumber: string;
  vehicleRef: string | null;
  parkingZoneId: string;
  parkingZone?: Pick<ParkingZoneDto, "id" | "name" | "type">;
  type: string;
  entryTime: string;
  exitTime: string | null;
}

export interface FleetVehicleDto {
  id: string;
  type: string;
  driverName: string | null;
  status: string;
  currentLocation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripDto {
  id: string;
  vehicleId: string;
  vehicle?: Pick<FleetVehicleDto, "id" | "type" | "driverName">;
  passengerRef: string;
  fromLocation: string;
  toLocation: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
}

export interface AuditLogDto {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** Short-lived access token plus a rotating refresh token (POST /auth/refresh). */
export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
  tokenType: "Bearer";
}

export interface LoginResponseDto extends TokenPairDto {
  user: AuthUserDto;
}

export interface CustomerDto {
  id: string;
  name: string;
  email: string;
  mobile: string;
  createdAt: string;
}

export interface CustomerAuthResponseDto extends TokenPairDto {
  customer: CustomerDto;
}
