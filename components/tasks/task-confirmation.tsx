"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Calendar, Clock, BookOpen, AlertCircle } from "lucide-react";
import { ParsedSyllabus, ParsedTask } from "./syllabus-widget";
import { format } from "date-fns";

type TaskWithSelection = ParsedTask & {
  selected: boolean;
  courseId?: string;
};

interface TaskConfirmationProps {
  parsedData: ParsedSyllabus;
  onComplete: () => void;
}

export function TaskConfirmation({ parsedData, onComplete }: TaskConfirmationProps) {
  const [tasks, setTasks] = useState<TaskWithSelection[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Initialize tasks with selection state
    setTasks(parsedData.tasks.map(task => ({ ...task, selected: true })));

    // Fetch user's courses
    fetchCourses();
  }, [parsedData]);

  async function fetchCourses() {
    try {
      const response = await fetch("/api/courses/get");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);

        // Try to auto-match course based on parsed data
        if (parsedData.courseCode || parsedData.courseName) {
          const matchedCourse = data.find(
            (c: any) =>
              c.code === parsedData.courseCode ||
              c.name.toLowerCase().includes(parsedData.courseName?.toLowerCase() || "")
          );
          if (matchedCourse) {
            setSelectedCourseId(matchedCourse.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoadingCourses(false);
    }
  }

  function toggleTask(index: number) {
    setTasks(prev =>
      prev.map((task, i) => (i === index ? { ...task, selected: !task.selected } : task))
    );
  }

  function toggleAll() {
    const allSelected = tasks.every(t => t.selected);
    setTasks(prev => prev.map(task => ({ ...task, selected: !allSelected })));
  }

  async function handleSave() {
    const selectedTasks = tasks.filter(t => t.selected);

    if (selectedTasks.length === 0) {
      setError("Please select at least one task to save");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks/batch-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: selectedTasks.map(({ selected, ...task }) => ({
            ...task,
            courseId: selectedCourseId || undefined,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save tasks");
      }

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = tasks.filter(t => t.selected).length;
  const totalEstimatedMinutes = tasks
    .filter(t => t.selected)
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);

  const typeColors: Record<string, string> = {
    homework: "bg-brand-100 text-brand-800 border-brand-200",
    exam: "bg-red-100 text-red-800 border-red-200",
    project: "bg-uva-orange-100 text-uva-orange-800 border-uva-orange-200",
    reading: "bg-brand-200 text-brand-700 border-brand-300",
    quiz: "bg-uva-orange-200 text-uva-orange-700 border-uva-orange-300",
    other: "bg-gray-100 text-gray-800 border-gray-200",
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Save className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-900">Tasks Saved Successfully!</h3>
            <p className="text-sm text-green-700">
              {selectedCount} {selectedCount === 1 ? "task" : "tasks"} added to your calendar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Review & Confirm Tasks</CardTitle>
            <CardDescription>
              {parsedData.tasks.length} {parsedData.tasks.length === 1 ? "task" : "tasks"} found
              {parsedData.courseName && ` for ${parsedData.courseName}`}
              {parsedData.courseCode && ` (${parsedData.courseCode})`}
            </CardDescription>
          </div>
          {!loadingCourses && courses.length > 0 && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="course-select" className="text-xs">Link to course (optional)</Label>
              <select
                id="course-select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="text-sm border rounded-md px-2 py-1 bg-background"
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length > 0 && (
          <div className="flex items-center justify-between pb-2 border-b">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <Checkbox
                checked={tasks.every(t => t.selected)}
                onCheckedChange={toggleAll}
              />
              Select All
            </button>
            <div className="text-sm text-muted-foreground">
              {selectedCount} selected • ~{Math.round(totalEstimatedMinutes / 60)}h {totalEstimatedMinutes % 60}m total
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {tasks.map((task, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                task.selected ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-muted"
              }`}
            >
              <Checkbox
                checked={task.selected}
                onCheckedChange={() => toggleTask(index)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                  <Badge className={`text-xs ${typeColors[task.type]}`}>
                    {task.type}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{Math.round(task.estimatedMinutes / 60)}h {task.estimatedMinutes % 60}m
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={loading || selectedCount === 0}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save {selectedCount} {selectedCount === 1 ? "Task" : "Tasks"}
              </>
            )}
          </Button>
          <Button onClick={onComplete} variant="outline" disabled={loading}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
