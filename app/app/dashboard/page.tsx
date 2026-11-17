// ─── Protected page example ──────────────────────────────────────
// This page uses requireAuth() to check the NextAuth session on the
// server side. If the user is not logged in, they are redirected to
// the login page. The session contains the Keycloak access_token and
// roles extracted from resource_access[KEYCLOAK_CLIENT_ID].roles.
//
// To protect any server component page:
//   import { requireAuth, requireRole } from "@/lib/require-auth";
//   const session = await requireAuth();          // redirects if not logged in
//   const session = await requireRole("admin");   // redirects to /unauthorized if role missing
import { requireAuth } from "@/lib/require-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, Activity } from "lucide-react";

const stats = [
  {
    title: "Total Users",
    value: "12,847",
    change: "+12.5%",
    icon: Users
  },
  {
    title: "Revenue",
    value: "$48,392",
    change: "+8.2%",
    icon: DollarSign
  },
  {
    title: "Active Sessions",
    value: "3,294",
    change: "+24.1%",
    icon: Activity
  },
  {
    title: "Conversion Rate",
    value: "4.6%",
    change: "+1.8%",
    icon: TrendingUp
  }
];

export default async function DashboardPage() {
  // requireAuth() calls getServerSession(authOptions).
  // If no session → redirects to Keycloak sign-in.
  // If session exists → returns the session with accessToken, roles, and user info.
  const session = await requireAuth();

  // session.user  → { id, name, email, role, roles, ... }
  // session.roles → ["admin", "user", ...]  (from Keycloak resource_access[clientId].roles)
  // session.accessToken → Keycloak access token (send as Bearer to backend)
  return (
    <div className="space-y-6">
      {/* ─── Logged-in user info (from Keycloak session) ─── */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Session Info</CardTitle>
          <CardDescription>Authenticated via Keycloak SSO</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Name:</span>
            <span>{session.user?.name ?? "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Email:</span>
            <span>{session.user?.email ?? "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Roles:</span>
            <div className="flex flex-wrap gap-1">
              {session.roles?.length ? (
                session.roles.map((role) => (
                  <Badge
                    key={role}
                    variant="secondary"
                    className="bg-primary-50 text-primary-700"
                  >
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No roles assigned</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card> */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, here&apos;s what&apos;s happening today.
          </p>
        </div>
        <Button>New Report</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 pt-1">
                <Badge
                  variant="secondary"
                  className="bg-primary-50 text-primary-700"
                >
                  {stat.change}
                </Badge>
                <span className="text-xs text-gray-500">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events across your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                user: "Sarah Chen",
                action: "created a new project",
                time: "2m ago"
              },
              {
                user: "Mike Johnson",
                action: "updated analytics report",
                time: "15m ago"
              },
              {
                user: "Emily Davis",
                action: "invited 3 new members",
                time: "1h ago"
              },
              {
                user: "Alex Kim",
                action: "published a new page",
                time: "3h ago"
              }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-100" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{item.user}</span>{" "}
                    <span className="text-gray-500">{item.action}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start">
              Create Project
            </Button>
            <Button variant="outline" className="justify-start">
              Invite Users
            </Button>
            <Button variant="outline" className="justify-start">
              View Reports
            </Button>
            <Button variant="outline" className="justify-start">
              Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
