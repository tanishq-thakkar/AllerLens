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
    console.log("Selected allergies:", selectedAllergies);
    setUploadStatus("Parsing menu...");
    try {
      const url = `${apiBase}/menus/${menuId}/parse`;
      console.log("Fetching URL:", url);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allergies: selectedAllergies }),
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              AllerLens
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your AI-powered dining safety assistant. Upload a menu, select your allergies, and get instant safety analysis.
            </p>
          </div>

          {/* Allergy Selection Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⚠️</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Select Your Allergies</h2>
                <p className="text-gray-600">Choose all that apply to get personalized safety analysis</p>
              </div>
            </div>
            
            {/* Common Allergies */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {commonAllergies.map((allergy) => (
                <button
                  key={allergy}
                  onClick={() => toggleAllergy(allergy)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    selectedAllergies.includes(allergy)
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 border-red-500 text-white shadow-lg'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  {allergy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Custom Allergy Input */}
            <div className="space-y-3">
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <span className="text-lg">+</span>
                  Add custom allergy
                </button>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter custom allergy..."
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    className="flex-1 px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-black placeholder:text-gray-500"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomAllergy()}
                  />
                  <button
                    onClick={addCustomAllergy}
                    className="px-6 py-3 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomAllergy("");
                    }}
                    className="px-6 py-3 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Selected Allergies Display */}
            {selectedAllergies.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                <p className="text-sm font-semibold text-gray-800 mb-3">Selected Allergies:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAllergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-sm"
                    >
                      {allergy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      <button
                        onClick={() => removeAllergy(allergy)}
                        className="text-white hover:text-red-200 transition-colors text-lg leading-none"
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
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📄</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Upload Menu</h2>
                <p className="text-gray-600">Upload a menu image or PDF for analysis</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 text-sm border-2 border-dashed border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors cursor-pointer hover:border-blue-400"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-500 text-sm">Choose file or drag & drop</span>
                </div>
              </div>
              
              <button
                onClick={handleUpload}
                disabled={!file}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform ${
                  file 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:scale-105 shadow-lg' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {file ? 'Upload Menu' : 'Select a file first'}
              </button>
              
              {uploadStatus && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                  uploadStatus.includes('Error') 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>

          {/* Parse Menu Section */}
          {menuId && !isParsed && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">🔍</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Parse Menu</h2>
                  <p className="text-gray-600">Analyze the menu with AI to detect allergens</p>
                </div>
              </div>
              
              <button
                onClick={handleParse}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 Parse Menu with AI
              </button>
            </div>
          )}

          {/* Q&A Section */}
          {menuId && isParsed && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">💬</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Ask About Menu Safety</h2>
                  <p className="text-gray-600">Get personalized safety analysis for your allergies</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask a question about menu safety..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                  />
                </div>
                
                <button
                  onClick={handleAsk}
                  disabled={!selectedAllergies.length}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform ${
                    selectedAllergies.length 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 shadow-lg' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {selectedAllergies.length ? '🔍 Analyze Safety' : '⚠️ Select allergies first'}
                </button>
                
                {!selectedAllergies.length && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-amber-800 font-medium flex items-center gap-2">
                      <span>⚠️</span>
                      Please select at least one allergy to get safety analysis
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Section */}
          {answer && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  answer.result === 'safe' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  answer.result === 'unsafe' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                  'bg-gradient-to-r from-yellow-500 to-orange-500'
                }`}>
                  <span className="text-white text-lg">
                    {answer.result === 'safe' ? '✅' : answer.result === 'unsafe' ? '⚠️' : '❓'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Safety Analysis Results</h2>
                  <p className="text-gray-600">AI-powered analysis of your menu</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Result Badge */}
                <div className="flex items-center justify-center">
                  <span className={`px-6 py-3 rounded-xl text-lg font-bold ${
                    answer.result === 'safe' ? 'bg-green-100 text-green-800 border-2 border-green-200' :
                    answer.result === 'unsafe' ? 'bg-red-100 text-red-800 border-2 border-red-200' :
                    'bg-yellow-100 text-yellow-800 border-2 border-yellow-200'
                  }`}>
                    {answer.result === 'safe' ? '✅ SAFE TO EAT' : 
                     answer.result === 'unsafe' ? '⚠️ UNSAFE - AVOID' : 
                     '❓ NEEDS REVIEW'}
                  </span>
                </div>
                
                {/* Summary */}
                <div className="p-6 bg-gray-50 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-2">Summary</h3>
                  <p className="text-gray-700 leading-relaxed">{answer.summary}</p>
                </div>
                
                {/* Reasons */}
                {answer.reasons && answer.reasons.length > 0 && (
                  <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                    <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                      <span>⚠️</span>
                      Safety Concerns
                    </h3>
                    <ul className="space-y-2">
                      {answer.reasons.map((reason: string, index: number) => (
                        <li key={index} className="text-red-700 flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Alternatives */}
                {answer.alternatives && answer.alternatives.length > 0 && (
                  <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                    <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                      <span>💡</span>
                      Safe Alternatives
                    </h3>
                    <ul className="space-y-2">
                      {answer.alternatives.map((alternative: string, index: number) => (
                        <li key={index} className="text-green-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{alternative}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
