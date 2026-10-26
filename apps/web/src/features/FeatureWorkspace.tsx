import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AccessMethod,
  BookingStatus,
  BookingType,
  EquipmentCategory,
  EquipmentStatus,
  FacilityStatus,
  FacilityType,
  FleetVehicleType,
  GateType,
  MembershipTier,
  OutletType,
  ParkingZoneType,
  PaymentStatus,
  Role,
  canWriteModule,
  ServiceRequestStatus,
  SurfaceType,
  TripStatus,
  VisitorCategory,
  ZoneStatus,
  ZoneType,
} from "@bsc/shared";
import { useActiveFeature } from "../hooks/useActiveFeature";
import { BookingBoard, bookingExtraLabel, facilityTypesFor } from "./BookingBoard";
import { buildFeatureDesk, FeatureKpis, FeatureRegister } from "./FeatureDesk";
import { featureStage } from "./featureStage";
import { resolveFlow, type FlowDef } from "./flows";
import { Button } from "../components/ui/Button";
import { Field, SelectInput, TextInput } from "../components/ui/Field";
import { useToast } from "../components/ui/Toast";
import { TicketQr } from "../components/tickets/TicketQr";
import { useAuthStore } from "../store/auth";
import { useCreateZone, useSetZoneStatus, useZones } from "../api/zones";
import { useCreateFacility, useFacilities, useSetFacilityStatus } from "../api/facilities";
import { useBookings, useCreateBooking, useSetBookingPaymentStatus, useSetBookingStatus } from "../api/bookings";
import { useCheckInMember, useCreateMember, useMembers, useRenewMember, useSetMemberStatus } from "../api/members";
import { useCreateGate, useGates, useRecentAccessLog, useScanGate, useToggleGate } from "../api/gates";
import { useCheckInVisitor, useCheckOutVisitor, useCreateVisitor, useVisitors } from "../api/visitors";
import { useCreateVipGuest, useSetVipGuestStatus, useVipGuests } from "../api/vipGuests";
import { useAdjustLoungeOccupancy, useAdvanceServiceRequest, useCreateLounge, useCreateServiceRequest, useLounges, useServiceRequests } from "../api/lounges";
import { useAdvanceOrder, useCreateOrder, useCreateOutlet, useOrders, useOutlets } from "../api/outlets";
import { useCreateParkingZone, useParkingZones, useVehicleEntry, useVehicleExit } from "../api/parking";
import { useAdvanceTrip, useCreateFleetVehicle, useCreateTrip, useFleetVehicles, useTrips } from "../api/fleet";
import { useCreateEquipment, useCreateSurface, useEquipment, useSetClosureStatus, useSetEquipmentStatus, useSurfaces } from "../api/surfaces";

function Stepper({ steps, step }: { steps: string[]; step: number }) {
  return (
    <ol className="mb-5 grid grid-cols-2 gap-1.5">
      {steps.map((label, i) => (
        <li
          key={`${label}-${i}`}
          className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold tracking-wide ${
            i === step
              ? "border-gold bg-gold/20 text-gold"
              : i < step
                ? "border-gold/20 bg-gold/10 text-gold-soft"
                : "border-gold/10 bg-search text-text-dimmer"
          }`}
        >
          <span className="mr-1 text-gold/70">{String(i + 1).padStart(2, "0")}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function Actions({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  busy,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {onBack && (
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      )}
      {onNext && (
        <Button type="button" disabled={nextDisabled || busy} onClick={onNext}>
          {busy ? "Working…" : nextLabel}
        </Button>
      )}
    </div>
  );
}

function Done({
  title,
  detail,
  extra,
  overview,
  onAgain,
  packId,
}: {
  title: string;
  detail: string;
  extra?: string;
  overview: string;
  onAgain: () => void;
  packId?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="font-display text-2xl font-semibold gold-foil">{title}</div>
      <p className="text-sm leading-relaxed text-text-dim">{detail}</p>
      {extra && <p className="rounded-md border border-gold/20 bg-gold/5 px-3 py-2 font-mono text-sm text-gold">{extra}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onAgain}>
          Run again
        </Button>
        <Link to={overview} className="inline-flex items-center rounded-md px-4 py-2 text-sm text-gold hover:text-gold-soft">
          Module overview
        </Link>
        {packId && (
          <Link to={`/?view=events&event=${packId}`} className="inline-flex items-center rounded-md px-4 py-2 text-sm text-gold hover:text-gold-soft">
            Open event operations
          </Link>
        )}
      </div>
    </div>
  );
}

export function FeatureWorkspace() {
  const { feature, featureKey, module } = useActiveFeature();
  const flow = useMemo(() => resolveFlow(featureKey, module?.path ?? "/"), [featureKey, module?.path]);
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = canWriteModule(role, module?.key ?? "");
  const overview = module?.path ?? "/";

  const stage = featureStage(featureKey ?? undefined, flow.kind);

  return (
    <div>
      <header className="feature-hero mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {module?.label}
            <span className="mx-2 text-gold/40">·</span>
            {stage.kicker}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold gold-foil">{feature?.label ?? "Operations desk"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-dim">{stage.lede}</p>
        </div>
        <Link to={overview} className="shrink-0 text-sm text-gold hover:text-gold-soft">
          Module overview
        </Link>
      </header>
      {!canWrite && (
        <p className="mb-4 text-sm text-red">
          {role === Role.READ_ONLY_EXECUTIVE
            ? "Read-only executive can view this desk but cannot write."
            : "Your role cannot write in this module."}
        </p>
      )}
      <FlowBody key={featureKey ?? flow.kind} flow={flow} canWrite={canWrite} overview={overview} featureKey={featureKey} />
    </div>
  );
}

function FlowBody({
  flow,
  canWrite,
  overview,
  featureKey,
}: {
  flow: FlowDef;
  canWrite: boolean;
  overview: string;
  featureKey: string | null;
}) {
  const { feature } = useActiveFeature();
  const stage = featureStage(featureKey ?? undefined, flow.kind);
  const [params] = useSearchParams();
  const eventPackId = params.get("event") || undefined;
  const { push } = useToast();
  const [step, setStep] = useState(0);
  const facilityType = flow.kind === "facility-setup" || flow.kind === "facility-status" ? flow.type : undefined;
  const { data: zones = [] } = useZones({});
  const { data: facilities = [] } = useFacilities({ type: facilityType });
  const createZone = useCreateZone();
  const setZoneStatus = useSetZoneStatus();
  const createFacility = useCreateFacility();
  const setFacilityStatus = useSetFacilityStatus();
  const createBooking = useCreateBooking();
  const setBookingStatus = useSetBookingStatus();
  const setPayment = useSetBookingPaymentStatus();
  const { data: bookings = [] } = useBookings({ status: flow.status });
  const createMember = useCreateMember();
  const checkInMember = useCheckInMember();
  const setMemberStatus = useSetMemberStatus();
  const renewMember = useRenewMember();
  const { data: members = [] } = useMembers({ tier: flow.tier, status: flow.status });
  const createGate = useCreateGate();
  const toggleGate = useToggleGate();
  const scanGate = useScanGate();
  const { data: gates = [] } = useGates({ type: flow.kind.startsWith("gate") ? flow.type : undefined });
  const { data: accessLog = [], refetch: refetchAccessLog, isFetching: accessLogFetching } = useRecentAccessLog();
  const createVisitor = useCreateVisitor();
  const checkInVisitor = useCheckInVisitor();
  const checkOutVisitor = useCheckOutVisitor();
  const { data: visitors = [] } = useVisitors({ category: flow.category });
  const createVip = useCreateVipGuest();
  const setVipStatus = useSetVipGuestStatus();
  const { data: vips = [] } = useVipGuests({ status: flow.status });
  const createLounge = useCreateLounge();
  const adjustLounge = useAdjustLoungeOccupancy();
  const createRequest = useCreateServiceRequest();
  const advanceRequest = useAdvanceServiceRequest();
  const { data: lounges = [] } = useLounges();
  const { data: requests = [] } = useServiceRequests();
  const createOutlet = useCreateOutlet();
  const createOrder = useCreateOrder();
  const advanceOrder = useAdvanceOrder();
  const { data: outlets = [] } = useOutlets({ type: flow.kind === "outlet-setup" || flow.kind === "order-flow" ? flow.type : undefined });
  const { data: orders = [] } = useOrders();
  const createParking = useCreateParkingZone();
  const vehicleEntry = useVehicleEntry();
  const vehicleExit = useVehicleExit();
  const { data: parking = [] } = useParkingZones({ type: flow.kind.startsWith("parking") ? flow.type : undefined });
  const createVehicle = useCreateFleetVehicle();
  const createTrip = useCreateTrip();
  const advanceTrip = useAdvanceTrip();
  const { data: vehicles = [] } = useFleetVehicles({ type: flow.kind === "fleet-setup" || flow.kind === "trip-run" ? flow.type : undefined });
  const { data: trips = [] } = useTrips();
  const { data: surfaces = [] } = useSurfaces();
  const setClosure = useSetClosureStatus();
  const createSurface = useCreateSurface();
  const { data: kits = [] } = useEquipment({ category: flow.kind === "equipment-flow" ? flow.type : undefined });
  const createEquipment = useCreateEquipment();
  const setEquipmentStatus = useSetEquipmentStatus();

  const stamp = String(Date.now() % 10000).padStart(4, "0");
  const [name, setName] = useState(feature?.label ? `${feature.label} ${stamp}` : "");
  const [type, setType] = useState(flow.type ?? flow.tier ?? flow.category ?? flow.method ?? "");
  const [method, setMethod] = useState(flow.method ?? AccessMethod.QR);
  const [capacity, setCapacity] = useState(100);
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [hoursStart, setHoursStart] = useState("06:00");
  const [hoursEnd, setHoursEnd] = useState("23:00");
  const [selectedId, setSelectedId] = useState("");
  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(() => {
    if (flow.kind === "member-create") {
      const next = new Date();
      next.setFullYear(next.getFullYear() + 1);
      return next.toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  });
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("19:00");
  const [amount, setAmount] = useState(2500);
  const [detail, setDetail] = useState("");
  const [email, setEmail] = useState("");
  const [person, setPerson] = useState("");
  const [host, setHost] = useState("");
  const [purpose, setPurpose] = useState("Official visit");
  const [plate, setPlate] = useState("");
  const [from, setFrom] = useState(stage.from ?? "Main gate");
  const [to, setTo] = useState(stage.to ?? "Central Stadium");
  const [vehicleId, setVehicleId] = useState("");
  const [item, setItem] = useState("Sparkling water");
  const [result, setResult] = useState("");
  const [resultExtra, setResultExtra] = useState("");
  const [packId, setPackId] = useState(eventPackId ?? "");

  const busy =
    createZone.isPending ||
    createFacility.isPending ||
    createBooking.isPending ||
    createMember.isPending ||
    createGate.isPending ||
    scanGate.isPending ||
    createVisitor.isPending ||
    createVip.isPending ||
    createLounge.isPending ||
    createRequest.isPending ||
    createOutlet.isPending ||
    createOrder.isPending ||
    createParking.isPending ||
    vehicleEntry.isPending ||
    createVehicle.isPending ||
    createTrip.isPending ||
    createSurface.isPending ||
    createEquipment.isPending;

  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const desk = useMemo(
    () =>
      buildFeatureDesk(
        flow.kind,
        {
          zones,
          facilities,
          bookings,
          members,
          gates,
          accessLog,
          visitors,
          vips,
          lounges,
          requests,
          outlets,
          orders,
          parking,
          vehicles,
          trips,
          surfaces,
          kits,
        },
        flow.type,
        featureKey ?? undefined,
      ),
    [
      flow.kind,
      flow.type,
      featureKey,
      zones,
      facilities,
      bookings,
      members,
      gates,
      accessLog,
      visitors,
      vips,
      lounges,
      requests,
      outlets,
      orders,
      parking,
      vehicles,
      trips,
      surfaces,
      kits,
    ],
  );

  useEffect(() => {
    if (stage.from) setFrom(stage.from);
    if (stage.to) setTo(stage.to);
  }, [stage.from, stage.to]);

  useEffect(() => {
    if (customer) return;
    if (featureKey === "vip-transport" && vips[0]) setCustomer(vips[0].name);
    if (featureKey === "team-transport") setCustomer("National team squad");
    if (featureKey === "event-transport") setCustomer("Opening ceremony guests");
  }, [featureKey, vips, customer]);

  function reset() {
    setStep(0);
    setResult("");
    setResultExtra("");
    setSelectedId("");
    setVehicleId("");
  }

  function selectDeskRow(id: string) {
    const trip = trips.find((t) => t.id === id);
    if (trip) {
      setSelectedId(trip.id);
      setCustomer(trip.passengerRef);
      setFrom(trip.fromLocation);
      setTo(trip.toLocation);
      if (trip.vehicleId) setVehicleId(trip.vehicleId);
      if (trip.status === TripStatus.REQUESTED) setStep(2);
      else if (trip.status === TripStatus.IN_PROGRESS) setStep(3);
      return;
    }
    const vehicle = vehicles.find((v) => v.id === id);
    if (vehicle && flow.kind === "trip-run") {
      setVehicleId(vehicle.id);
      return;
    }
    setSelectedId(id);
    if (flow.kind === "zone-map") setStep(Math.max(step, 1));
  }

  async function run(label: string, fn: () => Promise<void>, next = step + 1) {
    try {
      await fn();
      push(label);
      setStep(next);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      push(Array.isArray(message) ? message[0] : message ?? "Action failed.", "danger");
    }
  }

  const finished = step >= flow.steps.length - 1 && !!result;
  const selectedZone = zones.find((z) => z.id === selectedId);

  return (
    <div>
      <FeatureKpis items={desk.kpis} />
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          {flow.kind.startsWith("booking") ? (
            <BookingBoard featureKey={featureKey} bookings={bookings} selectedId={selectedId} onSelect={selectDeskRow} />
          ) : (
            <FeatureRegister title={stage.boardTitle} rows={desk.rows} selectedId={selectedId || vehicleId} onSelect={selectDeskRow} />
          )}
        </div>
        <aside className="min-w-0 lg:col-span-4">
          <div className="action-rail rounded-xl p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">Action</p>
            <h3 className="mb-4 mt-1 font-display text-lg font-semibold text-text">{stage.actionTitle}</h3>
            {finished ? (
              <Done title="Recorded" detail={result} extra={resultExtra || undefined} overview={overview} onAgain={reset} packId={packId || eventPackId} />
            ) : (
              <>
                <Stepper steps={flow.steps} step={step} />
                {flow.kind === "gate-log" && (
                  <div className="space-y-4">
                    <p className="text-sm text-text-dim">Every grant and denial writes to the register on the left. Run a QR, RFID or biometric scan from Access Control to add a new line.</p>
                    <Actions onNext={() => void refetchAccessLog()} nextLabel="Refresh log" busy={accessLogFetching} />
                  </div>
                )}
                {flow.kind === "zone-map" && (
                  <div className="space-y-4">
                    <p className="text-sm text-text-dim">
                      {selectedZone
                        ? `${selectedZone.name} is ${selectedZone.status} with ${selectedZone.liveOccupancy}/${selectedZone.capacity} on site.`
                        : "Select a location in the register, then flip its live status."}
                    </p>
                    {selectedId && (
                      <Actions
                        onNext={() =>
                          void run("Zone updated.", async () => {
                            const zone = zones.find((z) => z.id === selectedId);
                            if (!zone) return;
                            const next = zone.status === ZoneStatus.OPERATIONAL ? ZoneStatus.RESTRICTED : ZoneStatus.OPERATIONAL;
                            const updated = await setZoneStatus.mutateAsync({ id: zone.id, status: next });
                            setResult(`${updated.name} is now ${updated.status} on the live map.`);
                          }, flow.steps.length - 1)
                        }
                        nextLabel="Update live status"
                        nextDisabled={!canWrite}
                        busy={setZoneStatus.isPending}
                      />
                    )}
                  </div>
                )}

      {flow.kind === "zone-setup" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Zone name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Type">
                <SelectInput value={type || ZoneType.FACILITY} onChange={(e) => setType(e.target.value)}>
                  {Object.values(ZoneType).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Building">
                <TextInput value={building} onChange={(e) => setBuilding(e.target.value)} />
              </Field>
              <Field label="Floor">
                <TextInput value={floor} onChange={(e) => setFloor(e.target.value)} />
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!name} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Capacity">
                <TextInput type="number" min={0} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </Field>
              <Actions onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </>
          )}
          {step >= 2 && (
            <>
              <p className="text-sm text-text-dim">
                {name} · {type || ZoneType.FACILITY} · {capacity} capacity
                {building ? ` · ${building}` : ""}
              </p>
              <Actions
                onBack={() => setStep(1)}
                onNext={() =>
                  void run("Zone is live.", async () => {
                    const created = await createZone.mutateAsync({
                      name,
                      type: type || ZoneType.FACILITY,
                      status: flow.status || ZoneStatus.OPERATIONAL,
                      capacity,
                      building: building || undefined,
                      floor: floor || undefined,
                    });
                    setResult(`${created.name} is now ${created.status}.`);
                  })
                }
                nextLabel="Activate zone"
                nextDisabled={!canWrite}
                busy={busy}
              />
            </>
          )}
        </Panel>
      )}

      {flow.kind === "facility-setup" && (
        <Panel>
          {zones.length === 0 && <p className="text-sm text-text-dim">Create a zone first from Zones & Complex Map.</p>}
          {step === 0 && (
            <>
              <Field label="Facility name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Type">
                <SelectInput value={type || FacilityType.TURF} onChange={(e) => setType(e.target.value)}>
                  {Object.values(FacilityType).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Zone">
                <SelectInput value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                  <option value="">Select zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!name || !zoneId} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Opens">
                <TextInput type="time" value={hoursStart} onChange={(e) => setHoursStart(e.target.value)} />
              </Field>
              <Field label="Closes">
                <TextInput type="time" value={hoursEnd} onChange={(e) => setHoursEnd(e.target.value)} />
              </Field>
              <Field label="Capacity">
                <TextInput type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </Field>
              <Actions onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </>
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Facility is available.", async () => {
                  const created = await createFacility.mutateAsync({
                    name,
                    zoneId,
                    type: type || FacilityType.TURF,
                    capacity,
                    operatingHoursStart: hoursStart,
                    operatingHoursEnd: hoursEnd,
                    status: FacilityStatus.AVAILABLE,
                  });
                  setResult(`${created.name} is Available and open ${hoursStart}–${hoursEnd}.`);
                })
              }
              nextLabel="Open for play"
              nextDisabled={!canWrite}
              busy={busy}
            />
          )}
        </Panel>
      )}

      {flow.kind === "facility-status" && (
        <Panel>
          <Field label="Facility">
            <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Select facility</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} · {f.status}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Actions
            onNext={() =>
              void run("Status changed.", async () => {
                const facility = facilities.find((f) => f.id === selectedId) ?? facilities[0];
                const next = facility.status === FacilityStatus.AVAILABLE ? FacilityStatus.IN_USE : FacilityStatus.AVAILABLE;
                const updated = await setFacilityStatus.mutateAsync({ id: facility.id, status: next });
                setResult(`${updated.name} is now ${updated.status}.`);
              }, flow.steps.length - 1)
            }
            nextLabel="Advance status"
            nextDisabled={!canWrite || facilities.length === 0}
          />
        </Panel>
      )}

      {flow.kind === "booking-create" && (
        <Panel>
          {facilities.length === 0 && <p className="text-sm text-text-dim">Open a facility first — this booking needs a live space.</p>}
          {step === 0 && (
            <>
              <Field label="Facility">
                <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  <option value="">Select facility</option>
                  {(() => {
                    const types = facilityTypesFor(featureKey);
                    const matched = types ? facilities.filter((f) => types.includes(f.type)) : facilities;
                    const choices = matched.length > 0 ? matched : facilities;
                    return choices.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ));
                  })()}
                </SelectInput>
              </Field>
              <Field label="Date">
                <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start">
                  <TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                </Field>
                <Field label="End">
                  <TextInput type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
                </Field>
              </div>
              <Actions onNext={() => setStep(1)} nextDisabled={!selectedId} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Customer">
                <TextInput value={customer} onChange={(e) => setCustomer(e.target.value)} />
              </Field>
              <Field label="Type">
                <SelectInput value={type || flow.type || BookingType.PUBLIC} onChange={(e) => setType(e.target.value)}>
                  {Object.values(BookingType).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Amount (৳)">
                <TextInput type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              </Field>
              {bookingExtraLabel(featureKey) && (
                <Field label={bookingExtraLabel(featureKey) ?? "Detail"}>
                  <TextInput value={detail} onChange={(e) => setDetail(e.target.value)} />
                </Field>
              )}
              <Actions onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!customer} />
            </>
          )}
          {step === 2 && (
            <>
              <p className="text-sm text-text-dim">
                Hold {customer} on {date} {start}–{end} for ৳{amount.toLocaleString()}.
              </p>
              <Actions
                onBack={() => setStep(1)}
                onNext={() =>
                  void run("Booking held as Pending.", async () => {
                    const created = await createBooking.mutateAsync({
                      facilityId: selectedId,
                      customerName: customer,
                      type: type || flow.type || BookingType.PUBLIC,
                      date,
                      timeSlotStart: start,
                      timeSlotEnd: end,
                      amount,
                      featureKey: featureKey || undefined,
                      detail: detail.trim() || undefined,
                    });
                    setSelectedId(created.id);
                    setResultExtra(created.qrConfirmationCode);
                  })
                }
                nextLabel="Hold slot"
                nextDisabled={!canWrite}
                busy={busy}
              />
            </>
          )}
          {step >= 3 && (
            <Actions
              onBack={() => setStep(2)}
              onNext={() =>
                void run("Paid and confirmed.", async () => {
                  const confirmed = await setBookingStatus.mutateAsync({ id: selectedId, status: BookingStatus.CONFIRMED });
                  const paid = await setPayment.mutateAsync({ id: selectedId, paymentStatus: PaymentStatus.PAID });
                  setResult(`${paid.customerName} is Confirmed and Paid.`);
                  setResultExtra(`QR ${paid.qrConfirmationCode}${confirmed.eventPack ? ` · Pack ${confirmed.eventPack.title}` : ""}`);
                  if (confirmed.eventPack?.id) setPackId(confirmed.eventPack.id);
                })
              }
              nextLabel="Confirm, take payment, issue QR"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
        </Panel>
      )}

      {(flow.kind === "booking-advance" || flow.kind === "booking-pay") && (
        <Panel>
          <Field label="Booking">
            <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Select booking</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.customerName} · {b.status} · ৳{Number(b.amount)}
                </option>
              ))}
            </SelectInput>
          </Field>
          {flow.kind === "booking-pay" ? (
            <Actions
              onNext={() =>
                void run("Payment recorded.", async () => {
                  const booking = bookings.find((b) => b.id === selectedId) ?? bookings[0];
                  const updated = await setPayment.mutateAsync({ id: booking.id, paymentStatus: PaymentStatus.PAID });
                  setResult(`${updated.customerName} is Paid.`);
                  setResultExtra(`QR ${updated.qrConfirmationCode}`);
                }, 2)
              }
              nextLabel="Mark paid"
              nextDisabled={!canWrite || bookings.length === 0}
            />
          ) : (
            <Actions
              onNext={() =>
                void run("Booking advanced.", async () => {
                  const booking = bookings.find((b) => b.id === selectedId) ?? bookings[0];
                  const next = booking.status === BookingStatus.PENDING ? BookingStatus.CONFIRMED : BookingStatus.COMPLETED;
                  const updated = await setBookingStatus.mutateAsync({ id: booking.id, status: next });
                  setResult(`${updated.customerName} is now ${updated.status}.`);
                }, 2)
              }
              nextLabel="Advance booking"
              nextDisabled={!canWrite || bookings.length === 0}
            />
          )}
        </Panel>
      )}

      {flow.kind === "member-create" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Email">
                <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!name || !email} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Tier">
                <SelectInput value={type || flow.tier || MembershipTier.INDIVIDUAL} onChange={(e) => setType(e.target.value)}>
                  {Object.values(MembershipTier).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Expiry">
                <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Actions onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </>
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Member activated.", async () => {
                  const created = await createMember.mutateAsync({
                    name,
                    email,
                    tier: type || flow.tier || MembershipTier.INDIVIDUAL,
                    expiryDate: new Date(date).toISOString(),
                  });
                  setResult(`${created.name} is ${created.status} on the ${created.tier} roll.`);
                })
              }
              nextLabel="Activate membership"
              nextDisabled={!canWrite}
              busy={busy}
            />
          )}
        </Panel>
      )}

      {(flow.kind === "member-checkin" || flow.kind === "member-lifecycle") && (
        <Panel>
          <Field label="Member">
            <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.tier} · {m.status}
                </option>
              ))}
            </SelectInput>
          </Field>
          {flow.kind === "member-checkin" ? (
            <Actions
              onNext={() =>
                void run("Checked in.", async () => {
                  const member = members.find((m) => m.id === selectedId) ?? members[0];
                  const updated = await checkInMember.mutateAsync(member.id);
                  setResult(`${updated.name} checked in. Count ${updated.checkInCount}.`);
                }, 2)
              }
              nextLabel="Check in"
              nextDisabled={!canWrite || members.length === 0}
            />
          ) : (
            <Actions
              onNext={() =>
                void run("Status updated.", async () => {
                  const member = members.find((m) => m.id === selectedId) ?? members[0];
                  if (member.status === "Expired") {
                    const updated = await renewMember.mutateAsync({ id: member.id });
                    setResult(`${updated.name} renewed to ${updated.status}.`);
                  } else {
                    const updated = await setMemberStatus.mutateAsync({
                      id: member.id,
                      status: member.status === "Frozen" ? "Active" : "Frozen",
                    });
                    setResult(`${updated.name} is ${updated.status}.`);
                  }
                }, 2)
              }
              nextLabel="Update membership"
              nextDisabled={!canWrite || members.length === 0}
            />
          )}
        </Panel>
      )}

      {flow.kind === "gate-setup" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Gate name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Type">
                <SelectInput value={type || flow.type || GateType.MAIN} onChange={(e) => setType(e.target.value)}>
                  {Object.values(GateType).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!name} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Zone">
                <SelectInput value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                  <option value="">Select zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Actions onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!zoneId} />
            </>
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Gate is online.", async () => {
                  const created = await createGate.mutateAsync({ name, zoneId, type: type || flow.type || GateType.MAIN });
                  setResult(`${created.name} is ${created.status}.`);
                })
              }
              nextLabel="Bring online"
              nextDisabled={!canWrite}
              busy={busy}
            />
          )}
        </Panel>
      )}

      {flow.kind === "gate-scan" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Gate">
                <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  <option value="">Select gate</option>
                  {gates.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} · {g.type} · {g.status}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Actions
                onNext={() => {
                  if (!selectedId && gates[0]) setSelectedId(gates[0].id);
                  setStep(1);
                }}
                nextDisabled={gates.length === 0}
              />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Person / credential">
                <TextInput value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Name or pass id" />
              </Field>
              <Field label="Method">
                <SelectInput value={method} onChange={(e) => setMethod(e.target.value)}>
                  {Object.values(AccessMethod).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </SelectInput>
              </Field>
              <Actions onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!person} />
            </>
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Scan recorded.", async () => {
                  const gate = gates.find((g) => g.id === selectedId) ?? gates[0];
                  const entry = await scanGate.mutateAsync({
                    id: gate.id,
                    personRef: person,
                    method,
                  });
                  setResult(`${entry.personRef} · ${entry.result}`);
                  setResultExtra(`${entry.method} at ${new Date(entry.timestamp).toLocaleTimeString()}`);
                })
              }
              nextLabel="Scan now"
              nextDisabled={!canWrite || gates.length === 0}
              busy={busy}
            />
          )}
        </Panel>
      )}

      {flow.kind === "gate-toggle" && (
        <Panel>
          <Field label="Gate">
            <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Select gate</option>
              {gates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.status}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Actions
            onNext={() =>
              void run("Gate toggled.", async () => {
                const gate = gates.find((g) => g.id === selectedId) ?? gates[0];
                const updated = await toggleGate.mutateAsync(gate.id);
                setResult(`${updated.name} is ${updated.status}.`);
              }, 2)
            }
            nextLabel="Toggle online / offline"
            nextDisabled={!canWrite || gates.length === 0}
          />
        </Panel>
      )}

      {flow.kind === "visitor-journey" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Visitor">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Host">
                <TextInput value={host} onChange={(e) => setHost(e.target.value)} />
              </Field>
              <Field label="Purpose">
                <TextInput value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </Field>
              <Field label="Category">
                <SelectInput value={type || flow.category || VisitorCategory.GUEST} onChange={(e) => setType(e.target.value)}>
                  {Object.values(VisitorCategory).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </SelectInput>
              </Field>
              <Actions
                onNext={() =>
                  void run("Visitor registered.", async () => {
                    const created = await createVisitor.mutateAsync({
                      name,
                      host,
                      purpose,
                      category: type || flow.category || VisitorCategory.GUEST,
                      escortRequired: purpose.toLowerCase().includes("escort"),
                      eventPackId,
                    });
                    setSelectedId(created.id);
                    setResultExtra(created.qrPassCode);
                  })
                }
                nextLabel="Register"
                nextDisabled={!canWrite || !name || !host}
                busy={busy}
              />
            </>
          )}
          {step === 1 && (
            <Actions
              onBack={() => setStep(0)}
              onNext={() =>
                void run("Checked in.", async () => {
                  const updated = await checkInVisitor.mutateAsync(selectedId);
                  setResultExtra(updated.qrPassCode);
                })
              }
              nextLabel="Check in"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
          {step === 2 && (
            <>
              {resultExtra ? (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-36 shrink-0 overflow-hidden rounded-lg [&_.skeleton]:h-36 [&_.skeleton]:w-full [&_img]:h-auto [&_img]:w-full"><TicketQr value={resultExtra} /></div>
                  <p className="font-mono text-sm text-text-dim">Pass {resultExtra}</p>
                </div>
              ) : (
                <p className="rounded-md bg-surface-2 px-3 py-2 text-sm">Pass issued.</p>
              )}
              <Actions onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Continue to check-out" />
            </>
          )}
          {step >= 3 && (
            <Actions
              onBack={() => setStep(2)}
              onNext={() =>
                void run("Checked out.", async () => {
                  const updated = await checkOutVisitor.mutateAsync(selectedId);
                  setResult(`${updated.name} completed the visit.`);
                  setResultExtra(`Pass ${updated.qrPassCode}`);
                })
              }
              nextLabel="Check out"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
        </Panel>
      )}

      {(flow.kind === "visitor-checkin" || flow.kind === "visitor-checkout") && (
        <Panel>
          {(() => {
            const list = visitors.filter((v) => (flow.kind === "visitor-checkin" ? v.status === "Expected" : v.status === "Checked In"));
            return (
              <>
                <Field label="Visitor">
                  <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                    <option value="">Select visitor</option>
                    {list.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} · {v.status}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Actions
                  onNext={() =>
                    void run("Visitor updated.", async () => {
                      const visitor = list.find((v) => v.id === selectedId) ?? list[0];
                      const updated =
                        flow.kind === "visitor-checkin"
                          ? await checkInVisitor.mutateAsync(visitor.id)
                          : await checkOutVisitor.mutateAsync(visitor.id);
                      setResult(`${updated.name} is ${updated.status}.`);
                      setResultExtra(`Pass ${updated.qrPassCode}`);
                    }, 2)
                  }
                  nextLabel={flow.kind === "visitor-checkin" ? "Check in" : "Check out"}
                  nextDisabled={!canWrite || list.length === 0}
                />
              </>
            );
          })()}
        </Panel>
      )}

      {flow.kind === "vip-journey" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Guest">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Designation">
                <TextInput value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              </Field>
              {vips.length > 0 && (
                <Field label="Or continue an existing guest">
                  <SelectInput
                    value=""
                    onChange={(e) => {
                      const guest = vips.find((v) => v.id === e.target.value);
                      if (!guest) return;
                      setSelectedId(guest.id);
                      setName(guest.name);
                      setStep(guest.status === "Arrived" ? 3 : 2);
                    }}
                  >
                    <option value="">Start a new arrival</option>
                    {vips.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} · {v.status}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              )}
              <Actions onNext={() => setStep(1)} nextDisabled={!name} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Lounge assignment">
                <TextInput value={item} onChange={(e) => setItem(e.target.value)} />
              </Field>
              <Field label="Seat">
                <TextInput value={building} onChange={(e) => setBuilding(e.target.value)} />
              </Field>
              <Actions
                onBack={() => setStep(0)}
                onNext={() =>
                  void run("VIP scheduled.", async () => {
                    const created = await createVip.mutateAsync({
                      name,
                      designation: purpose,
                      classification: "Government",
                      arrivalDatetime: new Date().toISOString(),
                      loungeAssignment: item || "Protocol Lounge",
                      seatAllocation: building || "Box A1",
                      mealPreference: "Light",
                      privacyFlag: true,
                      eventPackId,
                    });
                    setSelectedId(created.id);
                  })
                }
                nextLabel="Save arrival plan"
                nextDisabled={!canWrite}
                busy={busy}
              />
            </>
          )}
          {step === 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("VIP arrived.", async () => {
                  await setVipStatus.mutateAsync({ id: selectedId, status: "Arrived" });
                })
              }
              nextLabel="Mark arrived"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
          {step >= 3 && (
            <Actions
              onBack={() => setStep(2)}
              onNext={() =>
                void run("VIP departed.", async () => {
                  const updated = await setVipStatus.mutateAsync({ id: selectedId, status: "Departed" });
                  setResult(`${updated.name} protocol complete.`);
                })
              }
              nextLabel="Mark departed"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
        </Panel>
      )}

      {flow.kind === "lounge-setup" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Lounge">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Zone">
                <SelectInput value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                  <option value="">Select zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!name || !zoneId} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Capacity">
                <TextInput type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </Field>
              <Actions onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </>
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Lounge open.", async () => {
                  const created = await createLounge.mutateAsync({ name, zoneId, capacity });
                  setResult(`${created.name} is ${created.status}.`);
                })
              }
              nextLabel="Open lounge"
              nextDisabled={!canWrite}
              busy={busy}
            />
          )}
        </Panel>
      )}

      {flow.kind === "lounge-party" && (
        <Panel>
          <Field label="Lounge">
            <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Select lounge</option>
              {lounges.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} · {l.currentOccupancy}/{l.capacity}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="flex gap-2">
            <Button
              disabled={!canWrite || lounges.length === 0}
              onClick={() =>
                void run("Party checked in.", async () => {
                  const lounge = lounges.find((l) => l.id === selectedId) ?? lounges[0];
                  const updated = await adjustLounge.mutateAsync({ id: lounge.id, direction: "check-in" });
                  setResult(`${updated.name} occupancy ${updated.currentOccupancy}/${updated.capacity}.`);
                }, 2)
              }
            >
              Party in
            </Button>
            <Button
              variant="secondary"
              disabled={!canWrite || lounges.length === 0}
              onClick={() =>
                void run("Party checked out.", async () => {
                  const lounge = lounges.find((l) => l.id === selectedId) ?? lounges[0];
                  const updated = await adjustLounge.mutateAsync({ id: lounge.id, direction: "check-out" });
                  setResult(`${updated.name} occupancy ${updated.currentOccupancy}/${updated.capacity}.`);
                }, 2)
              }
            >
              Party out
            </Button>
          </div>
        </Panel>
      )}

      {flow.kind === "service-request" && (
        <Panel>
          {lounges.length === 0 && <p className="text-sm text-text-dim">Open a lounge first, then raise service from here.</p>}
          {step === 0 && (
            <>
              <Field label="Party">
                <TextInput value={customer} onChange={(e) => setCustomer(e.target.value)} />
              </Field>
              <Field label="Item">
                <TextInput value={item} onChange={(e) => setItem(e.target.value)} />
              </Field>
              <Actions
                onNext={() =>
                  void run("Request raised.", async () => {
                    const created = await createRequest.mutateAsync({ loungeId: lounges[0].id, partyRef: customer, item, eventPackId });
                    setSelectedId(created.id);
                  })
                }
                nextLabel="Raise request"
                nextDisabled={!canWrite || !customer || lounges.length === 0}
                busy={busy}
              />
            </>
          )}
          {step === 1 && (
            <Actions
              onBack={() => setStep(0)}
              onNext={() =>
                void run("Preparing.", async () => {
                  await advanceRequest.mutateAsync({ id: selectedId, status: ServiceRequestStatus.PREPARING });
                })
              }
              nextLabel="Start preparing"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Delivered.", async () => {
                  const updated = await advanceRequest.mutateAsync({ id: selectedId, status: ServiceRequestStatus.DELIVERED });
                  setResult(`${updated.item} delivered to ${updated.partyRef}.`);
                })
              }
              nextLabel="Mark delivered"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
        </Panel>
      )}

      {flow.kind === "outlet-setup" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Outlet">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Type">
                <SelectInput value={type || flow.type || OutletType.RESTAURANT} onChange={(e) => setType(e.target.value)}>
                  {Object.values(OutletType).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Zone">
                <SelectInput value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                  <option value="">Select zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!name || !zoneId} />
            </>
          )}
          {step >= 1 && (
            <Actions
              onBack={() => setStep(0)}
              onNext={() =>
                void run("Outlet open.", async () => {
                  const created = await createOutlet.mutateAsync({
                    name,
                    type: type || flow.type || OutletType.RESTAURANT,
                    zoneId,
                  });
                  setResult(`${created.name} is ${created.status}.`);
                })
              }
              nextLabel="Open outlet"
              nextDisabled={!canWrite}
              busy={busy}
            />
          )}
        </Panel>
      )}

      {flow.kind === "order-flow" && (
        <Panel>
          {outlets.length === 0 && <p className="text-sm text-text-dim">Open an outlet first, then run kitchen orders here.</p>}
          {step === 0 && (
            <>
              <Field label="Outlet">
                <SelectInput value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                  <option value="">Select outlet</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Item">
                <TextInput value={item} onChange={(e) => setItem(e.target.value)} />
              </Field>
              <Actions
                onNext={() =>
                  void run("Order received.", async () => {
                    const created = await createOrder.mutateAsync({
                      outletId: zoneId || outlets[0].id,
                      items: [{ name: item, qty: 1 }],
                      amount: 850,
                      eventPackId,
                    });
                    setSelectedId(created.id);
                  })
                }
                nextLabel="Place order"
                nextDisabled={!canWrite || outlets.length === 0}
                busy={busy}
              />
            </>
          )}
          {step === 1 && (
            <Actions
              onBack={() => setStep(0)}
              onNext={() =>
                void run("Kitchen started.", async () => {
                  await advanceOrder.mutateAsync({ id: selectedId, status: "Preparing" });
                })
              }
              nextLabel="Start kitchen"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Order delivered.", async () => {
                  const live = orders.find((o) => o.id === selectedId);
                  if (live?.status === "Preparing") await advanceOrder.mutateAsync({ id: selectedId, status: "Ready for Pickup" });
                  const updated = await advanceOrder.mutateAsync({ id: selectedId, status: "Delivered" });
                  setResult(`Order ${updated.id.slice(0, 8)} delivered.`);
                })
              }
              nextLabel="Deliver"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
        </Panel>
      )}

      {flow.kind === "parking-setup" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Parking zone">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Type">
                <SelectInput value={type || flow.type || ParkingZoneType.PUBLIC} onChange={(e) => setType(e.target.value)}>
                  {Object.values(ParkingZoneType).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!name} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Capacity">
                <TextInput type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </Field>
              <Actions onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </>
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Parking zone open.", async () => {
                  const created = await createParking.mutateAsync({
                    name,
                    type: type || flow.type || ParkingZoneType.PUBLIC,
                    capacity,
                    zoneId: zones[0]?.id,
                  });
                  setResult(`${created.name} ready. ${created.occupied}/${created.capacity} occupied.`);
                })
              }
              nextLabel="Open parking"
              nextDisabled={!canWrite}
              busy={busy}
            />
          )}
        </Panel>
      )}

      {flow.kind === "parking-cycle" && (
        <Panel>
          {parking.length === 0 && <p className="text-sm text-text-dim">Open a parking zone first, then run entry and exit here.</p>}
          {step === 0 && (
            <>
              <Field label="Parking zone">
                <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  <option value="">Select zone</option>
                  {parking.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} · {z.occupied}/{z.capacity}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Plate">
                <TextInput value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="DHA-1234" />
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={(!selectedId && parking.length === 0) || !plate} />
            </>
          )}
          {step === 1 && (
            <Actions
              onBack={() => setStep(0)}
              onNext={() =>
                void run("Vehicle entered.", async () => {
                  const zone = parking.find((z) => z.id === selectedId) ?? parking[0];
                  await vehicleEntry.mutateAsync({
                    id: zone.id,
                    plateNumber: plate,
                    type: (flow.type as string) || zone.type,
                  });
                })
              }
              nextLabel="Log entry"
              nextDisabled={!canWrite || !plate}
              busy={busy}
            />
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Vehicle exited.", async () => {
                  const zone = parking.find((z) => z.id === selectedId) ?? parking[0];
                  await vehicleExit.mutateAsync({ id: zone.id, plateNumber: plate });
                  setResult(`${plate} completed the parking cycle.`);
                })
              }
              nextLabel="Log exit"
              nextDisabled={!canWrite || !plate}
            />
          )}
        </Panel>
      )}

      {flow.kind === "fleet-setup" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Type">
                <SelectInput value={type || flow.type || FleetVehicleType.BUGGY} onChange={(e) => setType(e.target.value)}>
                  {Object.values(FleetVehicleType).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Actions onNext={() => setStep(1)} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Driver">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Actions onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </>
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Vehicle available.", async () => {
                  const created = await createVehicle.mutateAsync({
                    type: type || flow.type || FleetVehicleType.BUGGY,
                    driverName: name || "Unassigned",
                    currentLocation: "Depot",
                  });
                  setResult(`${created.type} · ${created.driverName} is ${created.status}.`);
                })
              }
              nextLabel="Register vehicle"
              nextDisabled={!canWrite}
              busy={busy}
            />
          )}
        </Panel>
      )}

      {flow.kind === "trip-run" && (
        <Panel>
          {flow.type && (
            <p className="rounded-md border border-gold/20 bg-gold/5 px-3 py-2 text-xs text-gold">
              This desk is scoped to {flow.type}
              {availableVehicles.length === 0 ? " — no unit is free right now." : ` · ${availableVehicles.length} ready to dispatch.`}
            </p>
          )}
          {step === 0 && (
            <>
              <Field label={featureKey === "vip-transport" ? "Protocol passenger" : "Passenger"}>
                <TextInput value={customer} onChange={(e) => setCustomer(e.target.value)} required />
              </Field>
              <Field label="From">
                <TextInput value={from} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="To">
                <TextInput value={to} onChange={(e) => setTo(e.target.value)} />
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!customer} />
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Assign vehicle">
                <SelectInput value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">First available {flow.type ?? "vehicle"}</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.type} · {v.driverName ?? "Unassigned"} · {v.currentLocation ?? "Depot"}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Actions
                onBack={() => setStep(0)}
                onNext={() =>
                  void run("Trip dispatched.", async () => {
                    const created = await createTrip.mutateAsync({
                      passengerRef: customer,
                      fromLocation: from,
                      toLocation: to,
                      vehicleId: vehicleId || availableVehicles[0]?.id,
                      eventPackId,
                    });
                    setSelectedId(created.id);
                  })
                }
                nextLabel="Dispatch vehicle"
                nextDisabled={!canWrite || availableVehicles.length === 0}
                busy={busy}
              />
            </>
          )}
          {step === 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Trip in progress.", async () => {
                  await advanceTrip.mutateAsync({ id: selectedId, status: TripStatus.IN_PROGRESS });
                })
              }
              nextLabel="Start trip"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
          {step >= 3 && (
            <Actions
              onBack={() => setStep(2)}
              onNext={() =>
                void run("Trip completed.", async () => {
                  const updated = await advanceTrip.mutateAsync({ id: selectedId, status: TripStatus.COMPLETED });
                  setResult(`${updated.passengerRef} arrived at ${updated.toLocation}.`);
                })
              }
              nextLabel="Complete trip"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
        </Panel>
      )}

      {flow.kind === "surface-close" && (
        <Panel>
          {step === 0 && surfaces.length === 0 && (
            <>
              <p className="text-sm text-text-dim">No surface yet — create one, then set closure.</p>
              <Field label="Facility">
                <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  <option value="">Select facility</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Surface type">
                <SelectInput value={type || SurfaceType.NATURAL_GRASS} onChange={(e) => setType(e.target.value)}>
                  {Object.values(SurfaceType).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Actions
                onNext={() =>
                  void run("Surface created.", async () => {
                    const created = await createSurface.mutateAsync({
                      facilityId: selectedId || facilities[0]?.id,
                      surfaceType: type || SurfaceType.NATURAL_GRASS,
                      moisturePercent: 40,
                    });
                    setSelectedId(created.id);
                  })
                }
                nextLabel="Create surface"
                nextDisabled={!canWrite || facilities.length === 0}
                busy={busy}
              />
            </>
          )}
          {step === 0 && surfaces.length > 0 && (
            <>
              <Field label="Surface">
                <SelectInput value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  <option value="">Select surface</option>
                  {surfaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.surfaceType} · {s.closureStatus}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!selectedId && surfaces.length === 0} />
            </>
          )}
          {step >= 1 && (
            <Actions
              onBack={() => setStep(0)}
              onNext={() =>
                void run("Closure updated.", async () => {
                  const surface = surfaces.find((s) => s.id === selectedId) ?? surfaces[0];
                  const id = selectedId || surface?.id;
                  const current = surface?.closureStatus ?? "Open";
                  const next = current === "Open" ? flow.status || "Closed for Maintenance" : "Open";
                  const updated = await setClosure.mutateAsync({ id, closureStatus: next });
                  setResult(`${updated.surfaceType} is ${updated.closureStatus}.`);
                })
              }
              nextLabel="Toggle closure"
              nextDisabled={!canWrite}
            />
          )}
        </Panel>
      )}

      {flow.kind === "equipment-flow" && (
        <Panel>
          {step === 0 && (
            <>
              <Field label="Kit name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Category">
                <SelectInput value={type || flow.type || EquipmentCategory.BALLS} onChange={(e) => setType(e.target.value)}>
                  {Object.values(EquipmentCategory).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Quantity">
                <TextInput type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
              </Field>
              <Actions onNext={() => setStep(1)} nextDisabled={!name} />
            </>
          )}
          {step === 1 && (
            <Actions
              onBack={() => setStep(0)}
              onNext={() =>
                void run("Kit stocked.", async () => {
                  const created = await createEquipment.mutateAsync({
                    name,
                    category: type || flow.type || EquipmentCategory.BALLS,
                    quantity: capacity,
                  });
                  setSelectedId(created.id);
                })
              }
              nextLabel="Add to inventory"
              nextDisabled={!canWrite}
              busy={busy}
            />
          )}
          {step >= 2 && (
            <Actions
              onBack={() => setStep(1)}
              onNext={() =>
                void run("Kit deployed.", async () => {
                  const kit = kits.find((k) => k.id === selectedId);
                  const updated = await setEquipmentStatus.mutateAsync({
                    id: selectedId || kit?.id || "",
                    status: EquipmentStatus.DEPLOYED,
                  });
                  setResult(`${updated.name} is ${updated.status}.`);
                })
              }
              nextLabel="Deploy kit"
              nextDisabled={!canWrite || !selectedId}
            />
          )}
        </Panel>
      )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
