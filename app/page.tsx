"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [instruction, setInstruction] = useState("");
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [finalResult, setFinalResult] = useState<any>(null);

  // 🔴 Realtime Listener
  useEffect(() => {
    const channel = supabase
      .channel("workflow-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workflow_step_runs",
        },
        (payload) => {
          setLogs((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🟢 Create Workflow
  const createWorkflow = async () => {
    const res = await fetch("/api/create-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instruction,
        userId: "32f90546-4602-4588-8775-6e48490251e3",
      }),
    });

    const data = await res.json();
    console.log("Created:", data);

    if (data[0]?.id) {
      setWorkflowId(data[0].id);
    }
  };

  // 🔵 Execute Workflow
  const executeWorkflow = async () => {
    if (!workflowId) {
      alert("Create workflow first!");
      return;
    }

    const res = await fetch("/api/execute-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId }),
    });

    const data = await res.json();
    console.log("Final Result:", data.result);
    setFinalResult(data.result);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        padding: "40px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: 500 }}>
        AI Workflow Engine
      </h1>

      <div
        style={{
          display: "flex",
          gap: "40px",
          marginTop: "40px",
        }}
      >
        {/* 🔹 LEFT PANEL */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#0a0a0a",
            padding: "30px",
            borderRadius: "14px",
            border: "1px solid #1a1a1a",
          }}
        >
          <h3>Create Workflow</h3>

          <textarea
            placeholder="Describe your automation..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            style={{
              width: "100%",
              minHeight: "120px",
              backgroundColor: "#000",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "12px",
              marginTop: "15px",
              marginBottom: "20px",
            }}
          />

          <div style={{ display: "flex", gap: "15px" }}>
            <button
              onClick={createWorkflow}
              style={{
                flex: 1,
                backgroundColor: "#111",
                border: "1px solid #333",
                padding: "14px",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Create Workflow
            </button>

            <button
              onClick={executeWorkflow}
              style={{
                flex: 1,
                backgroundColor: "#000",
                border: "1px solid #444",
                padding: "14px",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Execute Workflow
            </button>
          </div>

          {workflowId && (
            <div
              style={{
                marginTop: "25px",
                padding: "15px",
                backgroundColor: "#000",
                borderRadius: "8px",
                border: "1px solid #222",
                fontSize: "12px",
              }}
            >
              <div style={{ opacity: 0.6 }}>Workflow ID</div>
              <code>{workflowId}</code>
            </div>
          )}
        </div>

        {/* 🔹 RIGHT PANEL */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#0a0a0a",
            padding: "30px",
            borderRadius: "14px",
            border: "1px solid #1a1a1a",
            maxHeight: "75vh",
            overflowY: "auto",
          }}
        >
          <h3>Execution Output</h3>

          {logs.length === 0 && (
            <p style={{ opacity: 0.5 }}>No execution yet.</p>
          )}

          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                marginTop: "20px",
                paddingBottom: "15px",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              <div>
                <strong>Step:</strong> {log.step_id}
              </div>

              <div>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color:
                      log.status === "completed"
                        ? "#22c55e"
                        : log.status === "running"
                        ? "#eab308"
                        : "#ef4444",
                  }}
                >
                  {log.status}
                </span>
              </div>

              {log.output_payload && (
                <pre
                  style={{
                    backgroundColor: "#000",
                    padding: "12px",
                    marginTop: "10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(log.output_payload, null, 2)}
                </pre>
              )}
            </div>
          ))}

          {/* 🔥 FINAL RESULT */}
          {finalResult && (
            <div
              style={{
                marginTop: "30px",
                padding: "20px",
                backgroundColor: "#000",
                borderRadius: "12px",
                border: "1px solid #333",
              }}
            >
              <h3>Final Result</h3>

              {finalResult.score && (
                <p>
                  <strong>Score:</strong> {finalResult.score}
                </p>
              )}

              {finalResult.feedback && (
                <p>
                  <strong>Feedback:</strong> {finalResult.feedback}
                </p>
              )}

              {finalResult.email_sent !== undefined && (
                <p>
                  <strong>Email Sent:</strong>{" "}
                  {finalResult.email_sent ? "Yes" : "No"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}