import { NextResponse } from "next/server";
import { z } from "zod";
import { getCalendarClient } from "@/lib/google";
import { addMinutes, getTimeZone, isValidDateString, localDateTimeToIso } from "@/lib/time";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().max(2000).optional().default(""),
  date: z.string().refine(isValidDateString),
  durationMinutes: z.number().int().min(15).max(180),
  start: z.string().datetime(),
  attendees: z.array(z.string().email()).max(50).optional().default([])
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid event details." }, { status: 400 });

    const { title, description, date, durationMinutes, start, attendees } = parsed.data;
    const timezone = getTimeZone();
    const expectedStart = new Date(start);
    if (expectedStart <= new Date()) return NextResponse.json({ error: "That time is in the past. Refresh availability." }, { status: 400 });

    // Enforce configured work hours and selected local date; clients cannot post arbitrary calendar times.
    const dayStart = localDateTimeToIso(date, process.env.WORKDAY_START || "09:00", timezone);
    const dayEnd = localDateTimeToIso(date, process.env.WORKDAY_END || "17:00", timezone);
    const end = addMinutes(expectedStart.toISOString(), durationMinutes);
    if (expectedStart < new Date(dayStart) || new Date(end) > new Date(dayEnd)) {
      return NextResponse.json({ error: "Selected time is outside configured working hours." }, { status: 400 });
    }
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(expectedStart);
    if (localDate !== date) return NextResponse.json({ error: "Selected time does not match the chosen date." }, { status: 400 });

    const calendar = await getCalendarClient();

    // Recheck immediately before insertion to reduce stale-slot bookings.
    const freebusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: expectedStart.toISOString(),
        timeMax: end,
        timeZone: timezone,
        items: [{ id: "primary" }]
      }
    });
    const busy = freebusy.data.calendars?.primary?.busy || [];
    if (busy.some((item) => new Date(item.start || "").getTime() < new Date(end).getTime() &&
                            new Date(item.end || "").getTime() > expectedStart.getTime())) {
      return NextResponse.json({ error: "This time has just become busy. Refresh availability and choose another slot." }, { status: 409 });
    }

    const created = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: attendees.length ? "all" : "none",
      requestBody: {
        summary: title,
        description,
        start: { dateTime: expectedStart.toISOString(), timeZone: timezone },
        end: { dateTime: end, timeZone: timezone },
        attendees: attendees.map((email) => ({ email }))
      }
    });

    return NextResponse.json({
      event: {
        id: created.data.id,
        htmlLink: created.data.htmlLink,
        summary: created.data.summary,
        start: created.data.start,
        end: created.data.end
      }
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Event creation failed";
    const status = message.includes("not connected") ? 401 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
