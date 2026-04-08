// import { StatCard } from "@/components/shared/StatCard";
// import { DollarSign, TrendingUp, CreditCard, ShoppingBag } from "lucide-react";
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   AreaChart,
//   Area,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// const monthlyRevenue = [
//   { month: "Oct", admissions: 28000, memberships: 8000, gift_shop: 4500, events: 1500 },
//   { month: "Nov", admissions: 32000, memberships: 9500, gift_shop: 5200, events: 2100 },
//   { month: "Dec", admissions: 38000, memberships: 12000, gift_shop: 6800, events: 1200 },
//   { month: "Jan", admissions: 26000, memberships: 7500, gift_shop: 4200, events: 1300 },
//   { month: "Feb", admissions: 35000, memberships: 11000, gift_shop: 6500, events: 1500 },
//   { month: "Mar", admissions: 42000, memberships: 14000, gift_shop: 7200, events: 1800 },
// ];

// const revenueBreakdown = [
//   { name: "Admissions", value: 42000, color: "#1e5eb8", percentage: 65 },
//   { name: "Memberships", value: 14000, color: "#ff7b3f", percentage: 21 },
//   { name: "Gift Shop", value: 7200, color: "#2ea86f", percentage: 11 },
//   { name: "Special Events", value: 1800, color: "#4a9dd9", percentage: 3 },
// ];

// const ticketTypes = [
//   { type: "Adult", sold: 1820, revenue: 36400 },
//   { type: "Child", sold: 2150, revenue: 21500 },
//   { type: "Senior", sold: 680, revenue: 10200 },
//   { type: "Student", sold: 890, revenue: 11125 },
//   { type: "Family Pass", sold: 360, revenue: 25200 },
// ];

// const dailyRevenue = [
//   { day: "Mon", revenue: 8200 },
//   { day: "Tue", revenue: 9100 },
//   { day: "Wed", revenue: 10500 },
//   { day: "Thu", revenue: 9800 },
//   { day: "Fri", revenue: 13200 },
//   { day: "Sat", revenue: 18500 },
//   { day: "Sun", revenue: 16700 },
// ];

// export function Revenue() {
//   const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl font-semibold mb-2">Revenue Analytics</h1>
//         <p className="text-muted-foreground">
//           Financial performance and revenue streams analysis
//         </p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Monthly Revenue"
//           value={`$${totalRevenue.toLocaleString()}`}
//           change="+20.4% from last month"
//           changeType="positive"
//           icon={DollarSign}
//           iconColor="bg-primary"
//         />
//         <StatCard
//           title="Avg. Transaction"
//           value="$48.50"
//           change="+$3.20 increase"
//           changeType="positive"
//           icon={CreditCard}
//           iconColor="bg-secondary"
//         />
//         <StatCard
//           title="Gift Shop Sales"
//           value="$7,200"
//           change="+10.8% growth"
//           changeType="positive"
//           icon={ShoppingBag}
//           iconColor="bg-accent"
//         />
//         <StatCard
//           title="Revenue Growth"
//           value="+20%"
//           change="Year over year"
//           changeType="positive"
//           icon={TrendingUp}
//           iconColor="bg-primary"
//         />
//       </div>

//       {/* Revenue Trend */}
//       <div className="bg-card border border-border rounded-xl p-6">
//         <h3 className="mb-4">Revenue Trend by Source (Last 6 Months)</h3>
//         <ResponsiveContainer width="100%" height={350}>
//           <AreaChart data={monthlyRevenue}>
//             <defs>
//               <linearGradient id="admissions" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#1e5eb8" stopOpacity={0.8} />
//                 <stop offset="95%" stopColor="#1e5eb8" stopOpacity={0.1} />
//               </linearGradient>
//               <linearGradient id="memberships" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#ff7b3f" stopOpacity={0.8} />
//                 <stop offset="95%" stopColor="#ff7b3f" stopOpacity={0.1} />
//               </linearGradient>
//               <linearGradient id="giftshop" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#2ea86f" stopOpacity={0.8} />
//                 <stop offset="95%" stopColor="#2ea86f" stopOpacity={0.1} />
//               </linearGradient>
//             </defs>
//             <CartesianGrid strokeDasharray="3 3" stroke="#e8eff5" />
//             <XAxis dataKey="month" stroke="#5c6c7d" />
//             <YAxis stroke="#5c6c7d" />
//             <Tooltip
//               contentStyle={{
//                 backgroundColor: "#ffffff",
//                 border: "1px solid #e8eff5",
//                 borderRadius: "8px",
//               }}
//             />
//             <Legend />
//             <Area
//               type="monotone"
//               dataKey="admissions"
//               stackId="1"
//               stroke="#1e5eb8"
//               fill="url(#admissions)"
//               name="Admissions"
//             />
//             <Area
//               type="monotone"
//               dataKey="memberships"
//               stackId="1"
//               stroke="#ff7b3f"
//               fill="url(#memberships)"
//               name="Memberships"
//             />
//             <Area
//               type="monotone"
//               dataKey="gift_shop"
//               stackId="1"
//               stroke="#2ea86f"
//               fill="url(#giftshop)"
//               name="Gift Shop"
//             />
//           </AreaChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Revenue Breakdown & Daily Revenue */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Revenue Breakdown */}
//         <div className="bg-card border border-border rounded-xl p-6">
//           <h3 className="mb-4">Revenue Breakdown (March)</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={revenueBreakdown}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 label={({ name, percentage }) => `${name}: ${percentage}%`}
//                 outerRadius={100}
//                 fill="#8884d8"
//                 dataKey="value"
//               >
//                 {revenueBreakdown.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip
//                 formatter={(value) => `$${Number(value).toLocaleString()}`}
//               />
//             </PieChart>
//           </ResponsiveContainer>
//           <div className="mt-4 space-y-2">
//             {revenueBreakdown.map((item) => (
//               <div
//                 key={item.name}
//                 className="flex justify-between items-center text-sm"
//               >
//                 <div className="flex items-center gap-2">
//                   <div
//                     className="w-3 h-3 rounded-full"
//                     style={{ backgroundColor: item.color }}
//                   />
//                   <span>{item.name}</span>
//                 </div>
//                 <span className="text-muted-foreground">
//                   ${item.value.toLocaleString()}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Daily Revenue */}
//         <div className="bg-card border border-border rounded-xl p-6">
//           <h3 className="mb-4">Daily Revenue (This Week)</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={dailyRevenue}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#e8eff5" />
//               <XAxis dataKey="day" stroke="#5c6c7d" />
//               <YAxis stroke="#5c6c7d" />
//               <Tooltip
//                 contentStyle={{
//                   backgroundColor: "#ffffff",
//                   border: "1px solid #e8eff5",
//                   borderRadius: "8px",
//                 }}
//                 formatter={(value) => `$${Number(value).toLocaleString()}`}
//               />
//               <Bar dataKey="revenue" fill="#ff7b3f" radius={[8, 8, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Ticket Sales Analysis */}
//       <div className="bg-card border border-border rounded-xl p-6">
//         <h3 className="mb-4">Ticket Sales by Type</h3>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-border">
//                 <th className="text-left py-3 px-4">Ticket Type</th>
//                 <th className="text-right py-3 px-4">Tickets Sold</th>
//                 <th className="text-right py-3 px-4">Revenue</th>
//                 <th className="text-right py-3 px-4">Avg. Price</th>
//               </tr>
//             </thead>
//             <tbody>
//               {ticketTypes.map((ticket, index) => (
//                 <tr
//                   key={ticket.type}
//                   className={index !== ticketTypes.length - 1 ? "border-b border-border" : ""}
//                 >
//                   <td className="py-3 px-4">{ticket.type}</td>
//                   <td className="text-right py-3 px-4">{ticket.sold.toLocaleString()}</td>
//                   <td className="text-right py-3 px-4 text-accent">
//                     ${ticket.revenue.toLocaleString()}
//                   </td>
//                   <td className="text-right py-3 px-4 text-muted-foreground">
//                     ${(ticket.revenue / ticket.sold).toFixed(2)}
//                   </td>
//                 </tr>
//               ))}
//               <tr className="bg-muted">
//                 <td className="py-3 px-4">Total</td>
//                 <td className="text-right py-3 px-4">
//                   {ticketTypes.reduce((sum, t) => sum + t.sold, 0).toLocaleString()}
//                 </td>
//                 <td className="text-right py-3 px-4 text-accent">
//                   ${ticketTypes.reduce((sum, t) => sum + t.revenue, 0).toLocaleString()}
//                 </td>
//                 <td className="text-right py-3 px-4"></td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Financial Insights */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-card border border-border rounded-xl p-6">
//           <div className="flex items-start gap-3">
//             <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
//               <TrendingUp className="w-5 h-5 text-primary" />
//             </div>
//             <div>
//               <h3 className="mb-1">Best Performing</h3>
//               <p className="text-sm text-muted-foreground mb-2">
//                 Saturday generates 28% of weekly revenue
//               </p>
//               <p className="text-2xl text-primary">$18,500</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-card border border-border rounded-xl p-6">
//           <div className="flex items-start gap-3">
//             <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
//               <ShoppingBag className="w-5 h-5 text-secondary" />
//             </div>
//             <div>
//               <h3 className="mb-1">Gift Shop Growth</h3>
//               <p className="text-sm text-muted-foreground mb-2">
//                 Gift shop revenue up 10.8% this month
//               </p>
//               <p className="text-2xl text-secondary">+$700</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-card border border-border rounded-xl p-6">
//           <div className="flex items-start gap-3">
//             <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
//               <CreditCard className="w-5 h-5 text-accent" />
//             </div>
//             <div>
//               <h3 className="mb-1">Membership Revenue</h3>
//               <p className="text-sm text-muted-foreground mb-2">
//                 21% of total revenue from memberships
//               </p>
//               <p className="text-2xl text-accent">$14,000</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import { StatCard } from "@/components/shared/StatCard";
import { DollarSign, TrendingUp, CreditCard, ShoppingBag } from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const monthlyRevenue = [
  { month: "Oct", admissions: 28000, memberships: 8000, gift_shop: 4500, events: 1500 },
  { month: "Nov", admissions: 32000, memberships: 9500, gift_shop: 5200, events: 2100 },
  { month: "Dec", admissions: 38000, memberships: 12000, gift_shop: 6800, events: 1200 },
  { month: "Jan", admissions: 26000, memberships: 7500, gift_shop: 4200, events: 1300 },
  { month: "Feb", admissions: 35000, memberships: 11000, gift_shop: 6500, events: 1500 },
  { month: "Mar", admissions: 42000, memberships: 14000, gift_shop: 7200, events: 1800 },
];

const revenueBreakdown = [
  { name: "Admissions", value: 42000, color: "#1f4f99", percentage: 65 },
  { name: "Memberships", value: 14000, color: "#ff7a3d", percentage: 21 },
  { name: "Gift Shop", value: 7200, color: "#2fb36f", percentage: 11 },
  { name: "Special Events", value: 1800, color: "#60a5fa", percentage: 3 },
];

const ticketTypes = [
  { type: "Adult", sold: 1820, revenue: 36400 },
  { type: "Child", sold: 2150, revenue: 21500 },
  { type: "Senior", sold: 680, revenue: 10200 },
  { type: "Student", sold: 890, revenue: 11125 },
  { type: "Family Pass", sold: 360, revenue: 25200 },
];

const dailyRevenue = [
  { day: "Mon", revenue: 8200 },
  { day: "Tue", revenue: 9100 },
  { day: "Wed", revenue: 10500 },
  { day: "Thu", revenue: 9800 },
  { day: "Fri", revenue: 13200 },
  { day: "Sat", revenue: 18500 },
  { day: "Sun", revenue: 16700 },
];

export function Revenue() {
  const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);
  const totalTickets = ticketTypes.reduce((sum, t) => sum + t.sold, 0);
  const totalTicketRevenue = ticketTypes.reduce((sum, t) => sum + t.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          Revenue Analytics
        </h1>
        <p className="text-gray-500">
          Financial performance and revenue streams analysis
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          change="+20.4% from last month"
          changeType="positive"
          icon={DollarSign}
          iconColor="bg-[#1f4f99]"
          valueClassName="text-2xl"
        />
        <StatCard
          title="Avg. Transaction"
          value="$48.50"
          change="+$3.20 increase"
          changeType="positive"
          icon={CreditCard}
          iconColor="bg-[#ff7a3d]"
        />
        <StatCard
          title="Gift Shop Sales"
          value="$7,200"
          change="+10.8% growth"
          changeType="positive"
          icon={ShoppingBag}
          iconColor="bg-[#2fb36f]"
        />
        <StatCard
          title="Revenue Growth"
          value="+20%"
          change="Year over year"
          changeType="positive"
          icon={TrendingUp}
          iconColor="bg-[#1f4f99]"
        />
      </div>

      {/* Revenue Trend */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-semibold text-gray-900">
          Revenue Trend by Source (Last 6 Months)
        </h3>

        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={monthlyRevenue}>
            <defs>
              <linearGradient id="admissionsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1f4f99" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1f4f99" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="membershipsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff7a3d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ff7a3d" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="giftShopFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2fb36f" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2fb36f" stopOpacity={0.08} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
              }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="admissions"
              stackId="1"
              stroke="#1f4f99"
              fill="url(#admissionsFill)"
              name="Admissions"
            />
            <Area
              type="monotone"
              dataKey="memberships"
              stackId="1"
              stroke="#ff7a3d"
              fill="url(#membershipsFill)"
              name="Memberships"
            />
            <Area
              type="monotone"
              dataKey="gift_shop"
              stackId="1"
              stroke="#2fb36f"
              fill="url(#giftShopFill)"
              name="Gift Shop"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Breakdown + Daily Revenue */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-semibold text-gray-900">
            Revenue Breakdown (March)
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                dataKey="value"
              >
                {revenueBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-3">
            {revenueBreakdown.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="text-gray-500">
                  ${item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Revenue */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-semibold text-gray-900">
            Daily Revenue (This Week)
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Bar dataKey="revenue" fill="#ff7a3d" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ticket Sales Analysis */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-semibold text-gray-900">
          Ticket Sales by Type
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="px-4 py-3 text-left font-medium">Ticket Type</th>
                <th className="px-4 py-3 text-right font-medium">Tickets Sold</th>
                <th className="px-4 py-3 text-right font-medium">Revenue</th>
                <th className="px-4 py-3 text-right font-medium">Avg. Price</th>
              </tr>
            </thead>
            <tbody>
              {ticketTypes.map((ticket, index) => (
                <tr
                  key={ticket.type}
                  className={index !== ticketTypes.length - 1 ? "border-b border-gray-100" : ""}
                >
                  <td className="px-4 py-3 text-gray-900">{ticket.type}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {ticket.sold.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#2fb36f]">
                    ${ticket.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    ${(ticket.revenue / ticket.sold).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">Total</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {totalTickets.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#2fb36f]">
                  ${totalTicketRevenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Insights */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <TrendingUp className="h-5 w-5 text-[#1f4f99]" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-gray-900">Best Performing</h3>
              <p className="mb-2 text-sm text-gray-500">
                Saturday generates 28% of weekly revenue
              </p>
              <p className="text-2xl font-semibold text-[#1f4f99]">$18,500</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
              <ShoppingBag className="h-5 w-5 text-[#ff7a3d]" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-gray-900">Gift Shop Growth</h3>
              <p className="mb-2 text-sm text-gray-500">
                Gift shop revenue up 10.8% this month
              </p>
              <p className="text-2xl font-semibold text-[#ff7a3d]">+$700</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <CreditCard className="h-5 w-5 text-[#2fb36f]" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-gray-900">Membership Revenue</h3>
              <p className="mb-2 text-sm text-gray-500">
                21% of total revenue from memberships
              </p>
              <p className="text-2xl font-semibold text-[#2fb36f]">$14,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}