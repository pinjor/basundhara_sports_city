import { useState } from "react";
import { useQueryText } from "../../hooks/useQueryText";
import { BookingStatus, Role } from "@bsc/shared";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { useFeaturePreset } from "../../lib/featurePresets";
import { Button } from "../../components/ui/Button";
import { SelectInput, TextInput } from "../../components/ui/Field";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatTile } from "../../components/ui/StatTile";
import { useBookings } from "../../api/bookings";
import { useFacilities } from "../../api/facilities";
import { useAuthStore } from "../../store/auth";
import { BookingFormModal } from "./BookingFormModal";
import { BookingDetailModal } from "./BookingDetailModal";
import type { BookingDto } from "@bsc/shared";

function downloadCsv(rows: BookingDto[]) {
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Customer", "Facility", "Type", "Date", "Start", "End", "Amount (BDT)", "Payment", "Status"];
  const lines = rows.map((b) => [b.customerName, b.facility?.name, b.type, String(b.date).slice(0, 10), b.timeSlotStart, b.timeSlotEnd, Number(b.amount), b.paymentStatus, b.status].map(cell).join(","));
  const url = URL.createObjectURL(new Blob([[header.map(cell).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `bookings-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

export function BookingsPage() {
  const [status, setStatus] = useQueryText("status");
  const [search, setSearch] = useQueryText();
  const [type, setType] = useState("");
  useFeaturePreset((preset) => {
    setType(preset.type ?? "");
    setStatus(preset.status ?? status);
    setSearch(preset.search ?? search);
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data: bookingsRaw = [], isLoading } = useBookings({ status: status || undefined, search: search || undefined });
  const bookings = type ? bookingsRaw.filter((b) => b.type === type) : bookingsRaw;
  const { data: facilities = [] } = useFacilities({});
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === Role.SUPER_ADMIN || role === Role.BOOKINGS_OFFICER;

  const todayStr = new Date().toDateString();
  const todayCount = bookings.filter((b) => new Date(b.date).toDateString() === todayStr).length;
  const pendingCount = bookings.filter((b) => b.status === BookingStatus.PENDING).length;
  const revenue = bookings
    .filter((b) => b.status !== BookingStatus.CANCELLED)
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const columns: Column<BookingDto>[] = [
    { header: "Customer", accessor: (b) => <span className="font-medium">{b.customerName}</span> },
    { header: "Facility", accessor: (b) => b.facility?.name ?? "—" },
    { header: "Type", accessor: (b) => b.type },
    { header: "Date", accessor: (b) => new Date(b.date).toLocaleDateString() },
    { header: "Slot", accessor: (b) => `${b.timeSlotStart}–${b.timeSlotEnd}` },
    { header: "Amount", accessor: (b) => `৳${Number(b.amount).toLocaleString()}` },
    { header: "Payment", accessor: (b) => <StatusBadge status={b.paymentStatus} /> },
    { header: "Status", accessor: (b) => <StatusBadge status={b.status} /> },
  ];

  return (
    <div>
      <ModuleHeader
        purpose="Online, member, corporate and academy bookings across every field, court, lane and event space."
        action={
          <>
            <Button variant="secondary" disabled={bookings.length === 0} onClick={() => downloadCsv(bookings)}>Export CSV</Button>
            {canManage && <Button onClick={() => setCreateOpen(true)}>+ New booking</Button>}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total bookings" value={bookings.length} tone="gold" />
        <StatTile label="Today" value={todayCount} tone="teal" />
        <StatTile label="Pending approval" value={pendingCount} tone="blue" />
        <StatTile label="Revenue (excl. cancelled)" value={revenue} prefix="৳" />
      </div>

      <div className="mb-4 grid gap-3 panel p-4 sm:grid-cols-3">
        <TextInput placeholder="Search by customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.values(BookingStatus).map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-dim">Loading bookings…</p>
      ) : (
        <DataTable columns={columns} rows={bookings} keyFor={(b) => b.id} onRowClick={(b) => setSelectedBookingId(b.id)} />
      )}

      <BookingFormModal open={createOpen} onClose={() => setCreateOpen(false)} facilities={facilities} />
      <BookingDetailModal bookingId={selectedBookingId} onClose={() => setSelectedBookingId(null)} />
    </div>
  );
}
