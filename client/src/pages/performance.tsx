import { useQuery } from "@tanstack/react-query";
import type { PerformanceReview, Employee } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Award, TrendingUp, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PerformancePage() {
  const { data: reviews = [], isLoading } = useQuery<PerformanceReview[]>({
    queryKey: ["/api/performance"],
  });
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const avgScore = reviews.length > 0 ? Math.round(reviews.reduce((s, r) => s + (r.totalScore || 0), 0) / reviews.length) : 0;
  const topPerformers = reviews.filter(r => (r.totalScore || 0) >= 85).length;

  const chartData = reviews.map(r => {
    const emp = employees.find(e => e.id === r.employeeId);
    return {
      name: emp?.fullName?.split(' ').slice(0, 2).join(' ') || "—",
      skor: r.totalScore || 0,
    };
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Penilaian Kinerja</h1>
        <p className="text-sm text-muted-foreground mt-1">Evaluasi dan monitoring kinerja pegawai</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-sky-600/10"><BarChart3 className="w-5 h-5 text-sky-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Rata-rata Skor</p><p className="text-xl font-bold">{avgScore}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-600/10"><Award className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Top Performer</p><p className="text-xl font-bold">{topPerformers}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10"><Target className="w-5 h-5 text-purple-500" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Total Review</p><p className="text-xl font-bold">{reviews.length}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Perbandingan Skor Kinerja</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="skor" fill="#0284c7" name="Skor Total" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {reviews.map((r) => {
          const emp = employees.find(e => e.id === r.employeeId);
          return (
            <Card key={r.id} data-testid={`perf-card-${r.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{emp?.fullName?.charAt(0) || "?"}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{emp?.fullName || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.period} · {r.reviewType}</p>
                      <p className="text-xs text-muted-foreground">Reviewer: {r.reviewerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{r.totalScore}</p>
                    <Badge className="mt-1">{r.grade}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[
                    { label: "Disiplin", value: r.discipline || 0 },
                    { label: "Kehadiran", value: r.attendance || 0 },
                    { label: "Produktivitas", value: r.productivity || 0 },
                    { label: "Teamwork", value: r.teamwork || 0 },
                    { label: "Inisiatif", value: r.initiative || 0 },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-medium">{value}</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {reviews.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Belum ada data penilaian kinerja</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
