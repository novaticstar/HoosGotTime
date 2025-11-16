"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Props = {
  defaultDueDate: string
}

export function NLTaskWidget({ defaultDueDate }: Props) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [save, setSave] = useState(true)
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!text) return
    setLoading(true)
    setResult("")
    try {
      const res = await fetch("/api/tasks/nl-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, defaultDueDate, save }),
      })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
      
      // Refresh the page if tasks were saved
      if (save && data.saved && data.saved.length > 0) {
        setText("")
        setResult("Tasks created successfully!")
        setTimeout(() => {
          router.refresh()
          setResult("")
        }, 1500)
      }
    } catch (err) {
      setResult(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="h-32 w-full rounded-md border px-3 py-2 text-sm"
        placeholder="Study 4 hours for ECON midterm..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
        Save to task list automatically
      </label>
      <Button type="button" onClick={handleSubmit} disabled={loading}>
        {loading ? "Thinking..." : "Parse with Claude"}
      </Button>
      {result && (
        <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{result}</pre>
      )}
    </div>
  )
}