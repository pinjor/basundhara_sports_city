import type { Seeder } from "./app";
import { bdt, daysFromToday, refBlock, rng } from "./util";

const iso = (offset: number) => daysFromToday(offset).toISOString().slice(0, 10);
const DAY_MS = 86_400_000;
const ATTENDANCE_DAYS = 30;

/** [name, head, location, headcount, positions [title, grade, salary, openings]] */
const DEPARTMENTS: [string, string, string, number, [string, string, number, number][]][] = [
  ["Operations", "Arafat Karim", "Operations Centre", 180, [["Operations Executive", "G6", 42_000, 3], ["Venue Coordinator", "G5", 55_000, 1], ["Ground Staff", "G9", 22_000, 4]]],
  ["Administration", "Nusrat Jahan", "Admin Tower, L3", 120, [["Admin Officer", "G6", 40_000, 1], ["Front Desk Associate", "G8", 26_000, 2]]],
  ["Sports Management", "Tanvir Hasan", "Academy Block", 95, [["Sports Executive", "G5", 58_000, 2], ["Coach", "G5", 65_000, 2], ["Physiotherapist", "G4", 72_000, 1]]],
  ["Facilities", "Siam Ahmed", "Service Block B", 88, [["Facilities Supervisor", "G5", 52_000, 1], ["Electrician", "G7", 34_000, 2]]],
  ["Security", "Rakib Hossain", "Control Room", 76, [["Security Officer", "G7", 30_000, 4], ["CCTV Operator", "G7", 32_000, 1]]],
  ["Maintenance", "Habib Mia", "Workshop", 64, [["Maintenance Technician", "G7", 33_000, 2], ["Groundskeeper", "G9", 21_000, 1]]],
  ["Finance", "Lamia Rahman", "Admin Tower, L4", 54, [["Accountant", "G5", 60_000, 1], ["Accounts Assistant", "G7", 35_000, 0]]],
  ["IT", "Kazi Tanvir", "Admin Tower, L2", 52, [["Systems Engineer", "G4", 85_000, 1], ["IT Support", "G7", 38_000, 1]]],
  ["Marketing", "Faria Islam", "Admin Tower, L5", 48, [["Marketing Executive", "G6", 48_000, 1], ["Content Designer", "G6", 45_000, 0]]],
  ["Hospitality", "Mahin Chowdhury", "Hospitality Wing", 65, [["Hospitality Associate", "G8", 27_000, 2], ["Lounge Supervisor", "G6", 44_000, 0]]],
];

const FIRST = ["Arif", "Nadia", "Rafiul", "Sadia", "Tanvir", "Farzana", "Imran", "Mithila", "Sabbir", "Ayesha", "Rezaul", "Tahmina", "Shakib", "Nusrat", "Mehedi", "Sumaiya", "Kamrul", "Jannat", "Fahim", "Rumana", "Asif", "Lamia", "Rashed", "Tasnim", "Habib", "Shirin", "Zahid", "Afroza", "Nayeem", "Riya"];
const LAST = ["Hossain", "Islam", "Rahman", "Ahmed", "Khan", "Chowdhury", "Akter", "Karim", "Sarkar", "Uddin", "Haque", "Alam", "Begum", "Mia", "Talukder", "Siddique", "Kabir", "Sultana", "Bhuiyan", "Molla"];
const TYPES: [string, number][] = [
  ["Permanent", 0.62],
  ["Contractual", 0.24],
  ["Part-Time", 0.1],
  ["Intern", 0.04],
];
const NEW_HIRES_THIS_MONTH = 24;
const ON_LEAVE_TODAY = 86;
const ABSENT_TODAY = 31;

export async function seedHrm(seeder: Seeder): Promise<void> {
  if (!(await seeder.empty("department"))) return;
  const { prisma } = seeder;
  const hr = await seeder.actor("hrm@bsc.com.bd");
  const rec = (key: string, input: Record<string, unknown>, moves: string[] = []) => seeder.record(key, hr, input, moves);
  const random = rng(842);
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;

  const positions: { id: string; departmentId: string; salary: number; title: string }[] = [];
  const departmentIds: string[] = [];
  for (const [name, head, location, , roles] of DEPARTMENTS) {
    const department = await rec("department", { name, head, location });
    departmentIds.push(department.id);
    for (const [title, grade, salary, openings] of roles) {
      const position = await rec("position", { title, departmentId: department.id, grade, openings });
      positions.push({ id: position.id, departmentId: department.id, salary, title });
    }
  }

  // Staff in bulk: 842 people, 24 of them joined this month.
  const today = daysFromToday(0);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const staff: { departmentId: string; positionId: string; name: string; salary: number; joinedOn: Date; type: string; birthDate: Date }[] = [];
  DEPARTMENTS.forEach(([, , , headcount], index) => {
    const roles = positions.filter((position) => position.departmentId === departmentIds[index]);
    for (let n = 0; n < headcount; n++) {
      const role = roles[n % roles.length]!;
      const roll = random();
      let acc = 0;
      const type = TYPES.find(([, share]) => (acc += share) >= roll)?.[0] ?? "Permanent";
      staff.push({
        departmentId: departmentIds[index]!,
        positionId: role.id,
        name: `${pick(FIRST)} ${pick(LAST)}`,
        salary: Math.round((role.salary * (0.85 + random() * 0.4)) / 500) * 500,
        joinedOn: new Date(today.getTime() - Math.floor(60 + random() * 3600) * DAY_MS),
        type,
        birthDate: new Date(Date.UTC(1975 + Math.floor(random() * 28), Math.floor(random() * 12), 1 + Math.floor(random() * 28))),
      });
    }
  });
  for (let n = 0; n < NEW_HIRES_THIS_MONTH; n++) {
    const person = staff[(n * 37) % staff.length]!;
    person.joinedOn = new Date(monthStart.getTime() + Math.floor(random() * Math.max(today.getUTCDate() - 1, 1)) * DAY_MS);
  }
  // A few birthdays and anniversaries in the coming weeks.
  for (let n = 0; n < 8; n++) {
    const person = staff[(n * 101 + 7) % staff.length]!;
    const soon = new Date(today.getTime() + (2 + n * 3) * DAY_MS);
    person.birthDate = new Date(Date.UTC(1980 + n * 2, soon.getUTCMonth(), soon.getUTCDate()));
    if (n < 5) person.joinedOn = new Date(Date.UTC(soon.getUTCFullYear() - (1 + n), soon.getUTCMonth(), soon.getUTCDate()));
  }
  const employeeRefs = await refBlock(prisma, "EMP", staff.length);
  await prisma.employee.createMany({
    data: staff.map((person, index) => ({
      reference: employeeRefs[index]!,
      status: "ACTIVE",
      name: person.name,
      departmentId: person.departmentId,
      positionId: person.positionId,
      employmentType: person.type,
      phone: `+880 17${String(10_000_000 + index * 9173).slice(0, 8)}`,
      joinedOn: person.joinedOn,
      birthDate: person.birthDate,
      basicSalaryBdt: bdt(person.salary),
      createdById: hr.id,
    })),
  });
  const employees = await prisma.employee.findMany({ orderBy: { reference: "asc" }, select: { id: true, name: true, departmentId: true } });
  const at = (index: number) => employees[index % employees.length]!;

  // Leave: 86 people away today, plus earlier approved leave this year.
  const leaveRefs = await refBlock(prisma, "LVE", ON_LEAVE_TODAY + 140 + 6);
  let leaveRef = 0;
  const leaveRows = [];
  for (let n = 0; n < ON_LEAVE_TODAY; n++) {
    const start = -Math.floor(random() * 3);
    const type = n % 7 === 0 ? "Sick" : n % 3 === 0 ? "Casual" : "Annual";
    const days = 1 + Math.floor(random() * 4);
    leaveRows.push({ employeeId: at(n * 9 + 3).id, leaveType: type, fromOn: daysFromToday(start), toOn: daysFromToday(start + days - 1), days, status: "APPROVED", reason: "Personal" });
  }
  const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  const elapsed = Math.max(Math.floor((today.getTime() - yearStart.getTime()) / DAY_MS) - 10, 1);
  for (let n = 0; n < 140; n++) {
    const from = new Date(yearStart.getTime() + Math.floor(random() * elapsed) * DAY_MS);
    const type = n < 70 ? "Annual" : n < 100 ? "Casual" : n < 136 ? "Sick" : "Maternity";
    const days = type === "Maternity" ? 3 : 1 + Math.floor(random() * 4);
    leaveRows.push({ employeeId: at(n * 13 + 401).id, leaveType: type, fromOn: from, toOn: new Date(from.getTime() + (days - 1) * DAY_MS), days, status: "APPROVED", reason: "Planned leave" });
  }
  for (let n = 0; n < 6; n++) {
    const days = 1 + (n % 3);
    leaveRows.push({ employeeId: at(n * 29 + 211).id, leaveType: n % 2 ? "Casual" : "Annual", fromOn: daysFromToday(5 + n), toOn: daysFromToday(5 + n + days - 1), days, status: "PENDING", reason: "Family event" });
  }
  await prisma.leaveRequest.createMany({
    data: leaveRows.map((row) => ({ ...row, reference: leaveRefs[leaveRef++]!, decidedBy: row.status === "APPROVED" ? hr.name : null, decidedAt: row.status === "APPROVED" ? row.fromOn : null, createdById: hr.id })),
  });

  // Attendance for the last 30 days; today: 86 on leave, 31 absent, the rest checked in.
  const onLeave = new Set(leaveRows.slice(0, ON_LEAVE_TODAY).map((row) => row.employeeId));
  const attendance = [];
  for (let back = ATTENDANCE_DAYS - 1; back >= 0; back--) {
    const workDate = daysFromToday(-back);
    if (workDate.getUTCDay() === 5) continue;
    let absentToday = 0;
    for (const [index, person] of employees.entries()) {
      if (back === 0 && onLeave.has(person.id)) continue;
      const absent = back === 0 ? !onLeave.has(person.id) && absentToday < ABSENT_TODAY && index % 27 === 4 : random() < 0.04;
      if (absent) absentToday++;
      const checkIn = new Date(workDate.getTime() + (8 * 60 + Math.floor(random() * 50)) * 60_000 - 6 * 3_600_000);
      attendance.push({
        employeeId: person.id,
        workDate,
        shift: index % 3 === 0 ? "Evening" : "Day",
        status: absent ? "ABSENT" : back === 0 ? "CHECKED_IN" : "CHECKED_OUT",
        checkInAt: absent ? null : checkIn,
        checkOutAt: absent || back === 0 ? null : new Date(checkIn.getTime() + 8.5 * 3_600_000),
      });
    }
  }
  const attendanceRefs = await refBlock(prisma, "ATT", attendance.length);
  for (let offset = 0; offset < attendance.length; offset += 5000) {
    await prisma.attendanceRecord.createMany({
      data: attendance.slice(offset, offset + 5000).map((row, index) => ({ ...row, reference: attendanceRefs[offset + index]!, createdById: hr.id })),
    });
  }

  // Payroll: this month processed and waiting. Earlier months are already in the finance seed's salary expenses.
  const payDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  await rec("payrollRun", { period: monthStart.toISOString().slice(0, 7), payDate, notes: "Awaiting finance sign-off" }, ["PROCESSED"]);

  // Recruitment and onboarding.
  const position = (title: string) => positions.find((role) => role.title === title)!;
  await rec("candidate", { name: "Shuvo Das", positionId: position("Coach").id, phone: "+880 1711-555010", source: "Referral" }, ["INTERVIEW"]);
  await rec("candidate", { name: "Moumita Roy", positionId: position("Systems Engineer").id, phone: "+880 1819-333221", email: "moumita.roy@mail.com", source: "LinkedIn" }, ["INTERVIEW", "OFFER"]);
  await rec("candidate", { name: "Jahid Hasan", positionId: position("Security Officer").id, phone: "+880 1552-101202", source: "Walk-in" });
  await rec("candidate", { name: "Priya Saha", positionId: position("Sports Executive").id, phone: "+880 1677-808080", source: "Job portal" }, ["INTERVIEW", "OFFER", "HIRED"]);
  await rec("candidate", { name: "Rony Mondal", positionId: position("Ground Staff").id, phone: "+880 1913-414141", source: "Walk-in" }, ["REJECTED"]);

  for (let n = 0; n < 4; n++) {
    const person = at(n * 211 + 5);
    await rec("employeeDocument", { employeeId: person.id, docType: n % 2 ? "National ID" : "Employment contract", documentNo: `DOC-${48120 + n}`, expiresOn: n % 2 ? undefined : iso(20 + n * 90) });
  }

  // Scheduling.
  const shifts: [string, string, string, string][] = [
    ["Gate A morning", "06:00", "14:00", "Gate A"],
    ["Control room evening", "14:00", "22:00", "Control Room"],
    ["Night patrol", "22:00", "06:00", "Perimeter"],
    ["Pitch prep", "07:00", "12:00", "Central Stadium"],
  ];
  for (const [n, [name, startsAt, endsAt, location]] of shifts.entries()) {
    await rec("shift", { employeeId: at(n * 61 + 520).id, kind: "SHIFT", name, workDate: iso(0), startsAt, endsAt, location });
    await rec("shift", { employeeId: at(n * 61 + 521).id, kind: "DUTY", name: `${location} duty`, workDate: iso(1), startsAt, endsAt, location });
  }
  const events = await prisma.eventPack.findMany({ take: 3, orderBy: { createdAt: "asc" } });
  for (const [n, eventPack] of events.entries()) {
    await rec("workforcePlan", { name: `${eventPack.title} crew`, scope: "EVENT", departmentId: departmentIds[n % 4]!, eventPackId: eventPack.id, headcount: 40 + n * 25, planDate: iso(7 + n * 5) });
    await rec("staffAssignment", { employeeId: at(n * 17 + 90).id, kind: "ALLOCATION", title: "Gate supervisor", eventPackId: eventPack.id, location: "Gate B", priority: "High" });
    await rec("volunteer", { name: `${pick(FIRST)} ${pick(LAST)}`, phone: `+880 1555-0${n}1122`, skill: n ? "Crowd guidance" : "First aid", eventPackId: eventPack.id });
  }
  await rec("workforcePlan", { name: "Security headcount FY26", scope: "PERIOD", departmentId: departmentIds[4]!, headcount: 82, period: "FY2026" }, ["IN_PROGRESS"]);
  await rec("staffAssignment", { employeeId: at(33).id, kind: "TASK", title: "Renew fire safety certificates", dueOn: iso(9), priority: "High" });
  await rec("staffAssignment", { employeeId: at(77).id, kind: "TASK", title: "Update staff handbook", dueOn: iso(21), priority: "Normal" }, ["IN_PROGRESS"]);

  await rec("contractor", { name: "Mizanur Rahman", company: "BuildRight Ltd.", trade: "Civil works", phone: "+880 1711-909001", validUntil: iso(60) });
  await rec("contractor", { name: "Sohel Rana", company: "CoolAir Services", trade: "HVAC", validUntil: iso(14) });
  const volunteers = await prisma.volunteer.findMany({ select: { id: true, eventPackId: true } });
  for (const [n, volunteer] of volunteers.entries()) {
    await rec("volunteerShift", { volunteerId: volunteer.id, eventPackId: volunteer.eventPackId ?? undefined, shift: n % 2 ? "Afternoon" : "Morning", workDate: iso(7 + n * 5) });
  }
  if (volunteers[0]) await rec("recognition", { volunteerId: volunteers[0].id, award: "Volunteer of the month", awardedOn: iso(-12) });
  await rec("badge", { holder: "Mizanur Rahman", holderType: "Contractor", zone: "Back of house", validUntil: iso(60) });
  await rec("badge", { holder: at(520).name, holderType: "Employee", zone: "Control room", validUntil: iso(180) });

  // Skills, training, performance, communication.
  const skills = [];
  for (const [name, category] of [
    ["First aid", "Safety"],
    ["Crowd management", "Safety"],
    ["Electrical maintenance", "Technical"],
    ["Customer service", "Customer"],
    ["Football coaching", "Sport"],
  ] as const) {
    skills.push(await rec("skill", { name, category }));
  }
  for (let n = 0; n < 15; n++) {
    await rec("employeeSkill", { employeeId: at(n * 53 + 11).id, skillId: skills[n % skills.length]!.id, level: (["Basic", "Working", "Advanced"] as const)[n % 3] });
  }
  const course = await rec("trainingSession", { course: "Customer Service Excellence", trainer: "Shirin Akter", sessionDate: iso(6), seats: 20 });
  await rec("trainingSession", { course: "Crowd Safety Refresher", trainer: "Rakib Hossain", sessionDate: iso(-8), seats: 30 }, ["IN_PROGRESS", "COMPLETED"]);
  for (let n = 0; n < 6; n++) await rec("trainingEnrollment", { trainingSessionId: course.id, employeeId: at(n * 97 + 2).id });
  for (let n = 0; n < 5; n++) {
    await rec("performanceReview", { employeeId: at(n * 151 + 8).id, period: "2026-Q3", rating: 3 + (n % 3), reviewer: DEPARTMENTS[n]![1] }, n < 3 ? ["IN_PROGRESS", "COMPLETED"] : []);
    await rec("goal", { employeeId: at(n * 151 + 8).id, period: "2026-Q4", title: ["Cut gate wait times", "Close audit actions", "Zero safety incidents", "Grow academy intake", "Ship booking kiosk"][n]!, score: 40 + n * 12 }, ["IN_PROGRESS"]);
  }
  await rec("announcement", { subject: "Eid holiday roster published", audience: "All staff", channel: "Notice", body: "Check the duty roster for your Eid shifts." }, ["SENT"]);
  await rec("announcement", { subject: "Match-day briefing, Gate team", audience: "Security", channel: "Briefing" });
}
