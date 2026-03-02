import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  // 🔥 Basic rate limiting (10 per minute)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  const { data: recentRuns } = await supabase
    .from("workflow_runs")
    .select("*")
    .gte("started_at", oneMinuteAgo);

  if (recentRuns && recentRuns.length > 10) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { workflowId } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: "Missing workflowId" },
        { status: 400 }
      );
    }

    // 1️⃣ Get workflow definition
    const { data: workflow, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (error || !workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Create workflow run
    const { data: run } = await supabase
      .from("workflow_runs")
      .insert([
        {
          workflow_id: workflowId,
          status: "running",
          started_at: new Date()
        }
      ])
      .select()
      .single();

    // 3️⃣ Interpret steps dynamically
    let finalResult: any = {};
    for (const step of workflow.definition_json.steps) {
      const start = Date.now();

      // Mark step running
      await supabase.from("workflow_step_runs").insert([
        {
          workflow_run_id: run.id,
          step_id: step.id,
          status: "running"
        }
      ]);

      let output: any = {};

      const rawType = step.type;
      const type = rawType.toLowerCase().replace(/\s+/g, "_");

      console.log("Executing step type:", rawType);

      switch (true) {

        // 🔹 DATA EXTRACTION
        case type.includes("extract") || type.includes("data_extraction"):
          output = { skills: ["React", "Node"] };
          break;

        // 🔹 SCORING
        case type.includes("score") || type.includes("scoring"):
          output = { score: 55 };
          finalResult.score = 55;
          break;

        // 🔹 CONTENT GENERATION (feedback)
        case type.includes("feedback") || type.includes("content_generation"):
          output = { tips: "Improve backend depth." };
          finalResult.feedback = "Improve backend depth.";
          break;

        // 🔹 NOTIFICATION / EMAIL
        case type.includes("email") || type.includes("notify") || type.includes("notification"):
          output = { email_sent: true };
          finalResult.email_sent = true;
          break;

        default:
          output = {
            message: "Unsupported step type: " + rawType
          };
      }

      // Update step completed
      await supabase
        .from("workflow_step_runs")
        .update({
          status: "completed",
          output_payload: output,
          latency_ms: Date.now() - start
        })
        .eq("workflow_run_id", run.id)
        .eq("step_id", step.id);
    }

    // 4️⃣ Mark workflow completed
    await supabase
      .from("workflow_runs")
      .update({
        status: "completed",
        completed_at: new Date()
      })
      .eq("id", run.id);
    
    console.log("FINAL RESULT:", finalResult);

    return NextResponse.json({
      message: "Workflow executed",
      result: finalResult
    });

  } catch (error: any) {
    console.error("EXECUTION ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Execution failed" },
      { status: 500 }
    );
  }
}