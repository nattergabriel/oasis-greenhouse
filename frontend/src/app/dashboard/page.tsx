import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium tracking-tight">
            Mars Greenhouse Command Center
          </h1>
          <Badge variant="outline" className="font-mono text-xs tabular-nums">
            SOL 142 / 450
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "GREENHOUSE", value: "2 active", status: "healthy" },
            { label: "WATER RESERVE", value: "73%", status: "healthy" },
            { label: "NUTRIENT RESERVE", value: "58%", status: "warning" },
            { label: "ENERGY RESERVE", value: "84%", status: "healthy" },
            { label: "ACTIVE ALERTS", value: "3", status: "critical" },
            { label: "AGENT ACTIONS", value: "12 today", status: "healthy" },
          ].map((item) => (
            <Card key={item.label} className="p-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      item.status === "healthy"
                        ? "var(--color-status-healthy)"
                        : item.status === "warning"
                          ? "var(--color-status-warning)"
                          : "var(--color-status-critical)",
                  }}
                />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl tabular-nums">
                {item.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              SENSOR SNAPSHOT
            </span>
            <div className="mt-3 space-y-2">
              {[
                { label: "Temperature", value: "24.2°C", status: "normal" },
                { label: "Humidity", value: "68% RH", status: "normal" },
                { label: "CO2", value: "1,050 ppm", status: "normal" },
                { label: "PAR", value: "420 µmol/m²/s", status: "normal" },
                { label: "pH", value: "6.1", status: "normal" },
                { label: "EC", value: "2.1 mS/cm", status: "warning" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-mono tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              MARS WEATHER
            </span>
            <div className="mt-3 space-y-2">
              {[
                { label: "External Temp", value: "-63°C" },
                { label: "Solar Irradiance", value: "590 W/m²" },
                { label: "Dust Storm Index", value: "2.1 / 10" },
                { label: "Pressure", value: "650 Pa" },
              ].map((w) => (
                <div key={w.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{w.label}</span>
                  <span className="font-mono tabular-nums">{w.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
