import { NextResponse } from "next/server";
import { z } from "zod";
import { getCalendarClient } from "@/lib/google";
import { addMinutes, getTimeZone, isValidDateString, localDateTimeToIso } from "@/lib/time";

export const runtime = "nodejs";

const schema = z.object({
  date: z.string().refine(isValidDateString, "Date must be YYYY-MM-DD."),
  durationMinutes: z.number().int().min(15).max(180)
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });

    const { date, durationMinutes } = parsed.data;
    const timezone = getTimeZone();
    const workStart = process.env.WORKDAY_START || "09:00";
    const workEnd = process.env.WORKDAY_END || "17:00";
    const interval = Math.max(15, Number(process.env.SLOT_INTERVAL_MINUTES || 30));

    const rangeStart = localDateTimeToIso(date, workStart, timezone);
    const rangeEnd = localDateTimeToIso(date, workEnd, timezone);
    if (new Date(rangeStart) <= new Date()) {
      // Keep past slots out of the result; the loop below also checks each candidate.
    }

    const calendar = await getCalendarClient();
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: rangeStart,
        timeMax: rangeEnd,
        timeZone: timezone,
        items: [{ id: "primary" }]
      }
    });

    const busy = response.data.calendars?.primary?.busy || [];
    const busyRanges = busy.map((item) => ({
      start: new Date(item.start || "").getTime(),
      end: new Date(item.end || "").getTime()
    }));
    const slots = [];
    const workEndMs = new Date(rangeEnd).getTime();
    const nowMs = Date.now();
    let cursor = new Date(rangeStart).getTime();

    while (cursor + durationMinutes * 60_000 <= workEndMs) {
      const end = cursor + durationMinutes * 60_000;
      const conflicts = busyRanges.some((b) => cursor < b.end && end > b.start);
      if (cursor > nowMs && !conflicts) {
        const startIso = new Date(cursor).toISOString();
        const endIso = addMinutes(startIso, durationMinutes);
        slots.push({
          start: startIso,
          end: endIso,
          label: new Intl.DateTimeFormat("en-IN", {
            timeZone: timezone, weekday: "short", month: "short", day: "numeric"
          }).format(new Date(startIso))
        });
      }
      cursor += interval * 60_000;
    }

    return NextResponse.json({ date, timezone, slots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Availability lookup failed";
    const status = message.includes("not connected") ? 401 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
