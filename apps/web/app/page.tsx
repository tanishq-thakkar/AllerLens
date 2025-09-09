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
      setUploadStatus(`Error uploading file: ${error.message}`);
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
      setUploadStatus(`Error parsing menu: ${error.message}`);
    }
  }

  async function handleAsk() {
    if (!menuId || !question || !isParsed) return;
    const body = {
      menu_id: menuId,
      question,
      profile: { allergens: ["peanut"], diets: [], sodium_limit: 600 },
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
        summary: `Error: ${error.message}`, 
        reasons: [], 
        alternatives: [] 
      });
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="max-w-xl w-full space-y-6">
        <h1 className="text-3xl font-semibold">AllerLens — MVP</h1>
        <p className="text-sm text-gray-600">Upload a menu, then ask a question.</p>

        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={handleUpload}
          className="rounded bg-blue-600 text-white px-4 py-2"
        >
          Upload
        </button>
        {uploadStatus && <div className="text-sm">{uploadStatus}</div>}

        {menuId && !isParsed && (
          <button
            onClick={handleParse}
            className="rounded bg-orange-600 text-white px-4 py-2"
          >
            Parse Menu
          </button>
        )}

        {menuId && isParsed && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded border px-2 py-1"
            />
            <button
              onClick={handleAsk}
              className="rounded bg-green-600 text-white px-4 py-2"
            >
              Ask
            </button>
          </div>
        )}

        {answer && (
          <div className="rounded border p-4 text-sm space-y-2">
            <div><b>Result:</b> {answer.result}</div>
            <div><b>Summary:</b> {answer.summary}</div>
            <div><b>Reasons:</b> {answer.reasons?.join(", ") || "None provided"}</div>
            <div><b>Alternatives:</b> {answer.alternatives?.join(", ") || "None provided"}</div>
          </div>
        )}
      </div>
    </main>
  );
}
