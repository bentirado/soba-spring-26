import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Define the props for a reusable dashboard stat card.
type StatCardProps = {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  action?: ReactNode;
};

// Reusable card component for displaying one overview metric.
export default function StatCard({ title, value, icon: Icon, iconColor = "bg-blue-600", action }: StatCardProps) {
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
          <div className={`${iconColor} rounded-lg p-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
