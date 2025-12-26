"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Copy, Check, Clock, AlertCircle } from "lucide-react";

interface Lead {
  id: string;
  title: string;
  snippet: string;
  sourceHost: string;
  score: number;
  status: string;
  nextFollowUpAt: string;
  lastOutreachAt: string | null;
  painTags: string[];
}

export default function TodayQueuePage() {
  const [dueToday, setDueToday] = useState<Lead[]>([]);
  const [overdue, setOverdue] = useState<Lead[]>([]);
  const [upcoming, setUpcoming] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leads/follow-ups");
      const data = await response.json();

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const weekEnd = new Date(todayEnd);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const leads = data.leads || [];

      setOverdue(
        leads.filter((l: Lead) => new Date(l.nextFollowUpAt) < todayStart)
      );
      setDueToday(
        leads.filter(
          (l: Lead) =>
            new Date(l.nextFollowUpAt) >= todayStart &&
            new Date(l.nextFollowUpAt) < todayEnd
        )
      );
      setUpcoming(
        leads.filter(
          (l: Lead) =>
            new Date(l.nextFollowUpAt) >= todayEnd &&
            new Date(l.nextFollowUpAt) < weekEnd
        )
      );
    } catch (error) {
      console.error("Failed to load follow-ups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyFollowUp = (leadId: string, type: "FU1" | "FU2") => {
    const message =
      type === "FU1"
        ? "Quick ping—still need help with short-form editing? I can send the order link + turnaround options."
        : "Last check—if you're still swamped, we can start as soon as you send the footage/link. Want the order link?";

    navigator.clipboard.writeText(message);
    setCopiedField(`${leadId}-${type}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const markFollowedUp = async (leadId: string) => {
    try {
      await fetch(`/api/leads/${leadId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "FOLLOWUP_SENT" }),
      });
      loadFollowUps();
    } catch (error) {
      console.error("Failed to mark followed up:", error);
    }
  };

  const markReplied = async (leadId: string) => {
    try {
      await fetch(`/api/leads/${leadId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "REPLY_RECEIVED" }),
      });
      loadFollowUps();
    } catch (error) {
      console.error("Failed to mark replied:", error);
    }
  };

  const renderLeadCard = (lead: Lead, category: string) => (
    <div
      key={lead.id}
      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            href={`/leads/${lead.id}`}
            className="text-lg font-semibold text-blue-600 hover:text-blue-800"
          >
            {lead.title}
          </Link>
          <p className="text-sm text-gray-600 mt-1">{lead.sourceHost}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{lead.score}</div>
          <div className="text-xs text-gray-600">Score</div>
        </div>
      </div>

      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{lead.snippet}</p>

      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">
          {category === "overdue" && (
            <span className="text-red-600 font-medium">
              Overdue by{" "}
              {Math.ceil(
                (new Date().getTime() - new Date(lead.nextFollowUpAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{" "}
              days
            </span>
          )}
          {category === "today" && (
            <span className="text-orange-600 font-medium">Due today</span>
          )}
          {category === "upcoming" && (
            <span className="text-blue-600">
              Due {new Date(lead.nextFollowUpAt).toLocaleDateString()}
            </span>
          )}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => copyFollowUp(lead.id, "FU1")}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
        >
          {copiedField === `${lead.id}-FU1` ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          Copy FU1
        </button>
        <button
          onClick={() => copyFollowUp(lead.id, "FU2")}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1"
        >
          {copiedField === `${lead.id}-FU2` ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          Copy FU2
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => markFollowedUp(lead.id)}
          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Mark Followed Up
        </button>
        <button
          onClick={() => markReplied(lead.id)}
          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
        >
          Mark Replied
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Loading follow-ups...</p>
      </div>
    );
  }

  const totalDue = overdue.length + dueToday.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Today Queue</h1>
        <p className="text-gray-600">Follow-ups due and upcoming</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Overdue</p>
              <p className="text-3xl font-bold text-red-900">{overdue.length}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Due Today</p>
              <p className="text-3xl font-bold text-orange-900">{dueToday.length}</p>
            </div>
            <Calendar className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Upcoming (7 days)</p>
              <p className="text-3xl font-bold text-blue-900">{upcoming.length}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-red-900 mb-4">
            Overdue ({overdue.length})
          </h2>
          <div className="space-y-4">
            {overdue.map((lead) => renderLeadCard(lead, "overdue"))}
          </div>
        </div>
      )}

      {/* Due Today */}
      {dueToday.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-orange-900 mb-4">
            Due Today ({dueToday.length})
          </h2>
          <div className="space-y-4">
            {dueToday.map((lead) => renderLeadCard(lead, "today"))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-4">
            {upcoming.map((lead) => renderLeadCard(lead, "upcoming"))}
          </div>
        </div>
      )}

      {totalDue === 0 && upcoming.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No follow-ups scheduled</p>
        </div>
      )}
    </div>
  );
}
