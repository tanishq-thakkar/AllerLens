"use client";
import { useState } from "react";

export default function Page() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const [file, setFile] = useState<File | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [isParsed, setIsParsed] = useState<boolean>(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<any>(null);

  // Allergy selection state
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const commonAllergies = [
    "peanut",
    "tree_nut",
    "shellfish",
    "fish",
    "egg",
    "dairy",
    "gluten",
    "soy",
    "sesame"
  ];

  async function handleUpload() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${apiBase}/menus/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setMenuId(data.menu_id);
      setUploadStatus(`Uploaded menu_id: ${data.menu_id}`);
      setIsParsed(false);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function handleParse() {
    if (!menuId) return;
    console.log("Parsing menu with ID:", menuId);
    console.log("API Base URL:", apiBase);
    setUploadStatus("Parsing menu...");
    try {
      const url = `${apiBase}/menus/${menuId}/parse`;
      console.log("Fetching URL:", url);
      const res = await fetch(url, {
        method: "POST",
      });
      console.log("Response status:", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      console.log("Parse response:", data);
      setIsParsed(true);
      setUploadStatus(`Menu parsed successfully! ${data.pages} page(s) processed.`);
    } catch (error) {
      console.error("Parse error:", error);
      setUploadStatus(`Error parsing menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Allergy selection handlers
  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies(prev => [...prev, customAllergy.trim()]);
      setCustomAllergy("");
      setShowCustomInput(false);
    }
  };

  const removeAllergy = (allergy: string) => {
    setSelectedAllergies(prev => prev.filter(a => a !== allergy));
  };

  async function handleAsk() {
    if (!menuId || !question || !isParsed) return;
    const body = {
      menu_id: menuId,
      question,
      profile: { allergens: selectedAllergies, diets: [], sodium_limit: 600 },
    };
    try {
      const res = await fetch(`${apiBase}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setAnswer(data);
    } catch (error) {
      console.error("Ask error:", error);
      setAnswer({ 
        result: "error", 
        summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        reasons: [], 
        alternatives: [] 
      });
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-semibold">AllerLens — MVP</h1>
        <p className="text-sm text-gray-600">Upload a menu, select your allergies, then ask a question.</p>

        {/* Allergy Selection Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-medium">Select Your Allergies</h2>
          
          {/* Common Allergies */}
          <div className="grid grid-cols-3 gap-2">
            {commonAllergies.map((allergy) => (
              <button
                key={allergy}
                onClick={() => toggleAllergy(allergy)}
                className={`px-3 py-2 text-sm rounded border transition-colors ${
                  selectedAllergies.includes(allergy)
                    ? 'bg-red-100 border-red-300 text-red-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {allergy.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Custom Allergy Input */}
          <div className="space-y-2">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                + Add custom allergy
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter custom allergy..."
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border rounded"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomAllergy()}
                />
                <button
                  onClick={addCustomAllergy}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomAllergy("");
                  }}
                  className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Selected Allergies Display */}
          {selectedAllergies.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Selected Allergies:</p>
              <div className="flex flex-wrap gap-2">
                {selectedAllergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full"
                  >
                    {allergy.replace('_', ' ')}
                    <button
                      onClick={() => removeAllergy(allergy)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Upload Menu</h2>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />
          <button
            onClick={handleUpload}
            className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            Upload
          </button>
          {uploadStatus && <div className="text-sm text-gray-600">{uploadStatus}</div>}
        </div>

        {/* Parse Menu Section */}
        {menuId && !isParsed && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Parse Menu</h2>
            <button
              onClick={handleParse}
              className="rounded bg-orange-600 text-white px-4 py-2 hover:bg-orange-700"
            >
              Parse Menu
            </button>
          </div>
        )}

        {/* Q&A Section */}
        {menuId && isParsed && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Ask About Menu Safety</h2>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Ask a question about menu safety..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded border px-3 py-2"
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              />
              <button
                onClick={handleAsk}
                disabled={!selectedAllergies.length}
                className={`rounded px-4 py-2 ${
                  selectedAllergies.length 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {selectedAllergies.length ? 'Ask Question' : 'Select allergies first'}
              </button>
              {!selectedAllergies.length && (
                <p className="text-sm text-amber-600">
                  ⚠️ Please select at least one allergy to get safety analysis
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {answer && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Safety Analysis Results</h2>
            <div className="rounded border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Result:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  answer.result === 'safe' ? 'bg-green-100 text-green-800' :
                  answer.result === 'unsafe' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {answer.result?.toUpperCase()}
                </span>
              </div>
              
              <div>
                <span className="font-medium">Summary:</span>
                <p className="mt-1 text-gray-700">{answer.summary}</p>
              </div>
              
              {answer.reasons && answer.reasons.length > 0 && (
                <div>
                  <span className="font-medium">Reasons:</span>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {answer.reasons.map((reason: string, index: number) => (
                      <li key={index} className="text-gray-700">{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {answer.alternatives && answer.alternatives.length > 0 && (
                <div>
                  <span className="font-medium">Alternatives:</span>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {answer.alternatives.map((alternative: string, index: number) => (
                      <li key={index} className="text-gray-700">{alternative}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
