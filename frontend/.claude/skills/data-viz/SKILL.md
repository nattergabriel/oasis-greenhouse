---
name: data-viz
description: Data visualization patterns using Recharts, Chart.js, D3.js, and pure CSS charts. Use when building charts, graphs, dashboards, stat cards, progress bars, or any data visualization. Also use when formatting numbers, currencies, dates, or percentages for display.
---

# Data Visualization Quick Reference

## Recharts (React Charts)

### Installation
```bash
npm install recharts
```

### Basic Imports
```jsx
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
```

### Line Chart
```jsx
const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
];

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line
      type="monotone"
      dataKey="value"
      stroke="#8884d8"
      strokeWidth={2}
      dot={{ r: 4 }}
      activeDot={{ r: 6 }}
    />
  </LineChart>
</ResponsiveContainer>
```

### Bar Chart
```jsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Area Chart (Gradient)
```jsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Area
      type="monotone"
      dataKey="value"
      stroke="#8884d8"
      fillOpacity={1}
      fill="url(#colorValue)"
    />
  </AreaChart>
</ResponsiveContainer>
```

### Pie / Donut Chart
```jsx
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={data}
      cx="50%"
      cy="50%"
      innerRadius={60}
      outerRadius={100}
      paddingAngle={5}
      dataKey="value"
      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

### Custom Tooltip
```jsx
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

<Tooltip content={<CustomTooltip />} />
```

---

## Simple CSS Charts (No Library)

### Progress Bar
```jsx
function ProgressBar({ value, max = 100, color = "blue" }) {
  const percentage = (value / max) * 100;

  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full bg-${color}-500 transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

### Circular Progress
```jsx
function CircularProgress({ value, size = 100, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-600 transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
      </div>
    </div>
  );
}
```

---

## Dashboard Stat Cards

```jsx
function StatCard({ title, value, change, icon: Icon }) {
  const isPositive = change > 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">{title}</span>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold">{value}</span>
        {change !== undefined && (
          <span className={`ml-2 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '\u2191' : '\u2193'} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard title="Total Revenue" value="$45,231" change={12.5} />
  <StatCard title="Users" value="2,350" change={-3.2} />
  <StatCard title="Orders" value="1,234" change={8.1} />
  <StatCard title="Conversion" value="3.2%" change={0.5} />
</div>
```

---

## Data Formatting Utilities

```jsx
// Number formatting
const formatNumber = (n) => n.toLocaleString();
// 1234567 -> "1,234,567"

// Currency
const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
// 1234.5 -> "$1,234.50"

// Compact notation
const formatCompact = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);
// 1234567 -> "1.2M"

// Percentage
const formatPercent = (n) =>
  new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(n);
// 0.1234 -> "12.3%"

// Date formatting
const formatDate = (date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
// "Jan 15"
```

---

## Color Palettes for Charts

```jsx
// Categorical (distinct groups)
const categorical = [
  '#4e79a7', '#f28e2c', '#e15759', '#76b7b2',
  '#59a14f', '#edc949', '#af7aa1', '#ff9da7'
];

// Sequential (low to high)
const blues = ['#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'];

// Diverging (negative to positive)
const diverging = ['#d73027', '#fc8d59', '#fee090', '#e0f3f8', '#91bfdb', '#4575b4'];

// Accessible (colorblind-friendly)
const accessible = ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'];
```

For Chart.js setup, D3.js basics, stacked/horizontal bar charts, and multi-line charts, see [reference.md](reference.md).
