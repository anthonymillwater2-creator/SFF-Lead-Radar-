"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, AlertCircle, CheckCircle, Copy, Check, Upload } from "lucide-react";

interface Query {
  id: string;
  name: string;
  category: string;
  baseQueryText: string;
}

export default function RunSearchPage() {
  const [activeTab, setActiveTab] = useState<"automated" | "manual">("automated");

  // Automated search state
  const [queries, setQueries] = useState<Query[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState("");
  const [sourcePack, setSourcePack] = useState("WIDE_WEB");
  const [market, setMarket] = useState("en-US");
  const [freshness, setFreshness] = useState("Week");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Manual import state
  const [manualQueryId, setManualQueryId] = useState("");
  const [manualSourcePack, setManualSourcePack] = useState("WIDE_WEB");
  const [urlsInput, setUrlsInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  useEffect(() => {
    fetch("/api/queries")
      .then((res) => res.json())
      .then((data) => setQueries(data.queries || []))
      .catch((err) => console.error("Failed to load queries:", err));
  }, []);

  const handleRunSearch = async () => {
    if (!selectedQueryId) {
      setError("Please select a query template");
      return;
    }

    setIsRunning(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/search/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryId: selectedQueryId,
          sourcePack,
          market,
          freshness,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Search failed");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsRunning(false);
    }
  };

  const buildGoldenTemplate = () => {
    if (!manualQueryId) return "";

    const query = queries.find((q) => q.id === manualQueryId);
    if (!query) return "";

    const siteConstraints: Record<string, string> = {
      FORUMS: "(site:reddit.com OR site:quora.com)",
      SOCIAL: "(site:x.com OR site:facebook.com)",
      PROFESSIONAL: "(site:linkedin.com OR site:medium.com)",
      WIDE_WEB: "",
    };

    const siteConstraint = siteConstraints[manualSourcePack] || "";
    const negativeBlock =
      "-site:upwork.com -site:fiverr.com -site:freelancer.com -site:peopleperhour.com";

    return [siteConstraint, query.baseQueryText, negativeBlock]
      .filter(Boolean)
      .join(" ")
      .trim();
  };

  const copyGoldenTemplate = () => {
    const template = buildGoldenTemplate();
    navigator.clipboard.writeText(template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleManualImport = async () => {
    if (!urlsInput.trim()) {
      setError("Please paste at least one URL");
      return;
    }

    setIsImporting(true);
    setError("");
    setImportResult(null);

    try {
      const urls = urlsInput
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      if (urls.length === 0) {
        setError("No valid URLs found");
        return;
      }

      if (urls.length > 50) {
        setError("Maximum 50 URLs allowed per import");
        return;
      }

      const response = await fetch("/api/search/manual-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls,
          queryId: manualQueryId || queries[0]?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Import failed");
      } else {
        setImportResult(data);
        setUrlsInput(""); // Clear on success
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  const selectedQuery = queries.find((q) => q.id === selectedQueryId);
  const goldenTemplate = buildGoldenTemplate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Run Search</h1>
        <p className="text-gray-600">
          Execute automated Bing searches or manually import leads
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab("automated");
              setError("");
              setResult(null);
              setImportResult(null);
            }}
            className={`flex-1 px-6 py-4 font-medium ${
              activeTab === "automated"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Automated Search
          </button>
          <button
            onClick={() => {
              setActiveTab("manual");
              setError("");
              setResult(null);
              setImportResult(null);
            }}
            className={`flex-1 px-6 py-4 font-medium ${
              activeTab === "manual"
                ? "border-b-2 border-purple-500 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Manual Import
          </button>
        </div>
      </div>

      {/* Automated Search Tab */}
      {activeTab === "automated" && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Query Template
              </label>
              <select
                value={selectedQueryId}
                onChange={(e) => setSelectedQueryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              >
                <option value="">Select a query...</option>
                {queries.map((query) => (
                  <option key={query.id} value={query.id}>
                    {query.name} ({query.category})
                  </option>
                ))}
              </select>
              {selectedQuery && (
                <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Query:</strong> {selectedQuery.baseQueryText}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Pack
              </label>
              <select
                value={sourcePack}
                onChange={(e) => setSourcePack(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              >
                <option value="WIDE_WEB">Wide Web (No constraints)</option>
                <option value="FORUMS">Forums (Reddit, Quora)</option>
                <option value="SOCIAL">Social (X, Facebook)</option>
                <option value="PROFESSIONAL">Professional (LinkedIn, Medium)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Market
              </label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              >
                <option value="en-US">United States (en-US)</option>
                <option value="en-CA">Canada (en-CA)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Freshness (Recency)
              </label>
              <select
                value={freshness}
                onChange={(e) => setFreshness(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              >
                <option value="Day">Past Day</option>
                <option value="Week">Past Week</option>
                <option value="Month">Past Month</option>
              </select>
            </div>

            <button
              onClick={handleRunSearch}
              disabled={isRunning || !selectedQueryId}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Search...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Run Search
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Manual Import Tab */}
      {activeTab === "manual" && (
        <div className="space-y-6">
          {/* Golden Template Builder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Golden Template Builder</h2>
            <p className="text-sm text-gray-600 mb-4">
              Build a search query to run manually on Google, Bing, or Reddit
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query Template
                </label>
                <select
                  value={manualQueryId}
                  onChange={(e) => setManualQueryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a query...</option>
                  {queries.map((query) => (
                    <option key={query.id} value={query.id}>
                      {query.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Pack
                </label>
                <select
                  value={manualSourcePack}
                  onChange={(e) => setManualSourcePack(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="WIDE_WEB">Wide Web</option>
                  <option value="FORUMS">Forums</option>
                  <option value="SOCIAL">Social</option>
                  <option value="PROFESSIONAL">Professional</option>
                </select>
              </div>

              {goldenTemplate && (
                <div className="bg-gray-50 border border-gray-300 rounded p-4">
                  <div className="flex items-start justify-between mb-2">
                    <strong className="text-sm text-gray-700">
                      Generated Query:
                    </strong>
                    <button
                      onClick={copyGoldenTemplate}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                    >
                      {copiedTemplate ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-900 font-mono break-words">
                    {goldenTemplate}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-900">
                  <strong>For Google:</strong> After searching, use Tools → Any time →
                  Past week/month to filter by recency
                </p>
              </div>
            </div>
          </div>

          {/* URL Import */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Import URLs</h2>
            <p className="text-sm text-gray-600 mb-4">
              Paste up to 50 URLs (one per line) from your manual search
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URLs (one per line)
                </label>
                <textarea
                  value={urlsInput}
                  onChange={(e) => setUrlsInput(e.target.value)}
                  className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="https://reddit.com/r/videoproduction/post1&#10;https://reddit.com/r/youtubers/post2&#10;..."
                  disabled={isImporting}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {urlsInput.split("\n").filter((u) => u.trim()).length} URLs entered
                </p>
              </div>

              <button
                onClick={handleManualImport}
                disabled={isImporting || !urlsInput.trim()}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Import URLs
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Result Display (Automated) */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Search Completed Successfully
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Results</p>
              <p className="text-2xl font-bold text-gray-900">{result.totalResults}</p>
            </div>
            <div>
              <p className="text-gray-600">Qualified (≥70)</p>
              <p className="text-2xl font-bold text-green-600">
                {result.qualifiedResults}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Review (40-69)</p>
              <p className="text-2xl font-bold text-yellow-600">
                {result.reviewResults}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Rejected (&lt;40)</p>
              <p className="text-2xl font-bold text-red-600">
                {result.rejectedResults}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Duplicates Removed</p>
              <p className="text-2xl font-bold text-gray-600">
                {result.duplicatesRemoved}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-green-200">
            <a
              href="/inbox"
              className="inline-block bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
            >
              View Leads in Inbox →
            </a>
          </div>
        </div>
      )}

      {/* Import Result Display */}
      {importResult && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-purple-900">
                Import Completed Successfully
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Imported New</p>
              <p className="text-2xl font-bold text-purple-900">
                {importResult.imported}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Duplicates Skipped</p>
              <p className="text-2xl font-bold text-gray-600">
                {importResult.duplicates}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-purple-200">
            <a
              href="/inbox"
              className="inline-block bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 font-medium"
            >
              View Imported Leads →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
