"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { TaskConfirmation } from "./task-confirmation";

export type ParsedTask = {
  title: string;
  description?: string;
  type: "homework" | "exam" | "project" | "reading" | "quiz" | "other";
  dueDate: string | null;
  estimatedMinutes: number;
};

export type ParsedSyllabus = {
  courseName?: string;
  courseCode?: string;
  tasks: ParsedTask[];
};

export function SyllabusWidget() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSyllabus | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  async function handleParse() {
    setLoading(true);
    setError(null);
    setParsedData(null);

    try {
      let response;

      if (activeTab === "upload" && file) {
        // Handle file upload
        const formData = new FormData();
        formData.append("file", file);

        response = await fetch("/api/syllabus/parse", {
          method: "POST",
          body: formData,
        });
      } else if (activeTab === "paste" && text) {
        // Handle text paste
        response = await fetch("/api/syllabus/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ syllabusText: text }),
        });
      } else {
        setError("Please provide a file or text to parse");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse syllabus");
      }

      const data = await response.json();
      setParsedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload a PDF, DOCX, or TXT file");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  }

  function handleReset() {
    setText("");
    setFile(null);
    setParsedData(null);
    setError(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Syllabus</CardTitle>
          <CardDescription>
            Upload a syllabus file or paste the text to automatically extract assignments and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" activeValue={activeTab}>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="paste" activeValue={activeTab}>
                <FileText className="h-4 w-4 mr-2" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" activeValue={activeTab}>
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:underline">
                      Choose a file
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, DOCX, or TXT files supported
                  </p>
                </div>

                {file && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="paste" activeValue={activeTab}>
              <div className="space-y-4">
                <textarea
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your syllabus text here..."
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Include assignment names, due dates, and any relevant details
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleParse}
              disabled={loading || (!file && !text)}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Parse Syllabus
                </>
              )}
            </Button>
            {(file || text || parsedData) && (
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {parsedData && (
        <TaskConfirmation
          parsedData={parsedData}
          onComplete={handleReset}
        />
      )}
    </div>
  );
}
