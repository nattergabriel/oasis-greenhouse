---
name: data-viz
description: Data visualization patterns using Recharts and pure CSS charts. Use when building charts, graphs, dashboards, stat cards, progress bars, or any data visualization. Also use when formatting numbers, dates, percentages, or mission-specific values for display.
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
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
    <YAxis stroke="hsl(var(--muted-foreground))" />
    <Tooltip />
    <Legend />
    <Line
      type="monotone"
      dataKey="value"
      stroke="hsl(var(--color-mars-amber))"
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
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
    <YAxis stroke="hsl(var(--muted-foreground))" />
    <Tooltip />
    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Area Chart (Gradient)
```jsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="hsl(var(--color-mars-amber))" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="hsl(var(--color-mars-amber))" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
    <YAxis stroke="hsl(var(--muted-foreground))" />
    <Tooltip />
    <Area
      type="monotone"
      dataKey="value"
      stroke="hsl(var(--color-mars-amber))"
      fillOpacity={1}
      fill="url(#colorValue)"
    />
  </AreaChart>
</ResponsiveContainer>
```

### Pie / Donut Chart
```jsx
const COLORS = [
  'hsl(var(--color-mars-amber))',
  'hsl(var(--color-mars-green))',
  'hsl(var(--color-mars-blue))',
  'hsl(var(--color-mars-yellow))',
  'hsl(var(--color-mars-purple))'
];

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
      <div className="bg-mars-surface p-3 rounded-lg shadow-lg border border-mars-border">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-foreground" style={{ color: entry.color }}>
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

### Sparkline
```jsx
// Compact inline chart for dashboard widgets
function Sparkline({ data, color = "hsl(var(--color-mars-amber))", height = 40 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Usage
<Sparkline data={[{ value: 10 }, { value: 20 }, { value: 15 }]} />
```

---

## Simple CSS Charts (No Library)

### Progress Bar
```jsx
function ProgressBar({ value, max = 100, status = "healthy" }) {
  const percentage = (value / max) * 100;

  const statusColors = {
    healthy: "bg-status-healthy",
    warning: "bg-status-warning",
    critical: "bg-status-critical"
  };

  return (
    <div className="w-full h-3 bg-mars-elevated rounded-full overflow-hidden">
      <div
        className={`h-full ${statusColors[status]} transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

### Circular Progress
```jsx
function CircularProgress({ value, size = 100, strokeWidth = 8, status = "healthy" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const statusColors = {
    healthy: "text-status-healthy",
    warning: "text-status-warning",
    critical: "text-status-critical"
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-mars-elevated"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${statusColors[status]} transition-all duration-500`}
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
        <span className="text-2xl font-bold text-foreground">{value}%</span>
      </div>
    </div>
  );
}
```

### Gauge Component
```jsx
// Semi-circle gauge for sensor readings
function Gauge({ value, min = 0, max = 100, label, unit, status = "healthy" }) {
  const percentage = ((value - min) / (max - min)) * 100;
  const angle = (percentage / 100) * 180;

  const statusColors = {
    healthy: "#5a9a6b",
    warning: "#c4a344",
    critical: "#c75a3a"
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        {/* Background arc */}
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="hsl(var(--mars-elevated))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={statusColors[status]}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 157} 157`}
        />
        {/* Needle */}
        <line
          x1="60"
          y1="60"
          x2={60 + 40 * Math.cos((angle - 180) * Math.PI / 180)}
          y2={60 + 40 * Math.sin((angle - 180) * Math.PI / 180)}
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
        />
        <circle cx="60" cy="60" r="4" fill="hsl(var(--foreground))" />
      </svg>
      <div className="text-center mt-2">
        <div className="text-2xl font-bold text-foreground">{value}{unit}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// Usage
<Gauge value={22} min={-50} max={50} label="Temperature" unit="°C" status="healthy" />
```

---

## Dashboard Stat Cards

```jsx
function StatCard({ title, value, change, icon: Icon, status }) {
  const isPositive = change > 0;

  const statusColors = {
    healthy: "text-status-healthy",
    warning: "text-status-warning",
    critical: "text-status-critical"
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">{title}</span>
        {Icon && <Icon className={`w-5 h-5 ${status ? statusColors[status] : 'text-muted-foreground'}`} />}
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {change !== undefined && (
          <span className={`ml-2 text-sm ${isPositive ? 'text-status-healthy' : 'text-status-critical'}`}>
            {isPositive ? '\u2191' : '\u2193'} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard title="Oxygen Level" value="95%" change={2.1} status="healthy" />
  <StatCard title="Water Reserve" value="450L" change={-5.2} status="warning" />
  <StatCard title="Crop Yield" value="12kg" change={8.1} status="healthy" />
  <StatCard title="Power Output" value="3.2kW" change={0.5} status="healthy" />
</div>
```

---

## Mars Color Palette

```jsx
// CSS Variables (already defined in globals.css)
const marsColors = {
  amber: '#d4924a',      // Primary accent
  red: '#c75a3a',        // Critical status
  green: '#5a9a6b',      // Healthy status
  yellow: '#c4a344',     // Warning status
  blue: '#4a7c9e',       // Water/info
  purple: '#7c6aad'      // Agent/AI actions
};

// Chart colors (--chart-1 through --chart-5)
const chartColors = [
  'hsl(var(--chart-1))',  // Mars amber
  'hsl(var(--chart-2))',  // Mars green
  'hsl(var(--chart-3))',  // Mars blue
  'hsl(var(--chart-4))',  // Mars yellow
  'hsl(var(--chart-5))'   // Mars purple
];

// Background colors
const backgrounds = {
  base: '#0f0e0d',        // --mars-base
  surface: '#1a1917',     // --mars-surface / --card
  elevated: '#252320',    // --mars-elevated
  border: '#2e2b27'       // --mars-border
};

// Text colors
const textColors = {
  primary: '#e8e2d9',     // --foreground
  secondary: '#9c9488'    // --muted-foreground
};
```

---

## Data Formatting Utilities

```jsx
// Mission Day (SOL)
const formatMissionDay = (day) => `SOL ${day}`;
// 142 -> "SOL 142"

// Weight (kilograms)
const formatKg = (value) => `${value.toFixed(1)}kg`;
// 12.345 -> "12.3kg"

// Percentage
const formatPercent = (n, decimals = 1) =>
  `${(n * 100).toFixed(decimals)}%`;
// 0.1234 -> "12.3%"

// Temperature (Celsius)
const formatTemperature = (temp) => `${temp.toFixed(1)}°C`;
// 22.567 -> "22.6°C"

// Number formatting
const formatNumber = (n) => n.toLocaleString();
// 1234567 -> "1,234,567"

// Compact notation
const formatCompact = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);
// 1234567 -> "1.2M"

// Date formatting
const formatDate = (date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
// "Jan 15"
```

---

For multi-line charts, stacked bar charts, and advanced Recharts patterns, see [reference.md](reference.md).
