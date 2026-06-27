import {
  LayoutDashboard,
  Ticket,
  Users,
  Sparkles,
  BookOpen,
  BarChart3,
  TrendingUp,
  CreditCard,
  Settings,
  Bell,
  Building2,
  Tag,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Mail,
  MessageSquare,
  Paperclip,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Upload,
  Download,
  RefreshCw,
  LogOut,
  User,
  Shield,
  Clock,
  Calendar,
  Hash,
  Globe,
  Lock,
  Unlock,
  Star,
  Heart,
  Zap,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Info,
  AlertCircle,
  HelpCircle,
  type LucideProps,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Base icon wrapper ─────────────────────────────── */
interface IconProps extends LucideProps {
  icon: LucideIcon;
  className?: string;
}

function Icon({ icon: LucideComponent, className, size = 16, ...props }: IconProps) {
  return (
    <LucideComponent
      size={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/* ── Sized icon factories ──────────────────────────── */
type SizedIconProps = Omit<IconProps, "icon">;

function makeIcon(lucideIcon: LucideIcon) {
  const Comp = ({ className, size = 16, ...props }: SizedIconProps) => (
    <Icon icon={lucideIcon} size={size} className={className} {...props} />
  );
  Comp.displayName = lucideIcon.displayName ?? lucideIcon.name;
  return Comp;
}

/* ── Navigation icons ──────────────────────────────── */
export const DashboardIcon    = makeIcon(LayoutDashboard);
export const TicketIcon       = makeIcon(Ticket);
export const CustomerIcon     = makeIcon(Users);
export const AIIcon           = makeIcon(Sparkles);
export const KnowledgeIcon    = makeIcon(BookOpen);
export const ReportsIcon      = makeIcon(BarChart3);
export const AnalyticsIcon    = makeIcon(TrendingUp);
export const BillingIcon      = makeIcon(CreditCard);
export const SettingsIcon     = makeIcon(Settings);
export const NotificationsIcon = makeIcon(Bell);
export const DepartmentIcon   = makeIcon(Building2);
export const TagIcon          = makeIcon(Tag);

/* ── Action icons ──────────────────────────────────── */
export const SearchIcon       = makeIcon(Search);
export const FilterIcon       = makeIcon(Filter);
export const PlusIcon         = makeIcon(Plus);
export const EditIcon         = makeIcon(Pencil);
export const DeleteIcon       = makeIcon(Trash2);
export const CopyIcon         = makeIcon(Copy);
export const CheckIcon        = makeIcon(Check);
export const ExternalLinkIcon = makeIcon(ExternalLink);
export const UploadIcon       = makeIcon(Upload);
export const DownloadIcon     = makeIcon(Download);
export const RefreshIcon      = makeIcon(RefreshCw);
export const LogOutIcon       = makeIcon(LogOut);
export const MoreHorizontalIcon = makeIcon(MoreHorizontal);
export const MoreVerticalIcon   = makeIcon(MoreVertical);

/* ── Priority / Status icons ───────────────────────── */
export const PriorityUrgentIcon = makeIcon(AlertTriangle);
export const StatusResolvedIcon = makeIcon(CheckCircle2);
export const StatusOpenIcon     = makeIcon(AlertCircle);

/* ── Communication icons ────────────────────────────── */
export const EmailIcon      = makeIcon(Mail);
export const ChatIcon       = makeIcon(MessageSquare);
export const AttachmentIcon = makeIcon(Paperclip);

/* ── Directional icons ──────────────────────────────── */
export const ChevronRightIcon = makeIcon(ChevronRight);
export const ChevronLeftIcon  = makeIcon(ChevronLeft);
export const ChevronDownIcon  = makeIcon(ChevronDown);
export const ChevronUpIcon    = makeIcon(ChevronUp);
export const ArrowLeftIcon    = makeIcon(ArrowLeft);
export const ArrowRightIcon   = makeIcon(ArrowRight);
export const ArrowUpIcon      = makeIcon(ArrowUp);
export const ArrowDownIcon    = makeIcon(ArrowDown);
export const CloseIcon        = makeIcon(X);

/* ── User / Org icons ───────────────────────────────── */
export const UserIcon    = makeIcon(User);
export const ShieldIcon  = makeIcon(Shield);
export const GlobeIcon   = makeIcon(Globe);
export const LockIcon    = makeIcon(Lock);
export const UnlockIcon  = makeIcon(Unlock);

/* ── Misc icons ─────────────────────────────────────── */
export const ClockIcon    = makeIcon(Clock);
export const CalendarIcon = makeIcon(Calendar);
export const HashIcon     = makeIcon(Hash);
export const StarIcon     = makeIcon(Star);
export const HeartIcon    = makeIcon(Heart);
export const ZapIcon      = makeIcon(Zap);
export const InfoIcon     = makeIcon(Info);
export const HelpIcon     = makeIcon(HelpCircle);
export const EyeIcon      = makeIcon(Eye);
export const EyeOffIcon   = makeIcon(EyeOff);

/* ── Loading ────────────────────────────────────────── */
export function LoadingIcon({ className, size = 16 }: SizedIconProps) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin shrink-0", className)}
      aria-hidden="true"
    />
  );
}

/* ── Re-export base for custom usage ────────────────── */
export { Icon };
export type { IconProps, SizedIconProps, LucideIcon, LucideProps };
