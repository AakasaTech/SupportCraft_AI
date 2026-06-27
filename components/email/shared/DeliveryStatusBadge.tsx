interface Props {
  status: string;
  size?:  "sm" | "md";
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending:   { label: "Pending",   class: "bg-gray-100 text-gray-600" },
  queued:    { label: "Queued",    class: "bg-blue-100 text-blue-700" },
  sent:      { label: "Sent",      class: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", class: "bg-green-100 text-green-700" },
  opened:    { label: "Opened",    class: "bg-emerald-100 text-emerald-700" },
  bounced:   { label: "Bounced",   class: "bg-red-100 text-red-700" },
  rejected:  { label: "Rejected",  class: "bg-red-100 text-red-700" },
  failed:    { label: "Failed",    class: "bg-red-100 text-red-700" },
  spam:      { label: "Spam",      class: "bg-amber-100 text-amber-700" },
  dead:      { label: "Dead",      class: "bg-gray-200 text-gray-500" },
};

export function DeliveryStatusBadge({ status, size = "sm" }: Props) {
  const cfg   = STATUS_CONFIG[status] ?? { label: status, class: "bg-gray-100 text-gray-600" };
  const sizeClass = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}
