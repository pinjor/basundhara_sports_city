import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Download,
  Factory,
  FileText,
  Globe,
  Handshake,
  Info,
  Leaf,
  ListPlus,
  Mail,
  MapPin,
  Menu,
  Minus,
  Package,
  PencilRuler,
  Phone,
  Plus,
  Ship,
  SwatchBook,
  Upload,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/**
 * One icon set: Lucide as the base, normalised to a 1.5px stroke on a 24px
 * grid with round joins. "fibre" is drawn to the same rules so it sits in
 * the family. Do not import icons from any other library.
 */

function FibreGlyph(props: LucideProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { size = 24, strokeWidth = 1.5, className, absoluteStrokeWidth, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M3 17c3 0 4.5-2.5 7-5s4-4 7-4" />
      <path d="M3 13c3 0 4.5 2 7 3.5s4.5 1.5 8-1" />
      <path d="M17 8c1.6 0 3 1 4 2.5" />
      <path d="M18 15.5c1.2-.9 2.2-1.1 3-1" />
    </svg>
  );
}

const ICONS = {
  fibre: FibreGlyph as unknown as LucideIcon,
  leaf: Leaf,
  package: Package,
  quality: BadgeCheck,
  document: FileText,
  ship: Ship,
  globe: Globe,
  sample: SwatchBook,
  customize: PencilRuler,
  handshake: Handshake,
  factory: Factory,
  pin: MapPin,
  // UI
  arrowRight: ArrowRight,
  external: ArrowUpRight,
  plus: Plus,
  minus: Minus,
  close: X,
  menu: Menu,
  chevronDown: ChevronDown,
  check: Check,
  upload: Upload,
  mail: Mail,
  phone: Phone,
  download: Download,
  addToList: ListPlus,
  rfq: ClipboardList,
  info: Info,
  alert: CircleAlert,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
export const iconNames = Object.keys(ICONS) as IconName[];

type Props = Omit<LucideProps, "ref"> & { name: IconName; label?: string };

export function Icon({ name, label, size = 24, strokeWidth = 1.5, ...rest }: Props) {
  const Cmp = ICONS[name];
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...rest}
    />
  );
}
