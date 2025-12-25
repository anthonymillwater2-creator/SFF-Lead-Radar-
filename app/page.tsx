import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Users, Settings as SettingsIcon, Database } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get quick stats
  const [totalLeads, outreachReady, dueToday] = await Promise.all([
    prisma.lead.count({
      where: { userId: session.user.id },
    }),
    prisma.lead.count({
      where: {
        userId: session.user.id,
        status: "OUTREACH_READY",
      },
    }),
    prisma.lead.count({
      where: {
        userId: session.user.id,
        nextFollowUpAt: {
          lte: new Date(),
        },
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          SFF Lead Radar
        </h1>
        <p className="text-gray-600">
          Find, qualify, pitch, and track video editing leads
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
            </div>
            <Database className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outreach Ready</p>
              <p className="text-3xl font-bold text-green-600">{outreachReady}</p>
            </div>
            <Users className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due Today</p>
              <p className="text-3xl font-bold text-orange-600">{dueToday}</p>
            </div>
            <SettingsIcon className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/search"
            className="p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition flex items-center gap-3"
          >
            <Search className="w-6 h-6 text-blue-500" />
            <div>
              <div className="font-semibold">Run Search</div>
              <div className="text-sm text-gray-600">Find new leads</div>
            </div>
          </Link>

          <Link
            href="/inbox"
            className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition flex items-center gap-3"
          >
            <Users className="w-6 h-6 text-green-500" />
            <div>
              <div className="font-semibold">Leads Inbox</div>
              <div className="text-sm text-gray-600">Review leads</div>
            </div>
          </Link>

          <Link
            href="/today"
            className="p-4 border-2 border-orange-500 rounded-lg hover:bg-orange-50 transition flex items-center gap-3"
          >
            <SettingsIcon className="w-6 h-6 text-orange-500" />
            <div>
              <div className="font-semibold">Today Queue</div>
              <div className="text-sm text-gray-600">Follow-ups due</div>
            </div>
          </Link>

          <Link
            href="/queries"
            className="p-4 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition flex items-center gap-3"
          >
            <Database className="w-6 h-6 text-purple-500" />
            <div>
              <div className="font-semibold">Query Library</div>
              <div className="text-sm text-gray-600">Manage templates</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <p className="text-gray-600">
          No recent activity yet. Start by running a search or manually importing leads.
        </p>
      </div>
    </div>
  );
}
