"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function SyllabusWidget() {
  const [text, setText] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleParse() {
    if (!text) return
    setLoading(true)
    setResult("")
    try {
      const res = await fetch("/api/syllabus/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabusText: text }),
      })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setResult(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <textarea className="h-40 w-full rounded-md border px-3 py-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your syllabus section..." />
      <Button type="button" onClick={handleParse} disabled={loading}>
        {loading ? "Parsing..." : "Extract graded items"}
      </Button>
      {result && <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{result}</pre>}
    </div>
  )
}