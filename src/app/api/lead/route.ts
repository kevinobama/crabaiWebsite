import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, service, budget, message } = body;

    if (!name || !email || !service || !message) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, service, message" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const lead = await db.lead.create({
      data: {
        name,
        email,
        company: company || null,
        service,
        budget: budget || null,
        message,
      },
    });

    return NextResponse.json({
      success: true,
      id: lead.id,
      message: "Thanks! I'll be in touch within 24 hours.",
    });
  } catch (err) {
    console.error("Lead capture error:", err);
    return NextResponse.json(
      { error: "Failed to submit. Please email kevinobamatheus@gmail.com instead." },
      { status: 500 }
    );
  }
}
