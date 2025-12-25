"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface Query {
  id: string;
  name: string;
  category: string;
  baseQueryText: string;
}

export default function RunSearchPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState("");
  const [sourcePack, setSourcePack] = useState("WIDE_WEB");
  const [market, setMarket] = useState("en-US");
  const [freshness, setFreshness] = useState("Week");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

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

  const selectedQuery = queries.find((q) => q.id === selectedQueryId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Run Search</h1>
        <p className="text-gray-600">Execute a manual Bing search for new leads</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-6">
          {/* Query Template Selection */}
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

          {/* Source Pack */}
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

          {/* Market */}
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

          {/* Freshness */}
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

          {/* Run Button */}
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

      {/* Result Display */}
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
              <p className="text-2xl font-bold text-gray-900">
                {result.totalResults}
              </p>
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
    </div>
  );
}
