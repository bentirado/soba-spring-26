// Define the props for a reusable dashboard stat card.
type StatCardProps = {
  title: string;
  value: string | number;
};

// Reusable card component for displaying one overview metric.
export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Card label */}
      <p className="text-sm font-medium text-slate-500">{title}</p>

      {/* Main metric value */}
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
