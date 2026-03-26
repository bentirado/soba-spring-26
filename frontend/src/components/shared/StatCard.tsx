// import { LucideIcon } from "lucide-react";

// interface StatCardProps {
//   title: string;
//   value: string | number;
//   change?: string;
//   changeType?: "positive" | "negative" | "neutral";
//   icon: LucideIcon;
//   iconColor?: string;
// }

// export function StatCard({ 
//   title, 
//   value, 
//   change, 
//   changeType = "neutral", 
//   icon: Icon,
//   iconColor = "bg-primary"
// }: StatCardProps) {
//   const changeColors = {
//     positive: "text-accent",
//     negative: "text-destructive",
//     neutral: "text-muted-foreground",
//   };

//   return (
//     <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <p className="text-sm text-muted-foreground mb-1">{title}</p>
//           <h3 className="text-3xl mb-2">{value}</h3>
//           {change && (
//             <p className={`text-sm ${changeColors[changeType]}`}>
//               {change}
//             </p>
//           )}
//         </div>
//         <div className={`${iconColor} rounded-lg p-3`}>
//           <Icon className="w-6 h-6 text-white" />
//         </div>
//       </div>
//     </div>
//   );
// }


import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-blue-600",
}: StatCardProps) {
  const changeColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-500",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="mb-1 text-sm text-gray-500">{title}</p>
          <h3 className="mb-2 text-3xl font-semibold text-gray-900">{value}</h3>
          {change && (
            <p className={`text-sm ${changeColors[changeType]}`}>{change}</p>
          )}
        </div>

        <div className={`${iconColor} rounded-lg p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}