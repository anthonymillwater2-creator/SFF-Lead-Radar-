"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Inbox as InboxIcon, ExternalLink, CheckCircle, X, Download } from "lucide-react";

interface Lead {
  id: string;
  title: string;
  snippet: string;
  originalUrl: string;
  sourceHost: string;
  score: number;
  status: string;
  buyerType: string;
  painTags: string[];
  mappedService: string;
  firstSeenAt: string;
}

const STATUS_TABS = [
  { key: "OUTREACH_READY", label: "Outreach Ready", color: "green" },
  { key: "REVIEW", label: "Review", color: "yellow" },
  { key: "CONTACTED", label: "Contacted", color: "blue" },
  { key: "REPLIED", label: "Replied", color: "purple" },
  { key: "BOOKED", label: "Booked", color: "indigo" },
  { key: "REJECTED", label: "Rejected", color: "red" },
  { key: "WON", label: "Won", color: "emerald" },
  { key: "LOST", label: "Lost", color: "gray" },
];

export default function InboxPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState("OUTREACH_READY");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("score");

  useEffect(() => {
    loadLeads();
  }, [activeTab, sortBy]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/leads?status=${activeTab}&sortBy=${sortBy}&sortOrder=desc`
      );
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error("Failed to load leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleBulkAction = async (newStatus: string) => {
    if (selectedLeads.size === 0) return;

    try {
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          status: newStatus,
        }),
      });
      setSelectedLeads(new Set());
      loadLeads();
    } catch (error) {
      console.error("Bulk action failed:", error);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Title",
      "URL",
      "Source",
      "Score",
      "Status",
      "Buyer Type",
      "Service",
      "Pain Tags",
      "First Seen",
    ];

    const rows = leads.map((lead) => [
      lead.title,
      lead.originalUrl,
      lead.sourceHost,
      lead.score,
      lead.status,
      lead.buyerType,
      lead.mappedService,
      lead.painTags.join("; "),
      lead.firstSeenAt,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads Inbox</h1>
          <p className="text-gray-600">Review and manage your leads</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
        <div className="flex border-b border-gray-200">
          {STATUS_TABS.map((tab) => {
            const count = leads.length; // In real app, fetch counts separately
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedLeads(new Set());
                }}
                className={`px-6 py-4 font-medium whitespace-nowrap ${
                  activeTab === tab.key
                    ? `border-b-2 border-${tab.color}-500 text-${tab.color}-600`
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="ml-2 text-sm">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLeads.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="font-medium text-blue-900">
            {selectedLeads.size} lead(s) selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("CONTACTED")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Mark Contacted
            </button>
            <button
              onClick={() => handleBulkAction("REJECTED")}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Reject
            </button>
            <button
              onClick={() => setSelectedLeads(new Set())}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="score">Score (High to Low)</option>
          <option value="newest">Newest First</option>
          <option value="updated">Recently Updated</option>
        </select>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-600">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <InboxIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No leads in this status</p>
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedLeads.has(lead.id)}
                  onChange={() => handleSelectLead(lead.id)}
                  className="mt-1 w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {lead.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{lead.sourceHost}</span>
                        <a
                          href={lead.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {lead.score}
                      </div>
                      <div className="text-xs text-gray-600">Score</div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 line-clamp-2">{lead.snippet}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {lead.buyerType}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {lead.mappedService}
                    </span>
                    {lead.painTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
