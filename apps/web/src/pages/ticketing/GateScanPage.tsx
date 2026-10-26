import { useEffect, useRef, useState } from "react";
import { DeskHeader } from "../../components/ui/DeskHeader";
import { useGates } from "../../api/gates";
import { scanDeviceId, verifyTicket, type ScanDecision } from "../../api/ticketing";
import { Button } from "../../components/ui/Button";
import { FeatureStrip } from "../platform/ResourceFeature";
import { useI18n } from "../../lib/i18n";
import { apiErrorMessage } from "../../lib/apiError";
import axios from "axios";

type Lane = "ready" | "scanning" | "result" | "offline" | "manual";

const COPY: Record<string, { key: "scan.valid" | "scan.used" | "scan.wrong" | "scan.invalid" | "scan.expired" | "scan.early"; bg: string; fg: string }> = {
  OK: { key: "scan.valid", bg: "var(--status-success)", fg: "#04140c" },
  ALREADY_USED: { key: "scan.used", bg: "var(--status-danger)", fg: "#1a0808" },
  WRONG_GATE: { key: "scan.wrong", bg: "var(--status-warning)", fg: "#1a1204" },
  CREDENTIAL_INVALID: { key: "scan.invalid", bg: "var(--status-danger)", fg: "#1a0808" },
  CREDENTIAL_REVOKED: { key: "scan.invalid", bg: "var(--status-danger)", fg: "#1a0808" },
  EXPIRED: { key: "scan.expired", bg: "var(--status-danger)", fg: "#1a0808" },
  NOT_YET_VALID: { key: "scan.early", bg: "var(--status-warning)", fg: "#1a1204" },
  NOT_ENTERED: { key: "scan.invalid", bg: "var(--status-warning)", fg: "#1a1204" },
};

export function GateScanPage() {
  const { t } = useI18n();
  const gates = useGates({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gateId, setGateId] = useState("");
  const [token, setToken] = useState("");
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [lane, setLane] = useState<Lane>("ready");
  const [result, setResult] = useState<ScanDecision | null>(null);
  const [cameraNote, setCameraNote] = useState<string | null>(null);
  const lastToken = useRef("");
  const gateRef = useRef("");
  const directionRef = useRef<"IN" | "OUT">("IN");
  gateRef.current = gateId;
  directionRef.current = direction;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !("BarcodeDetector" in window)) {
      setCameraNote("This browser has no QR detector. Enter the code manually.");
      return;
    }
    let stop = false;
    let stream: MediaStream | null = null;
    const Detector = (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        await video.play();
        const detector = new Detector({ formats: ["qr_code"] });
        const tick = async () => {
          if (stop) return;
          try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue;
            if (value && value !== lastToken.current) {
              lastToken.current = value;
              setToken(value);
              await submit(value);
            }
          } catch {
            /* a missed frame is not a decision */
          }
          if (!stop) window.setTimeout(() => void tick(), 400);
        };
        void tick();
      } catch {
        setCameraNote("Camera permission was denied. Enter the code manually.");
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
    // submit is stable enough for the lifetime of the page; gate and direction are read from state at call time via the function below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(value: string) {
    const credentialToken = value.trim();
    if (credentialToken.length < 8) return;
    setLane("scanning");
    try {
      const decision = await verifyTicket({
        credentialToken,
        scanId: crypto.randomUUID(),
        deviceId: scanDeviceId(),
        direction: directionRef.current,
        gateId: gateRef.current || undefined,
      });
      setResult(decision);
      setLane("result");
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response) {
        setLane("offline");
        setResult(null);
        return;
      }
      setLane("result");
      setResult({ decision: "DENY", reason: apiErrorMessage(error, "CREDENTIAL_INVALID") });
    }
  }

  const visual = result ? COPY[result.reason] ?? COPY.CREDENTIAL_INVALID : null;

  return (
    <div className="max-w-3xl">
      <FeatureStrip />
      <DeskHeader kicker="Ticketing" title={t("ops.scan")} lede="Offline admission is not enabled. A lost connection is manual review, not an allow." />
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">Gate
          <select value={gateId} onChange={(event) => setGateId(event.target.value)} className="mt-1 block min-h-11 rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3">
            <option value="">Any gate</option>
            {(gates.data ?? []).map((gate) => <option key={gate.id} value={gate.id}>{gate.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Direction
          <select value={direction} onChange={(event) => setDirection(event.target.value === "OUT" ? "OUT" : "IN")} className="mt-1 block min-h-11 rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3">
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </label>
      </div>
      <video ref={videoRef} className="mt-4 h-40 w-full rounded-lg bg-black object-cover" muted playsInline aria-label="QR camera preview" />
      {cameraNote && <p className="mt-2 text-sm text-text-dim">{cameraNote}</p>}
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void submit(token); }}>
        <label className="min-w-0 w-full text-sm sm:min-w-[240px] sm:w-auto sm:flex-1">Manual code
          <input value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" className="mt-1 min-h-12 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3 font-mono" />
        </label>
        <Button type="submit" className="mt-6">Check</Button>
        <Button type="button" variant="secondary" className="mt-6" aria-pressed={lane === "manual"} onClick={() => { setLane(lane === "manual" ? "ready" : "manual"); setResult(null); }}>
          {lane === "manual" ? "Resume lane" : "Hold lane"}
        </Button>
      </form>

      <div
        className="scan-result mt-4 flex min-h-48 flex-col items-center justify-center rounded-2xl px-4 py-8 text-center"
        style={{ background: lane === "offline" || lane === "manual" ? "var(--status-warning)" : visual?.bg ?? "var(--surface-primary)", color: lane === "offline" || lane === "manual" ? "#1a1204" : visual?.fg ?? "var(--text-primary)" }}
        role="status"
        aria-live="assertive"
      >
        <p className="font-display text-4xl font-bold uppercase sm:text-5xl">
          {lane === "ready" && t("scan.ready")}
          {lane === "scanning" && t("common.loading")}
          {lane === "offline" && t("scan.offline")}
          {lane === "manual" && t("scan.manual")}
          {lane === "result" && visual && t(visual.key)}
        </p>
        {lane === "result" && result?.detail && (
          <p className="mt-3 text-lg">{result.detail.firstName} · {result.detail.eventTitle} · {result.detail.row}{result.detail.seat} · {result.detail.gateName}</p>
        )}
        {(lane === "offline" || lane === "manual") && <p className="mt-3 max-w-md text-base">{t("scan.offlineHelp")}</p>}
      </div>
    </div>
  );
}
