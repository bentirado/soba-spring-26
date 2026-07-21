import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Define the props for a reusable dashboard stat card.
type StatCardProps = {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  action?: ReactNode;
};

// Reusable card component for displaying one overview metric.
export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  action,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {/* Card label */}
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {action}
          </div>

          {/* Main metric value */}
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
