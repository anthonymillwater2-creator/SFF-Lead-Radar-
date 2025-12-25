"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Calendar,
  Loader2,
} from "lucide-react";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [offerAngle, setOfferAngle] = useState("ANY");

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [leadRes, settingsRes, templatesRes] = await Promise.all([
        fetch(`/api/leads/${params.id}`),
        fetch("/api/settings"),
        fetch("/api/templates"),
      ]);

      const leadData = await leadRes.json();
      const settingsData = await settingsRes.json();
      const templatesData = await templatesRes.json();

      setLead(leadData.lead);
      setSettings(settingsData.settings);
      setTemplates(templatesData.templates || []);
      setNotes(leadData.lead.notes || "");
      setOfferAngle(leadData.lead.offerAngle || "ANY");
    } catch (error) {
      console.error("Failed to load lead:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generateDM = (type: "DM_1" | "FU_1" | "FU_2") => {
    if (!lead || !settings) return "";

    // Simple template fill (in real app, use lib/templates.ts logic)
    const turnaround = lead.rush12HourEligible ? "12-hour rush" : "48-hour";
    const service = lead.mappedService.replace(/_/g, " ");
    const pain = lead.painTags[0] || "editing";

    const orderLink = buildOrderLink();

    if (type === "DM_1") {
      return `Saw your post about ${pain}. We do US/Canada done-for-you ${service} with ${turnaround} turnaround—want the order link?\n\n${orderLink}`;
    } else if (type === "FU_1") {
      return `Quick ping—still need help with ${service}? I can send the order link + turnaround options.\n\n${orderLink}`;
    } else {
      return `Last check—if you're still swamped, we can start as soon as you send the footage/link. Want the order link?\n\n${orderLink}`;
    }
  };

  const buildOrderLink = () => {
    if (!settings?.orderPageUrl) return "";
    const params = new URLSearchParams({
      utm_source: settings.utmSource || "leadgen_app",
      utm_medium: settings.utmMedium || "outreach",
      utm_campaign: lead?.mappedService || "leadgen",
      utm_content: lead?.id || "",
    });
    return `${settings.orderPageUrl}?${params.toString()}`;
  };

  const markAction = async (eventType: string) => {
    try {
      const dm = eventType.includes("DM") ? generateDM(eventType as any) : "";
      await fetch(`/api/leads/${params.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          messagePreview: dm.substring(0, 120),
        }),
      });
      loadData();
    } catch (error) {
      console.error("Failed to mark action:", error);
    }
  };

  const saveNotes = async () => {
    try {
      await fetch(`/api/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, offerAngle }),
      });
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-red-600">Lead not found</p>
      </div>
    );
  }

  const dm1 = generateDM("DM_1");
  const fu1 = generateDM("FU_1");
  const fu2 = generateDM("FU_2");
  const orderLink = buildOrderLink();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/inbox"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inbox
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lead.title}</h1>
        <div className="flex items-center gap-4">
          <a
            href={lead.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            {lead.sourceHost}
            <ExternalLink className="w-4 h-4" />
          </a>
          <span className="text-2xl font-bold text-gray-900">
            Score: {lead.score}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Snippet */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Post Content</h2>
            <p className="text-gray-700">{lead.snippet}</p>
          </div>

          {/* Outreach Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Outreach</h2>

            {/* Offer Angle Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Angle
              </label>
              <select
                value={offerAngle}
                onChange={(e) => setOfferAngle(e.target.value)}
                onBlur={saveNotes}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="ANY">General</option>
                <option value="FIXED_PRICE">Fixed Price</option>
                <option value="SPEED_48H">48-Hour Speed</option>
                <option value="LOCAL_US_CA">US/Canada Local</option>
                <option value="RUSH_12H">Rush 12-Hour</option>
              </select>
            </div>

            {/* DM Templates */}
            <div className="space-y-4">
              {/* DM #1 */}
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-blue-900">Initial DM</strong>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(dm1, "dm1")}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                    >
                      {copiedField === "dm1" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy
                    </button>
                    <button
                      onClick={() => markAction("DM_1_SENT")}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Mark Sent
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{dm1}</p>
              </div>

              {/* Follow-up #1 */}
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-green-900">Follow-up #1 (48h)</strong>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(fu1, "fu1")}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                      {copiedField === "fu1" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy
                    </button>
                    <button
                      onClick={() => markAction("FU_1_SENT")}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Mark Sent
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{fu1}</p>
              </div>

              {/* Follow-up #2 */}
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-green-900">Follow-up #2 (96h)</strong>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(fu2, "fu2")}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                      {copiedField === "fu2" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy
                    </button>
                    <button
                      onClick={() => markAction("FU_2_SENT")}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Mark Sent
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{fu2}</p>
              </div>

              {/* Order Link */}
              <div className="bg-purple-50 border border-purple-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-purple-900">UTM Tracking Link</strong>
                  <button
                    onClick={() => copyToClipboard(orderLink, "link")}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center gap-1"
                  >
                    {copiedField === "link" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy Link
                  </button>
                </div>
                <p className="text-xs text-gray-600 break-all">{orderLink}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Add notes about this lead..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lead Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Lead Info</h2>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-700">Status:</strong>
                <p className="text-gray-900">{lead.status}</p>
              </div>
              <div>
                <strong className="text-gray-700">Buyer Type:</strong>
                <p className="text-gray-900">{lead.buyerType}</p>
              </div>
              <div>
                <strong className="text-gray-700">Service:</strong>
                <p className="text-gray-900">{lead.mappedService}</p>
              </div>
              <div>
                <strong className="text-gray-700">Pain Tags:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {lead.painTags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <strong className="text-gray-700">Rush Eligible:</strong>
                <p className="text-gray-900">
                  {lead.rush12HourEligible ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <strong className="text-gray-700">First Seen:</strong>
                <p className="text-gray-900">
                  {new Date(lead.firstSeenAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => markAction("REPLY_RECEIVED")}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Mark Replied
              </button>
              <button
                onClick={() => markAction("BOOKED")}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                Mark Booked
              </button>
              <button
                onClick={() => markAction("WON")}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
              >
                Mark Won
              </button>
              <button
                onClick={() => markAction("LOST")}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                Mark Lost
              </button>
            </div>
          </div>

          {/* Events Log */}
          {lead.leadEvents && lead.leadEvents.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Activity</h2>
              <div className="space-y-2 text-sm">
                {lead.leadEvents.map((event: any) => (
                  <div key={event.id} className="border-l-2 border-blue-500 pl-3">
                    <p className="font-medium">{event.eventType}</p>
                    <p className="text-gray-600 text-xs">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
