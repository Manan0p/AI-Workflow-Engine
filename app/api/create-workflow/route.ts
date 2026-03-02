import { NextResponse } from "next/server";
import axios from "axios";
import { WorkflowSchema } from "@/lib/schema";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instruction, userId } = body;

    if (!instruction || !userId) {
      return NextResponse.json(
        { error: "Missing input" },
        { status: 400 }
      );
    }

    const prompt = `
      Return ONLY valid JSON.
      Schema:
      {
        "trigger": "string",
        "steps": [
          { "id": "string", "type": "string", "condition": "optional string" }
        ]
      }

      Instruction: ${instruction}
      `;

    const gemini = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    const text = gemini.data.candidates[0].content.parts[0].text;

    // 🔥 Clean markdown if Gemini wraps in ```json
    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = WorkflowSchema.parse(JSON.parse(clean));
    } catch (err) {
      console.error("RAW LLM OUTPUT:", text);
      return NextResponse.json(
        { error: "Invalid LLM Output" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("workflows")
      .insert([
        {
          user_id: userId,
          name: "Generated Workflow",
          definition_json: parsed
        }
      ])
      .select();

    if (error) throw error;

    await supabase.from("usage_logs").insert([
      {
        user_id: userId,
        tokens_used: 300, // mock estimate
        model_used: "gemini-2.5-flash"
      }
    ]);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}