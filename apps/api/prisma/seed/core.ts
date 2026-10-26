import type { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

/** Users, venue master data, operations and ticketing catalogue. */
export async function seedCore(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  // The customer-app system account is created on demand and does not count as seeded staff.
  const firstRun = (await prisma.user.count({ where: { id: { not: "customer-app" } } })) === 0;

  await prisma.user.createMany({
    data: [
      { name: "Farhan Ahmed", email: "admin@bsc.com.bd", role: "SUPER_ADMIN", passwordHash },
      { name: "Nusrat Jahan", email: "venue.manager@bsc.com.bd", role: "VENUE_FACILITY_MANAGER", passwordHash },
      { name: "Tanvir Hasan", email: "bookings@bsc.com.bd", role: "BOOKINGS_OFFICER", passwordHash },
      { name: "Rakib Hossain", email: "gate.officer@bsc.com.bd", role: "GATE_SECURITY_OFFICER", passwordHash },
      { name: "Ishrat Zaman", email: "protocol@bsc.com.bd", role: "PROTOCOL_OFFICER", passwordHash },
      { name: "Mahin Chowdhury", email: "hospitality@bsc.com.bd", role: "HOSPITALITY_LEAD", passwordHash },
      { name: "Sabbir Rahman", email: "parking@bsc.com.bd", role: "PARKING_MARSHAL", passwordHash },
      { name: "Jannatul Ferdous", email: "fleet@bsc.com.bd", role: "FLEET_DISPATCHER", passwordHash },
      { name: "Shahriar Kabir", email: "executive@bsc.com.bd", role: "READ_ONLY_EXECUTIVE", passwordHash },
      { name: "Imtiaz Ahmed", email: "tickets@bsc.com.bd", role: "TICKET_ADMINISTRATOR", passwordHash },
      { name: "Lamia Rahman", email: "finance@bsc.com.bd", role: "FINANCE_CONTROLLER", passwordHash },
      { name: "HR Manager", email: "hrm@bsc.com.bd", role: "HR_MANAGER", passwordHash },
      { name: "Security Manager", email: "security@bsc.com.bd", role: "SECURITY_MANAGER", passwordHash },
      { name: "Ahmed Akbar Sobhan", email: "chairman@bsc.com.bd", role: "CHAIRMAN", passwordHash },
    ],
    skipDuplicates: true,
  });

  if (firstRun) await prisma.user.updateMany({
    where: {
      email: {
        in: [
          "venue.manager@bsc.com.bd",
          "gate.officer@bsc.com.bd",
          "protocol@bsc.com.bd",
          "hospitality@bsc.com.bd",
          "parking@bsc.com.bd",
          "fleet@bsc.com.bd",
          "executive@bsc.com.bd",
          "tickets@bsc.com.bd",
        ],
      },
    },
    data: { active: false },
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@bsc.com.bd" } });

  const zoneData = [
    { name: "Central Stadium Complex", type: "Stadium", capacity: 45000, liveOccupancy: 3200, mapX: 0.5, mapY: 0.3 },
    { name: "Cricket Ground & Pavilion", type: "Stadium", capacity: 18000, liveOccupancy: 900, mapX: 0.68, mapY: 0.28 },
    { name: "Aquatic Centre", type: "Facility", capacity: 1200, liveOccupancy: 180, mapX: 0.3, mapY: 0.45 },
    { name: "Racquet Sports Pavilion", type: "Facility", capacity: 600, liveOccupancy: 95, mapX: 0.4, mapY: 0.55 },
    { name: "Futsal & Hockey Arena", type: "Facility", capacity: 2500, liveOccupancy: 310, mapX: 0.55, mapY: 0.6 },
    { name: "VIP Pavilion & Protocol Wing", type: "Hospitality", capacity: 400, liveOccupancy: 40, mapX: 0.6, mapY: 0.25 },
    { name: "Retail Boulevard", type: "Commercial", capacity: 5000, liveOccupancy: 1100, mapX: 0.2, mapY: 0.65 },
    { name: "North Training Grounds", type: "Facility", capacity: 800, liveOccupancy: 60, mapX: 0.75, mapY: 0.5 },
    { name: "Parking Precinct A", type: "Parking", capacity: 2000, liveOccupancy: 850, mapX: 0.15, mapY: 0.2 },
    { name: "Parking Precinct B (VIP)", type: "Parking", capacity: 300, liveOccupancy: 90, mapX: 0.82, mapY: 0.18 },
    { name: "Broadcast & Media Compound", type: "Restricted", capacity: 150, liveOccupancy: 22, mapX: 0.88, mapY: 0.35 },
    { name: "Back-of-House Services Yard", type: "Restricted", capacity: 100, liveOccupancy: 18, mapX: 0.1, mapY: 0.85 },
  ];

  for (const z of zoneData) {
    const existing = await prisma.zone.findFirst({ where: { name: z.name } });
    if (!existing) {
      await prisma.zone.create({ data: { ...z, status: "Operational" } });
    }
  }

  const zones = await prisma.zone.findMany();
  const zoneByName = (name: string) => zones.find((z) => z.name === name)!;

  const facilityData = [
    { name: "Main Stadium Pitch", zone: "Central Stadium Complex", type: "Football Pitch", capacity: 45000, status: "Available" },
    { name: "Stadium Warm-up Field", zone: "Central Stadium Complex", type: "Training Ground", capacity: 200, status: "Available" },
    { name: "International Cricket Ground", zone: "Cricket Ground & Pavilion", type: "Cricket Ground", capacity: 18000, status: "Reserved" },
    { name: "Indoor Pool Hall", zone: "Aquatic Centre", type: "Swimming Pool", capacity: 300, status: "Available" },
    { name: "Diving Pool", zone: "Aquatic Centre", type: "Swimming Pool", capacity: 80, status: "Maintenance" },
    { name: "Padel Court 1", zone: "Racquet Sports Pavilion", type: "Padel Court", capacity: 8, status: "In Use" },
    { name: "Padel Court 2", zone: "Racquet Sports Pavilion", type: "Padel Court", capacity: 8, status: "Available" },
    { name: "Squash Court A", zone: "Racquet Sports Pavilion", type: "Squash Court", capacity: 4, status: "Available" },
    { name: "Tennis Court 1", zone: "Racquet Sports Pavilion", type: "Tennis Court", capacity: 20, status: "Reserved" },
    { name: "Badminton Hall", zone: "Racquet Sports Pavilion", type: "Badminton Court", capacity: 60, status: "Available" },
    { name: "Futsal Arena 1", zone: "Futsal & Hockey Arena", type: "Turf", capacity: 150, status: "In Use" },
    { name: "Hockey Turf", zone: "Futsal & Hockey Arena", type: "Turf", capacity: 500, status: "Available" },
    { name: "Elite Performance Gym", zone: "North Training Grounds", type: "Gym", capacity: 120, status: "Available" },
    { name: "VIP Lounge Deck", zone: "VIP Pavilion & Protocol Wing", type: "Lounge", capacity: 250, status: "Available" },
    { name: "Media Briefing Room", zone: "Broadcast & Media Compound", type: "Media Room", capacity: 80, status: "Available" },
    { name: "Grand Event Hall", zone: "Central Stadium Complex", type: "Event Hall", capacity: 800, status: "Available" },
    { name: "Team Changing Room A", zone: "Central Stadium Complex", type: "Changing Room", capacity: 40, status: "Available" },
    { name: "Medical Treatment Room", zone: "Central Stadium Complex", type: "Medical Room", capacity: 12, status: "Available" },
    { name: "Kit Storage Bay", zone: "Back-of-House Services Yard", type: "Storage", capacity: 50, status: "Available" },
    { name: "Boulevard Restaurant", zone: "Retail Boulevard", type: "Restaurant", capacity: 180, status: "In Use" },
  ];

  for (const f of facilityData) {
    const existing = await prisma.facility.findFirst({ where: { name: f.name } });
    if (!existing) {
      await prisma.facility.create({
        data: {
          name: f.name,
          zoneId: zoneByName(f.zone).id,
          type: f.type,
          capacity: f.capacity,
          status: f.status,
          lastInspectionDate: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000),
        },
      });
    }
  }

  const facilities = await prisma.facility.findMany();
  const facilityByName = (name: string) => facilities.find((f) => f.name === name)!;

  const gateData = [
    { name: "Main Gate North", zone: "Central Stadium Complex", type: "Main" },
    { name: "Main Gate South", zone: "Central Stadium Complex", type: "Main" },
    { name: "Main Gate East Turnstile", zone: "Central Stadium Complex", type: "Main" },
    { name: "VIP Gate 1", zone: "VIP Pavilion & Protocol Wing", type: "VIP" },
    { name: "VVIP Gate West", zone: "VIP Pavilion & Protocol Wing", type: "VIP" },
    { name: "Team Entrance", zone: "North Training Grounds", type: "Team" },
    { name: "Team Tunnel Gate", zone: "Central Stadium Complex", type: "Team" },
    { name: "Media Accreditation Gate", zone: "Broadcast & Media Compound", type: "Media" },
    { name: "Broadcast Compound Gate", zone: "Broadcast & Media Compound", type: "Media" },
    { name: "Service Gate — Back of House", zone: "Back-of-House Services Yard", type: "Service" },
    { name: "Service Gate — Kitchen", zone: "Retail Boulevard", type: "Service" },
    { name: "Cricket Ground Turnstile A", zone: "Cricket Ground & Pavilion", type: "Main" },
    { name: "Aquatic Centre Entry", zone: "Aquatic Centre", type: "Main" },
    { name: "Parking Pedestrian Gate A", zone: "Parking Precinct A", type: "Main" },
  ];
  for (const g of gateData) {
    const existing = await prisma.gate.findFirst({ where: { name: g.name } });
    if (!existing) {
      await prisma.gate.create({
        data: { name: g.name, zoneId: zoneByName(g.zone).id, type: g.type, entriesToday: Math.floor(Math.random() * 400) },
      });
    }
  }
  const gates = await prisma.gate.findMany();
  const gateByName = (name: string) => gates.find((g) => g.name === name)!;

  const memberData = [
    { name: "Rezaul Karim", email: "rezaul.karim@example.com", tier: "Individual", status: "Active", checkInCount: 42 },
    { name: "Farah Diba", email: "farah.diba@example.com", tier: "Family", status: "Active", checkInCount: 18 },
    { name: "Anisur Rahman", email: "anisur.rahman@example.com", tier: "Corporate", status: "Active", checkInCount: 63 },
    { name: "Tasnia Islam", email: "tasnia.islam@example.com", tier: "Individual", status: "Frozen", checkInCount: 7 },
    { name: "Kamrul Hasan", email: "kamrul.hasan@example.com", tier: "Individual", status: "Expired", checkInCount: 120 },
    { name: "Nabila Yasmin", email: "nabila.yasmin@example.com", tier: "Family", status: "Active", checkInCount: 29 },
    { name: "Shafiqul Islam", email: "shafiqul.islam@example.com", tier: "Corporate", status: "Active", checkInCount: 51 },
    { name: "Maliha Chowdhury", email: "maliha.chowdhury@example.com", tier: "Individual", status: "Active", checkInCount: 14 },
    { name: "Omar Faruk", email: "omar.faruk@example.com", tier: "Family", status: "Frozen", checkInCount: 9 },
    { name: "Rina Akter", email: "rina.akter@example.com", tier: "Individual", status: "Active", checkInCount: 33 },
    { name: "Imran Kabir", email: "imran.kabir@example.com", tier: "Corporate", status: "Expired", checkInCount: 88 },
    { name: "Sadia Afrin", email: "sadia.afrin@example.com", tier: "Family", status: "Active", checkInCount: 21 },
  ];
  for (const m of memberData) {
    const existing = await prisma.member.findUnique({ where: { email: m.email } });
    if (!existing) {
      const expiryOffsetDays = m.status === "Expired" ? -10 : 300;
      await prisma.member.create({
        data: {
          name: m.name,
          email: m.email,
          tier: m.tier,
          status: m.status,
          checkInCount: m.checkInCount,
          expiryDate: new Date(Date.now() + expiryOffsetDays * 86400000),
          lockerId: `L-${Math.floor(100 + Math.random() * 900)}`,
        },
      });
    }
  }
  const members = await prisma.member.findMany();

  const visitorData = [
    { name: "David Chen", host: "Nusrat Jahan", purpose: "Facility tour", category: "Tour", status: "Expected" },
    { name: "Ayesha Siddiqua", host: "Mahin Chowdhury", purpose: "Vendor meeting", category: "Supplier", status: "Checked In" },
    { name: "St. Joseph School Group", host: "Rakib Hossain", purpose: "School sports visit", category: "School Group", status: "Checked In" },
    { name: "Jamal Uddin", host: "Farhan Ahmed", purpose: "HVAC maintenance", category: "Contractor", status: "Checked Out" },
    { name: "Priya Nair", host: "Ishrat Zaman", purpose: "Broadcast setup", category: "Media", status: "Expected" },
    { name: "Hassan Ali", host: "Tanvir Hasan", purpose: "Academy observation", category: "Guest", status: "Expected" },
    { name: "Lina Rahman", host: "Mahin Chowdhury", purpose: "Catering tasting", category: "Supplier", status: "Checked In" },
    { name: "Holy Cross College Group", host: "Rakib Hossain", purpose: "Campus tour", category: "School Group", status: "Expected" },
    { name: "Karim Electric Ltd", host: "Nusrat Jahan", purpose: "Scoreboard service", category: "Contractor", status: "Checked In" },
    { name: "BBC Sport Crew", host: "Ishrat Zaman", purpose: "Match preview", category: "Media", status: "Checked Out" },
    { name: "Samiul Hoque", host: "Sabbir Rahman", purpose: "Parking audit", category: "Guest", status: "Checked Out" },
    { name: "Nadia Khan", host: "Jannatul Ferdous", purpose: "Fleet vendor demo", category: "Supplier", status: "Expected" },
  ];
  for (const v of visitorData) {
    const existing = await prisma.visitor.findFirst({ where: { name: v.name, host: v.host } });
    if (!existing) {
      await prisma.visitor.create({
        data: {
          name: v.name,
          host: v.host,
          purpose: v.purpose,
          category: v.category,
          status: v.status,
          escortRequired: v.category === "Contractor" || v.category === "Media",
          checkInTime: v.status !== "Expected" ? new Date(Date.now() - 3600_000) : undefined,
          checkOutTime: v.status === "Checked Out" ? new Date() : undefined,
        },
      });
    }
  }

  const bookingData = [
    { facility: "Padel Court 2", customerName: "Rezaul Karim", memberIdx: 0, type: "Member", daysFromNow: 0, start: "18:00", end: "19:00", status: "Confirmed", amount: 1500 },
    { facility: "Squash Court A", customerName: "Anisur Rahman", memberIdx: 2, type: "Member", daysFromNow: 0, start: "19:00", end: "20:00", status: "Pending", amount: 1200 },
    { facility: "Badminton Hall", customerName: "Dhaka Corporate League", memberIdx: null, type: "Corporate", daysFromNow: 1, start: "17:00", end: "19:00", status: "Confirmed", amount: 8000 },
    { facility: "Hockey Turf", customerName: "Bashundhara Youth Academy", memberIdx: null, type: "Academy", daysFromNow: 2, start: "08:00", end: "10:00", status: "Pending", amount: 6000 },
    { facility: "Tennis Court 1", customerName: "Farah Diba", memberIdx: 1, type: "Member", daysFromNow: -1, start: "07:00", end: "08:00", status: "Completed", amount: 1000 },
    { facility: "Indoor Pool Hall", customerName: "Nabila Yasmin", memberIdx: 5, type: "Member", daysFromNow: 0, start: "06:30", end: "07:30", status: "Confirmed", amount: 800 },
    { facility: "Elite Performance Gym", customerName: "Maliha Chowdhury", memberIdx: 7, type: "Member", daysFromNow: 0, start: "07:00", end: "08:00", status: "Confirmed", amount: 600 },
    { facility: "Futsal Arena 1", customerName: "Uttara United FC", memberIdx: null, type: "Team", daysFromNow: 1, start: "20:00", end: "21:30", status: "Pending", amount: 4500 },
    { facility: "Grand Event Hall", customerName: "City Bank Sports Night", memberIdx: null, type: "Corporate", daysFromNow: 5, start: "18:00", end: "22:00", status: "Confirmed", amount: 45000 },
    { facility: "Main Stadium Pitch", customerName: "Dhaka North School XI", memberIdx: null, type: "School", daysFromNow: 3, start: "09:00", end: "11:00", status: "Pending", amount: 12000 },
    { facility: "Padel Court 1", customerName: "Walk-in Public Slot", memberIdx: null, type: "Public", daysFromNow: 0, start: "16:00", end: "17:00", status: "Cancelled", amount: 1500 },
    { facility: "Tennis Court 1", customerName: "Rina Akter", memberIdx: 9, type: "Member", daysFromNow: 2, start: "18:00", end: "19:00", status: "Confirmed", amount: 1000 },
  ];
  for (const b of bookingData) {
    const existing = await prisma.booking.findFirst({ where: { customerName: b.customerName, timeSlotStart: b.start } });
    if (!existing) {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() + b.daysFromNow);
      await prisma.booking.create({
        data: {
          facilityId: facilityByName(b.facility).id,
          customerName: b.customerName,
          memberId: b.memberIdx !== null ? members[b.memberIdx]?.id : undefined,
          type: b.type,
          date,
          timeSlotStart: b.start,
          timeSlotEnd: b.end,
          status: b.status,
          amount: b.amount,
          paymentStatus: b.status === "Completed" ? "Paid" : "Deposit Paid",
          createdById: admin.id,
        },
      });
    }
  }

  const accessLogData = [
    { gate: "Main Gate North", personRef: "Member #A104", method: "QR", result: "Approved" },
    { gate: "Main Gate North", personRef: "Visitor #V22", method: "QR", result: "Approved" },
    { gate: "Main Gate South", personRef: "Member #A218", method: "QR", result: "Approved" },
    { gate: "Main Gate East Turnstile", personRef: "Public ticket T-9041", method: "QR", result: "Approved" },
    { gate: "VIP Gate 1", personRef: "VIP: Ishrat Zaman party", method: "Face", result: "Approved" },
    { gate: "VVIP Gate West", personRef: "H.E. Amb. Laila Rahman", method: "Face", result: "Approved" },
    { gate: "Team Entrance", personRef: "Player pass P-12", method: "RFID", result: "Approved" },
    { gate: "Team Tunnel Gate", personRef: "Staff lanyard S-77", method: "RFID", result: "Approved" },
    { gate: "Media Accreditation Gate", personRef: "Press Badge #M8", method: "RFID", result: "Denied" },
    { gate: "Broadcast Compound Gate", personRef: "OB van crew 3", method: "QR", result: "Approved" },
    { gate: "Service Gate — Back of House", personRef: "Contractor: Jamal Uddin", method: "Biometric", result: "Approved" },
    { gate: "Aquatic Centre Entry", personRef: "Member #A331", method: "QR", result: "Denied" },
  ];
  for (const a of accessLogData) {
    const existing = await prisma.accessLogEntry.findFirst({ where: { personRef: a.personRef } });
    if (!existing) {
      await prisma.accessLogEntry.create({
        data: { gateId: gateByName(a.gate).id, personRef: a.personRef, method: a.method, result: a.result },
      });
    }
  }

  const protocolOfficer = await prisma.user.findUniqueOrThrow({ where: { email: "protocol@bsc.com.bd" } });

  const vipData = [
    { name: "H.E. Amb. Laila Rahman", designation: "Ambassador", classification: "Diplomatic", status: "Scheduled", hoursFromNow: 4, lounge: "VIP Lounge Deck", seat: "A-12", meal: "Vegetarian" },
    { name: "Minister Golam Sarwar", designation: "State Minister for Sports", classification: "Government", status: "Arrived", hoursFromNow: -1, lounge: "VIP Lounge Deck", seat: "A-1", meal: "Standard", privacyFlag: true },
    { name: "Zahid Karim", designation: "CEO, Delta Sponsors Ltd.", classification: "Corporate", status: "Scheduled", hoursFromNow: 6, lounge: "VIP Lounge Deck", seat: "B-4", meal: "Halal" },
    { name: "Federation President Aslam Chowdhury", designation: "President, National Sports Federation", classification: "Federation", status: "Departed", hoursFromNow: -6, lounge: "VIP Lounge Deck", seat: "A-2", meal: "Standard" },
    { name: "H.E. Consul Hiroshi Tanaka", designation: "Consul General", classification: "Diplomatic", status: "Scheduled", hoursFromNow: 8, lounge: "Protocol Holding Suite", seat: "C-2", meal: "Light" },
    { name: "Secretary Nasrin Ahmed", designation: "Secretary, Ministry of Youth", classification: "Government", status: "Arrived", hoursFromNow: -2, lounge: "Federation Hospitality Suite", seat: "A-3", meal: "Standard", privacyFlag: true },
    { name: "Amina Sultana", designation: "Chair, Horizon Group", classification: "Corporate", status: "Scheduled", hoursFromNow: 3, lounge: "Sponsor Box Lounge", seat: "B-1", meal: "Vegetarian" },
    { name: "Coach Michel Duarte", designation: "National Team Head Coach", classification: "Federation", status: "Arrived", hoursFromNow: -3, lounge: "Team Hospitality Room", seat: "T-1", meal: "High protein" },
    { name: "Dr. Farzana Kabir", designation: "WHO Regional Envoy", classification: "Diplomatic", status: "Departed", hoursFromNow: -8, lounge: "VIP Lounge Deck", seat: "A-8", meal: "Vegetarian" },
    { name: "Rafiq Chowdhury", designation: "Mayor's Sports Advisor", classification: "Government", status: "Scheduled", hoursFromNow: 10, lounge: "Directors Box", seat: "D-4", meal: "Standard" },
    { name: "Leila Osman", designation: "CMO, Apex Bank", classification: "Corporate", status: "Arrived", hoursFromNow: -0.5, lounge: "Sponsor Box Lounge", seat: "B-6", meal: "Halal" },
    { name: "Prof. Imtiaz Alam", designation: "IOC Observer", classification: "Federation", status: "Scheduled", hoursFromNow: 12, lounge: "Protocol Holding Suite", seat: "C-1", meal: "Light" },
  ];
  for (const v of vipData) {
    const existing = await prisma.vIPGuest.findFirst({ where: { name: v.name } });
    if (!existing) {
      const arrival = new Date(Date.now() + v.hoursFromNow * 3600_000);
      await prisma.vIPGuest.create({
        data: {
          name: v.name,
          designation: v.designation,
          classification: v.classification,
          arrivalDatetime: arrival,
          protocolOfficerId: protocolOfficer.id,
          status: v.status,
          loungeAssignment: v.lounge,
          seatAllocation: v.seat,
          mealPreference: v.meal,
          privacyFlag: v.privacyFlag ?? false,
        },
      });
    }
  }

  const loungeData = [
    { name: "VIP Lounge Deck", zone: "VIP Pavilion & Protocol Wing", capacity: 60, currentOccupancy: 14 },
    { name: "Federation Hospitality Suite", zone: "VIP Pavilion & Protocol Wing", capacity: 30, currentOccupancy: 30 },
    { name: "Media Hospitality Room", zone: "Broadcast & Media Compound", capacity: 25, currentOccupancy: 6 },
    { name: "VVIP Inner Sanctum", zone: "VIP Pavilion & Protocol Wing", capacity: 12, currentOccupancy: 4 },
    { name: "Protocol Holding Suite", zone: "VIP Pavilion & Protocol Wing", capacity: 18, currentOccupancy: 2 },
    { name: "Sponsor Box Lounge", zone: "Central Stadium Complex", capacity: 40, currentOccupancy: 11 },
    { name: "Directors Box", zone: "Central Stadium Complex", capacity: 24, currentOccupancy: 8 },
    { name: "Team Hospitality Room", zone: "North Training Grounds", capacity: 35, currentOccupancy: 16 },
    { name: "Cricket Pavilion Lounge", zone: "Cricket Ground & Pavilion", capacity: 50, currentOccupancy: 9 },
    { name: "Aquatic Viewing Lounge", zone: "Aquatic Centre", capacity: 20, currentOccupancy: 3 },
    { name: "Retail Sky Lounge", zone: "Retail Boulevard", capacity: 45, currentOccupancy: 19 },
    { name: "Press Club Room", zone: "Broadcast & Media Compound", capacity: 22, currentOccupancy: 7 },
  ];
  for (const l of loungeData) {
    const existing = await prisma.lounge.findFirst({ where: { name: l.name } });
    if (!existing) {
      await prisma.lounge.create({
        data: {
          name: l.name,
          zoneId: zoneByName(l.zone).id,
          capacity: l.capacity,
          currentOccupancy: l.currentOccupancy,
          status: l.currentOccupancy >= l.capacity ? "At Capacity" : "Open",
        },
      });
    }
  }
  const lounges = await prisma.lounge.findMany();
  const loungeByName = (name: string) => lounges.find((l) => l.name === name)!;

  const serviceRequestData = [
    { lounge: "VIP Lounge Deck", partyRef: "Amb. Laila Rahman party", item: "Sparkling water x4", status: "Delivered" },
    { lounge: "VIP Lounge Deck", partyRef: "Minister Sarwar party", item: "Coffee service", status: "Preparing" },
    { lounge: "Federation Hospitality Suite", partyRef: "Federation delegation", item: "Canapés platter", status: "Pending" },
    { lounge: "Media Hospitality Room", partyRef: "Broadcast crew", item: "Sandwiches x8", status: "Pending" },
    { lounge: "VVIP Inner Sanctum", partyRef: "Consul Tanaka party", item: "Green tea service", status: "Preparing" },
    { lounge: "Sponsor Box Lounge", partyRef: "Horizon Group", item: "Champagne (non-alc) x2", status: "Pending" },
    { lounge: "Directors Box", partyRef: "Board guests", item: "Fruit platter", status: "Delivered" },
    { lounge: "Team Hospitality Room", partyRef: "National team staff", item: "Recovery shakes x10", status: "Preparing" },
    { lounge: "Cricket Pavilion Lounge", partyRef: "Members enclosure", item: "Iced tea jugs x4", status: "Delivered" },
    { lounge: "Aquatic Viewing Lounge", partyRef: "Federation swim jury", item: "Still water x12", status: "Pending" },
    { lounge: "Retail Sky Lounge", partyRef: "Retail partners", item: "Coffee & pastry", status: "Delivered" },
    { lounge: "Press Club Room", partyRef: "BBC Sport Crew", item: "Power bars x8", status: "Pending" },
  ];
  for (const s of serviceRequestData) {
    const existing = await prisma.serviceRequest.findFirst({ where: { partyRef: s.partyRef, item: s.item } });
    if (!existing) {
      await prisma.serviceRequest.create({
        data: { loungeId: loungeByName(s.lounge).id, partyRef: s.partyRef, item: s.item, status: s.status },
      });
    }
  }

  const outletData = [
    { name: "Boulevard Grill House", type: "Restaurant", zone: "Retail Boulevard", status: "Open" },
    { name: "Courtside Food Court", type: "Food Court", zone: "Retail Boulevard", status: "Open" },
    { name: "Aquatic Centre Café", type: "Café", zone: "Aquatic Centre", status: "Open" },
    { name: "Stadium Concession Stand C", type: "Concession", zone: "Central Stadium Complex", status: "Closed" },
    { name: "North End Concession", type: "Concession", zone: "Central Stadium Complex", status: "Open" },
    { name: "Pavilion Tea Room", type: "Café", zone: "Cricket Ground & Pavilion", status: "Open" },
    { name: "VIP Fine Dining", type: "Restaurant", zone: "VIP Pavilion & Protocol Wing", status: "Open" },
    { name: "Media Canteen", type: "Food Court", zone: "Broadcast & Media Compound", status: "Open" },
    { name: "Training Ground Kiosk", type: "Concession", zone: "North Training Grounds", status: "Open" },
    { name: "Racquet Café", type: "Café", zone: "Racquet Sports Pavilion", status: "Open" },
    { name: "Futsal Snack Bar", type: "Concession", zone: "Futsal & Hockey Arena", status: "Closed" },
    { name: "Staff Mess Hall", type: "Food Court", zone: "Back-of-House Services Yard", status: "Open" },
  ];
  for (const o of outletData) {
    const existing = await prisma.outlet.findFirst({ where: { name: o.name } });
    if (!existing) {
      await prisma.outlet.create({ data: { name: o.name, type: o.type, zoneId: zoneByName(o.zone).id, status: o.status } });
    }
  }
  const outlets = await prisma.outlet.findMany();
  const outletByName = (name: string) => outlets.find((o) => o.name === name)!;

  const orderData = [
    { outlet: "Boulevard Grill House", items: [{ name: "Grilled Chicken Platter", qty: 2 }], amount: 1400, status: "Preparing" },
    { outlet: "Courtside Food Court", items: [{ name: "Burger Combo", qty: 3 }], amount: 1050, status: "Order Received" },
    { outlet: "Aquatic Centre Café", items: [{ name: "Iced Coffee", qty: 2 }, { name: "Croissant", qty: 2 }], amount: 640, status: "Ready for Pickup" },
    { outlet: "Boulevard Grill House", items: [{ name: "Family Meal Set", qty: 1 }], amount: 2200, status: "Delivered" },
    { outlet: "North End Concession", items: [{ name: "Popcorn", qty: 4 }, { name: "Cola", qty: 4 }], amount: 720, status: "Order Received" },
    { outlet: "Pavilion Tea Room", items: [{ name: "Afternoon tea", qty: 2 }], amount: 980, status: "Preparing" },
    { outlet: "VIP Fine Dining", items: [{ name: "Set menu A", qty: 6 }], amount: 18000, status: "Preparing" },
    { outlet: "Media Canteen", items: [{ name: "Rice bowl", qty: 8 }], amount: 2400, status: "Ready for Pickup" },
    { outlet: "Training Ground Kiosk", items: [{ name: "Electrolyte drink", qty: 12 }], amount: 960, status: "Delivered" },
    { outlet: "Racquet Café", items: [{ name: "Protein smoothie", qty: 3 }], amount: 750, status: "Order Received" },
    { outlet: "Staff Mess Hall", items: [{ name: "Staff thali", qty: 20 }], amount: 4000, status: "Delivered" },
    { outlet: "VIP Fine Dining", items: [{ name: "Dessert tasting", qty: 4 }], amount: 3200, status: "Order Received" },
  ];
  for (const o of orderData) {
    const existing = await prisma.order.findFirst({ where: { outletId: outletByName(o.outlet).id, amount: o.amount } });
    if (!existing) {
      await prisma.order.create({
        data: { outletId: outletByName(o.outlet).id, items: o.items, amount: o.amount, status: o.status },
      });
    }
  }

  const parkingZoneData = [
    { name: "North Public Parking", type: "Public", zone: "Parking Precinct A", capacity: 1500, occupied: 640 },
    { name: "South Public Overflow", type: "Public", zone: "Parking Precinct A", capacity: 800, occupied: 210 },
    { name: "VIP Parking Court", type: "VIP", zone: "Parking Precinct B (VIP)", capacity: 200, occupied: 90 },
    { name: "VVIP Motorcade Court", type: "VIP", zone: "Parking Precinct B (VIP)", capacity: 40, occupied: 12 },
    { name: "Staff Parking Yard", type: "Staff", zone: "Back-of-House Services Yard", capacity: 300, occupied: 210 },
    { name: "Overnight Staff Lot", type: "Staff", zone: "Back-of-House Services Yard", capacity: 80, occupied: 44 },
    { name: "Team Bus Bay", type: "Team", zone: "North Training Grounds", capacity: 20, occupied: 4 },
    { name: "Academy Mini-bus Lane", type: "Team", zone: "North Training Grounds", capacity: 16, occupied: 6 },
    { name: "Visitor Drop-off Loop", type: "Visitor", zone: "Parking Precinct A", capacity: 60, occupied: 18 },
    { name: "Media Van Compound", type: "Visitor", zone: "Broadcast & Media Compound", capacity: 30, occupied: 11 },
    { name: "Retail Short-stay", type: "Public", zone: "Retail Boulevard", capacity: 220, occupied: 95 },
    { name: "Aquatic Centre Bays", type: "Public", zone: "Aquatic Centre", capacity: 140, occupied: 52 },
  ];
  for (const p of parkingZoneData) {
    const existing = await prisma.parkingZone.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.parkingZone.create({
        data: { name: p.name, type: p.type, zoneId: zoneByName(p.zone).id, capacity: p.capacity, occupied: p.occupied },
      });
    }
  }
  const parkingZones = await prisma.parkingZone.findMany();
  const parkingZoneByName = (name: string) => parkingZones.find((p) => p.name === name)!;

  const vehicleLogData = [
    { zone: "North Public Parking", plate: "DHK-GA-1234", type: "Public", open: true },
    { zone: "South Public Overflow", plate: "DHK-GA-8891", type: "Public", open: true },
    { zone: "VIP Parking Court", plate: "DHK-VIP-0007", type: "VIP", open: true },
    { zone: "VVIP Motorcade Court", plate: "DHK-VIP-0001", type: "VIP", open: true },
    { zone: "Staff Parking Yard", plate: "DHK-STF-5521", type: "Staff", open: false },
    { zone: "Overnight Staff Lot", plate: "DHK-STF-1102", type: "Staff", open: true },
    { zone: "Team Bus Bay", plate: "DHK-BUS-04", type: "Team", open: true },
    { zone: "Academy Mini-bus Lane", plate: "DHK-BUS-11", type: "Team", open: false },
    { zone: "Visitor Drop-off Loop", plate: "DHK-VIS-334", type: "Visitor", open: true },
    { zone: "Media Van Compound", plate: "DHK-MED-08", type: "Visitor", open: true },
    { zone: "Retail Short-stay", plate: "DHK-RET-672", type: "Public", open: false },
    { zone: "Aquatic Centre Bays", plate: "DHK-AQC-219", type: "Public", open: true },
  ];
  for (const v of vehicleLogData) {
    const existing = await prisma.vehicleLogEntry.findFirst({ where: { plateNumber: v.plate } });
    if (!existing) {
      await prisma.vehicleLogEntry.create({
        data: {
          parkingZoneId: parkingZoneByName(v.zone).id,
          plateNumber: v.plate,
          type: v.type,
          entryTime: new Date(Date.now() - 2 * 3600_000),
          exitTime: v.open ? undefined : new Date(Date.now() - 3600_000),
        },
      });
    }
  }

  const fleetData = [
    { type: "Buggy", driverName: "Milon Sheikh", status: "Available", currentLocation: "Central Stadium Complex" },
    { type: "Buggy", driverName: "Habibur Rahman", status: "On Trip", currentLocation: "Retail Boulevard" },
    { type: "Buggy", driverName: "Rashedul Karim", status: "Available", currentLocation: "Aquatic Centre" },
    { type: "Buggy", driverName: "Nasima Begum", status: "Maintenance", currentLocation: "Back-of-House Services Yard" },
    { type: "Shuttle", driverName: "Aktar Hossain", status: "Available", currentLocation: "Parking Precinct A" },
    { type: "Shuttle", driverName: "Jamal Sheikh", status: "On Trip", currentLocation: "Cricket Ground & Pavilion" },
    { type: "Shuttle", driverName: "Farzana Akter", status: "Available", currentLocation: "North Training Grounds" },
    { type: "Shuttle", driverName: "Shahidul Islam", status: "Charging", currentLocation: "Parking Precinct A" },
    { type: "VIP Car", driverName: "Selim Reza", status: "Charging", currentLocation: "VIP Pavilion & Protocol Wing" },
    { type: "VIP Car", driverName: "Arif Mahmud", status: "On Trip", currentLocation: "Parking Precinct B (VIP)" },
    { type: "VIP Car", driverName: "Lubna Yasmin", status: "Available", currentLocation: "VIP Pavilion & Protocol Wing" },
    { type: "Buggy", driverName: "Tarek Aziz", status: "Available", currentLocation: "Broadcast & Media Compound" },
  ];
  for (const f of fleetData) {
    const existing = await prisma.fleetVehicle.findFirst({ where: { driverName: f.driverName } });
    if (!existing) {
      await prisma.fleetVehicle.create({ data: f });
    }
  }
  const fleetVehicles = await prisma.fleetVehicle.findMany();
  const fleetByDriver = (name: string) => fleetVehicles.find((v) => v.driverName === name)!;

  const tripData = [
    { driver: "Habibur Rahman", passengerRef: "Zahid Karim (VIP)", from: "VIP Gate 1", to: "VIP Pavilion & Protocol Wing", status: "In Progress" },
    { driver: "Milon Sheikh", passengerRef: "Farah Diba (Member)", from: "Main Gate North", to: "Racquet Sports Pavilion", status: "Requested" },
    { driver: "Jamal Sheikh", passengerRef: "St. Joseph School Group", from: "Parking Precinct A", to: "Aquatic Centre", status: "In Progress" },
    { driver: "Arif Mahmud", passengerRef: "Minister Golam Sarwar", from: "VVIP Gate West", to: "Protocol Holding Suite", status: "In Progress" },
    { driver: "Aktar Hossain", passengerRef: "Broadcast crew shuttle", from: "Media Van Compound", to: "Broadcast & Media Compound", status: "Completed" },
    { driver: "Farzana Akter", passengerRef: "Uttara United FC", from: "Team Entrance", to: "North Training Grounds", status: "Requested" },
    { driver: "Rashedul Karim", passengerRef: "Nabila Yasmin", from: "Aquatic Centre Entry", to: "Indoor Pool Hall", status: "Completed" },
    { driver: "Lubna Yasmin", passengerRef: "H.E. Amb. Laila Rahman", from: "VIP Parking Court", to: "VIP Lounge Deck", status: "Requested" },
    { driver: "Tarek Aziz", passengerRef: "BBC Sport Crew", from: "Main Gate East Turnstile", to: "Press Club Room", status: "Completed" },
    { driver: "Milon Sheikh", passengerRef: "Anisur Rahman", from: "Retail Boulevard", to: "Elite Performance Gym", status: "Completed" },
    { driver: "Jamal Sheikh", passengerRef: "Holy Cross College Group", from: "Visitor Drop-off Loop", to: "Grand Event Hall", status: "Requested" },
    { driver: "Selim Reza", passengerRef: "Amina Sultana", from: "VVIP Motorcade Court", to: "Sponsor Box Lounge", status: "Completed" },
  ];
  for (const t of tripData) {
    const existing = await prisma.trip.findFirst({ where: { passengerRef: t.passengerRef } });
    if (!existing) {
      await prisma.trip.create({
        data: {
          vehicleId: fleetByDriver(t.driver).id,
          passengerRef: t.passengerRef,
          fromLocation: t.from,
          toLocation: t.to,
          status: t.status,
        },
      });
    }
  }

  const surfaceData = [
    { facility: "Main Stadium Pitch", surfaceType: "Hybrid Turf", condition: "Excellent", moisturePercent: 42, closureStatus: "Open" },
    { facility: "Stadium Warm-up Field", surfaceType: "Natural Grass", condition: "Good", moisturePercent: 36, closureStatus: "Open" },
    { facility: "International Cricket Ground", surfaceType: "Natural Grass", condition: "Good", moisturePercent: 38, closureStatus: "Open" },
    { facility: "Indoor Pool Hall", surfaceType: "Pool Water", condition: "Excellent", moisturePercent: null, closureStatus: "Open" },
    { facility: "Diving Pool", surfaceType: "Pool Water", condition: "Needs Attention", moisturePercent: null, closureStatus: "Closed for Maintenance" },
    { facility: "Padel Court 1", surfaceType: "Hard Court", condition: "Good", moisturePercent: 12, closureStatus: "Open" },
    { facility: "Padel Court 2", surfaceType: "Hard Court", condition: "Excellent", moisturePercent: 10, closureStatus: "Open" },
    { facility: "Tennis Court 1", surfaceType: "Clay Court", condition: "Fair", moisturePercent: 22, closureStatus: "Closed for Recovery" },
    { facility: "Badminton Hall", surfaceType: "Wooden Court", condition: "Good", moisturePercent: 8, closureStatus: "Open" },
    { facility: "Futsal Arena 1", surfaceType: "Synthetic Turf", condition: "Good", moisturePercent: 18, closureStatus: "Open" },
    { facility: "Hockey Turf", surfaceType: "Synthetic Turf", condition: "Fair", moisturePercent: 25, closureStatus: "Closed for Recovery" },
    { facility: "Elite Performance Gym", surfaceType: "Wooden Court", condition: "Excellent", moisturePercent: 6, closureStatus: "Open" },
  ];
  for (const s of surfaceData) {
    const existing = await prisma.surface.findFirst({ where: { facilityId: facilityByName(s.facility).id } });
    if (!existing) {
      await prisma.surface.create({
        data: {
          facilityId: facilityByName(s.facility).id,
          surfaceType: s.surfaceType,
          condition: s.condition,
          moisturePercent: s.moisturePercent ?? undefined,
          closureStatus: s.closureStatus,
          lastInspection: new Date(Date.now() - 2 * 86400000),
          nextMaintenance: new Date(Date.now() + 5 * 86400000),
        },
      });
    }
  }

  const equipmentData = [
    { name: "Match Footballs (FIFA Quality Pro)", category: "Balls", quantity: 40, status: "In Stock" },
    { name: "Training Footballs", category: "Balls", quantity: 80, status: "Deployed" },
    { name: "Cricket Match Balls", category: "Balls", quantity: 36, status: "In Stock" },
    { name: "Full-size Goals", category: "Goals", quantity: 8, status: "Deployed" },
    { name: "Futsal Goals", category: "Goals", quantity: 6, status: "In Stock" },
    { name: "Padel Rackets", category: "Protective Gear", quantity: 24, status: "In Stock" },
    { name: "Hockey Shin Guards Set", category: "Protective Gear", quantity: 40, status: "Deployed" },
    { name: "Pool Lane Ropes", category: "Pool Equipment", quantity: 12, status: "Under Repair" },
    { name: "Starting Blocks", category: "Pool Equipment", quantity: 10, status: "In Stock" },
    { name: "Pitch Roller", category: "Maintenance Tools", quantity: 2, status: "In Stock" },
    { name: "Line Marker Kit", category: "Maintenance Tools", quantity: 5, status: "Deployed" },
    { name: "Broadcast Camera Dollies", category: "AV Equipment", quantity: 4, status: "Deployed" },
    { name: "Gym Cable Stack Set", category: "Gym Equipment", quantity: 14, status: "In Stock" },
    { name: "Badminton Nets", category: "Nets", quantity: 16, status: "In Stock" },
  ];
  for (const e of equipmentData) {
    const existing = await prisma.equipment.findFirst({ where: { name: e.name } });
    if (!existing) {
      await prisma.equipment.create({ data: e });
    }
  }

  const confirmedBookings = await prisma.booking.findMany({
    where: { status: { in: ["Confirmed", "Completed"] } },
    include: { facility: { select: { name: true, capacity: true } } },
    orderBy: { date: "asc" },
  });
  const packs = [];
  for (const booking of confirmedBookings) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const day = new Date(booking.date);
    day.setUTCHours(0, 0, 0, 0);
    const status =
      booking.status === "Completed" ? "Closed" : day.getTime() <= today.getTime() ? "Live" : "Planning";
    const pack = await prisma.eventPack.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        title: `${booking.customerName} · ${booking.facility.name}`,
        status,
        expectedCount: booking.facility.capacity,
      },
      update: {
        title: `${booking.customerName} · ${booking.facility.name}`,
        status,
        expectedCount: booking.facility.capacity,
      },
    });
    packs.push(pack);
  }

  const visitors = await prisma.visitor.findMany({ orderBy: { createdAt: "asc" } });
  const vips = await prisma.vIPGuest.findMany({ orderBy: { createdAt: "asc" } });
  const trips = await prisma.trip.findMany({ orderBy: { requestedAt: "asc" } });
  const orders = await prisma.order.findMany({ orderBy: { placedAt: "asc" } });
  const requests = await prisma.serviceRequest.findMany({ orderBy: { requestedAt: "asc" } });

  for (let i = 0; i < packs.length; i++) {
    const packId = packs[i].id;
    const visitor = visitors[i];
    const vip = vips[i];
    const trip = trips[i];
    const order = orders[i];
    const request = requests[i];
    if (visitor && !visitor.eventPackId) {
      await prisma.visitor.update({ where: { id: visitor.id }, data: { eventPackId: packId } });
    }
    if (vip && !vip.eventPackId) {
      await prisma.vIPGuest.update({ where: { id: vip.id }, data: { eventPackId: packId } });
    }
    if (trip && !trip.eventPackId) {
      await prisma.trip.update({ where: { id: trip.id }, data: { eventPackId: packId } });
    }
    if (order && !order.eventPackId) {
      await prisma.order.update({ where: { id: order.id }, data: { eventPackId: packId } });
    }
    if (request && !request.eventPackId) {
      await prisma.serviceRequest.update({ where: { id: request.id }, data: { eventPackId: packId } });
    }
  }

  const reservedBays = await prisma.parkingZone.findMany();
  for (const pack of packs) {
    const taskCount = await prisma.opsTask.count({ where: { eventPackId: pack.id } });
    if (taskCount === 0) {
      await prisma.opsTask.createMany({
        data: [
          { eventPackId: pack.id, title: "Pre-event surface inspection", area: "Surface", priority: "High", status: pack.status === "Closed" ? "Done" : "Open" },
          { eventPackId: pack.id, title: "Issue access credentials", area: "Access", status: pack.status === "Closed" ? "Done" : "In Progress" },
          { eventPackId: pack.id, title: "Hospitality readiness", area: "Hospitality" },
          { eventPackId: pack.id, title: "Allocate parking permits", area: "Parking" },
          { eventPackId: pack.id, title: "Dispatch event transport", area: "Transport" },
          { eventPackId: pack.id, title: "Post-event settlement", area: "Finance", priority: "High", status: pack.status === "Closed" ? "Done" : "Open" },
        ],
      });
    }
    const credCount = await prisma.credential.count({ where: { eventPackId: pack.id } });
    if (credCount === 0) {
      await prisma.credential.create({
        data: {
          holderRef: pack.title.split(" · ")[0],
          type: "Visitor",
          eventPackId: pack.id,
          status: pack.status === "Closed" ? "Expired" : "Active",
        },
      });
    }
    const reserveCount = await prisma.parkingReservation.count({ where: { eventPackId: pack.id } });
    if (reserveCount === 0 && reservedBays[0]) {
      await prisma.parkingReservation.create({
        data: { eventPackId: pack.id, parkingZoneId: reservedBays[0].id, plateNumber: "BSC-EVT", status: "Reserved" },
      });
    }
  }

  const allMembers = await prisma.member.findMany();
  for (const member of allMembers) {
    const existing = await prisma.credential.findFirst({ where: { memberId: member.id } });
    if (!existing) {
      await prisma.credential.create({
        data: {
          holderRef: member.name,
          type: "Member",
          memberId: member.id,
          status: member.status === "Active" ? "Active" : "Suspended",
        },
      });
    }
  }

  const matchCount = await prisma.matchEvent.count();
  if (matchCount === 0) {
    const at = (daysFromNow: number, hour: number) => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      date.setHours(hour, 0, 0, 0);
      return date;
    };
    const catalogues = [
      {
        title: "Bashundhara Kings vs Abahani",
        sport: "Football",
        venueName: "Bashundhara Sports City Stadium",
        venueNote: "International-standard pitch. Gates open 90 minutes before kickoff.",
        startsAt: at(12, 18),
        doorsAt: at(12, 16),
        sections: [
          { name: "West Stand", rows: 6, seatsPerRow: 12, price: 800, gate: "Main Gate North" },
          { name: "East Stand", rows: 6, seatsPerRow: 12, price: 800, gate: "Main Gate North" },
          { name: "Premium Box", rows: 2, seatsPerRow: 8, price: 4500, gate: "VIP Gate 1" },
        ],
      },
      {
        title: "Dhaka Premier League — Day 4",
        sport: "Cricket",
        venueName: "Cricket Ground & Pavilion",
        venueNote: "Covered pavilion seating. Play starts in the afternoon.",
        startsAt: at(20, 13),
        doorsAt: at(20, 11),
        sections: [
          { name: "Pavilion", rows: 4, seatsPerRow: 10, price: 600, gate: "Main Gate North" },
          { name: "Grass Bank", rows: 5, seatsPerRow: 14, price: 300, gate: "Main Gate North" },
        ],
      },
      {
        title: "National Tennis Open — Final",
        sport: "Tennis",
        venueName: "Racquet Sports Pavilion",
        venueNote: "Centre court. Bags larger than A4 are not admitted.",
        startsAt: at(6, 17),
        doorsAt: at(6, 15),
        sections: [
          { name: "Court Side", rows: 3, seatsPerRow: 10, price: 1500, gate: "Main Gate North" },
          { name: "Upper Bowl", rows: 4, seatsPerRow: 12, price: 700, gate: "Main Gate North" },
        ],
      },
    ];
    for (const catalogue of catalogues) {
      const event = await prisma.matchEvent.create({
        data: {
          title: catalogue.title,
          sport: catalogue.sport,
          venueName: catalogue.venueName,
          venueNote: catalogue.venueNote,
          startsAt: catalogue.startsAt,
          doorsAt: catalogue.doorsAt,
          salesStatus: "ON_SALE",
          vatRateBps: 1500,
        },
      });
      for (const [index, section] of catalogue.sections.entries()) {
        const created = await prisma.eventSection.create({
          data: { eventId: event.id, name: section.name, rows: section.rows, seatsPerRow: section.seatsPerRow, sortOrder: index },
        });
        await prisma.ticketCategory.create({
          data: { eventId: event.id, sectionId: created.id, name: section.name, priceBdt: section.price, gateName: section.gate },
        });
      }
    }
  }

  console.log(
    `Seeded ${zoneData.length} zones, ${facilityData.length} facilities, ${gateData.length} gates, ` +
      `${memberData.length} members, ${visitorData.length} visitors, ${bookingData.length} bookings, ` +
      `${vipData.length} VIP guests, ${loungeData.length} lounges, ${serviceRequestData.length} service requests, ` +
      `${outletData.length} outlets, ${orderData.length} orders, ${parkingZoneData.length} parking zones, ` +
      `${vehicleLogData.length} vehicle logs, ${fleetData.length} fleet vehicles, ${tripData.length} trips, ` +
      `${surfaceData.length} surfaces, ${equipmentData.length} equipment items, ${packs.length} event packs, 11 users.`,
  );
  console.log("All seed users share the password: Password123!");
}
