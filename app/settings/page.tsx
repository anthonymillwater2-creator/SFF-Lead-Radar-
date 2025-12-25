"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    orderPageUrl: "",
    utmSource: "leadgen_app",
    utmMedium: "outreach",
    maxResultsPerRun: 50,
    queryMaxRunsPerDay: 5,
    globalCooldownMinutes: 2,
    jobBoardBlocklist: [] as string[],
    fu1DelayHours: 48,
    fu2DelayHours: 96,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [blocklistInput, setBlocklistInput] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          setBlocklistInput(data.settings.jobBoardBlocklist.join(", "));
        }
      })
      .catch((err) => console.error("Failed to load settings:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const blocklistArray = blocklistInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          jobBoardBlocklist: blocklistArray,
        }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Configure your order page, UTM parameters, rate limits, and blocklists
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-6">
        {/* Order Page URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Page URL
          </label>
          <input
            type="url"
            value={settings.orderPageUrl}
            onChange={(e) =>
              setSettings({ ...settings, orderPageUrl: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="https://yourdomain.com/order"
          />
          <p className="mt-1 text-sm text-gray-500">
            Your money page URL (will have UTM parameters appended)
          </p>
        </div>

        {/* UTM Defaults */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UTM Source
            </label>
            <input
              type="text"
              value={settings.utmSource}
              onChange={(e) =>
                setSettings({ ...settings, utmSource: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UTM Medium
            </label>
            <input
              type="text"
              value={settings.utmMedium}
              onChange={(e) =>
                setSettings({ ...settings, utmMedium: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Rate Limits */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Rate Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Results Per Run
              </label>
              <input
                type="number"
                value={settings.maxResultsPerRun}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxResultsPerRun: parseInt(e.target.value),
                  })
                }
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Query Max Runs Per Day
              </label>
              <input
                type="number"
                value={settings.queryMaxRunsPerDay}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    queryMaxRunsPerDay: parseInt(e.target.value),
                  })
                }
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Global Cooldown (minutes)
              </label>
              <input
                type="number"
                value={settings.globalCooldownMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    globalCooldownMinutes: parseInt(e.target.value),
                  })
                }
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Follow-up Timing */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Follow-up Timing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FU1 Delay (hours)
              </label>
              <input
                type="number"
                value={settings.fu1DelayHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    fu1DelayHours: parseInt(e.target.value),
                  })
                }
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FU2 Delay (hours)
              </label>
              <input
                type="number"
                value={settings.fu2DelayHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    fu2DelayHours: parseInt(e.target.value),
                  })
                }
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Job Board Blocklist */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Job Board Blocklist (comma-separated)
          </label>
          <input
            type="text"
            value={blocklistInput}
            onChange={(e) => setBlocklistInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="indeed.com, glassdoor.com, linkedin.com/jobs"
          />
          <p className="mt-1 text-sm text-gray-500">
            Default blocklist (upwork, fiverr, freelancer, peopleperhour) is always included
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved Successfully!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
