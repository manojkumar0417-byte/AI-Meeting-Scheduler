// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { getCalendarClient } from "@/lib/google";
// import { addMinutes, getTimeZone, isValidDateString, localDateTimeToIso } from "@/lib/time";

// export const runtime = "nodejs";

// const schema = z.object({
//   title: z.string().trim().min(1).max(150),
//   description: z.string().max(2000).optional().default(""),
//   date: z.string().refine(isValidDateString),
//   durationMinutes: z.number().int().min(15).max(180),
//   start: z.string().datetime(),
//   attendees: z.array(z.string().email()).max(50).optional().default([])
// });

// export async function POST(request: Request) {
//   try {
//     const parsed = schema.safeParse(await request.json());
//     if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid event details." }, { status: 400 });

//     const { title, description, date, durationMinutes, start, attendees } = parsed.data;
//     const timezone = getTimeZone();
//     const expectedStart = new Date(start);
//     if (expectedStart <= new Date()) return NextResponse.json({ error: "That time is in the past. Refresh availability." }, { status: 400 });

//     // Enforce configured work hours and selected local date; clients cannot post arbitrary calendar times.
//     const dayStart = localDateTimeToIso(date, process.env.WORKDAY_START || "09:00", timezone);
//     const dayEnd = localDateTimeToIso(date, process.env.WORKDAY_END || "17:00", timezone);
//     const end = addMinutes(expectedStart.toISOString(), durationMinutes);
//     if (expectedStart < new Date(dayStart) || new Date(end) > new Date(dayEnd)) {
//       return NextResponse.json({ error: "Selected time is outside configured working hours." }, { status: 400 });
//     }
//     const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(expectedStart);
//     if (localDate !== date) return NextResponse.json({ error: "Selected time does not match the chosen date." }, { status: 400 });

//     const calendar = await getCalendarClient();

//     // Recheck immediately before insertion to reduce stale-slot bookings.
//     const freebusy = await calendar.freebusy.query({
//       requestBody: {
//         timeMin: expectedStart.toISOString(),
//         timeMax: end,
//         timeZone: timezone,
//         items: [{ id: "primary" }]
//       }
//     });
//     const busy = freebusy.data.calendars?.primary?.busy || [];
//     if (busy.some((item) => new Date(item.start || "").getTime() < new Date(end).getTime() &&
//                             new Date(item.end || "").getTime() > expectedStart.getTime())) {
//       return NextResponse.json({ error: "This time has just become busy. Refresh availability and choose another slot." }, { status: 409 });
//     }

//     const created = await calendar.events.insert({
//       calendarId: "primary",
//       sendUpdates: attendees.length ? "all" : "none",
//       requestBody: {
//         summary: title,
//         description,
//         start: { dateTime: expectedStart.toISOString(), timeZone: timezone },
//         end: { dateTime: end, timeZone: timezone },
//         attendees: attendees.map((email) => ({ email }))
//       }
//     });

//     return NextResponse.json({
//       event: {
//         id: created.data.id,
//         htmlLink: created.data.htmlLink,
//         summary: created.data.summary,
//         start: created.data.start,
//         end: created.data.end
//       }
//     }, { status: 201 });
//   } catch (error) {
//     const message = error instanceof Error ? error.message : "Event creation failed";
//     const status = message.includes("not connected") ? 401 : 502;
//     return NextResponse.json({ error: message }, { status });
//   }
// }



// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { getCalendarClient } from "@/lib/google";
// import {
//   addMinutes,
//   getTimeZone,
//   isValidDateString,
//   localDateTimeToIso,
// } from "@/lib/time";

// export const runtime = "nodejs";

// const schema = z.object({
//   title: z.string().trim().min(1).max(150),
//   description: z.string().max(2000).optional().default(""),
//   date: z.string().refine(isValidDateString, {
//     message: "Date must be YYYY-MM-DD.",
//   }),
//   durationMinutes: z.number().int().min(15).max(180),
//   start: z.string().datetime(),
//   attendees: z.array(z.string().trim().email()).max(50).optional().default([]),
// });

// export async function POST(request: Request) {
//   try {
//     const parsed = schema.safeParse(await request.json());

//     if (!parsed.success) {
//       return NextResponse.json(
//         {
//           error:
//             parsed.error.issues[0]?.message ||
//             "Invalid event details.",
//         },
//         { status: 400 },
//       );
//     }

//     const {
//       title,
//       description,
//       date,
//       durationMinutes,
//       start,
//       attendees,
//     } = parsed.data;

//     // Normalize addresses and remove duplicates.
//     const uniqueAttendees = [
//       ...new Set(
//         attendees
//           .map((email) => email.trim().toLowerCase())
//           .filter(Boolean),
//       ),
//     ];

//     const timezone = getTimeZone();
//     const expectedStart = new Date(start);

//     if (expectedStart.getTime() <= Date.now()) {
//       return NextResponse.json(
//         { error: "That time is in the past. Refresh availability." },
//         { status: 400 },
//       );
//     }

//     // Enforce configured working hours.
//     const dayStart = localDateTimeToIso(
//       date,
//       process.env.WORKDAY_START || "09:00",
//       timezone,
//     );

//     const dayEnd = localDateTimeToIso(
//       date,
//       process.env.WORKDAY_END || "17:00",
//       timezone,
//     );

//     const end = addMinutes(
//       expectedStart.toISOString(),
//       durationMinutes,
//     );

//     if (
//       expectedStart.getTime() < new Date(dayStart).getTime() ||
//       new Date(end).getTime() > new Date(dayEnd).getTime()
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "Selected time is outside configured working hours.",
//         },
//         { status: 400 },
//       );
//     }

//     // Confirm that the selected start belongs to the requested date.
//     const localDate = new Intl.DateTimeFormat("en-CA", {
//       timeZone: timezone,
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     }).format(expectedStart);

//     if (localDate !== date) {
//       return NextResponse.json(
//         { error: "Selected time does not match the chosen date." },
//         { status: 400 },
//       );
//     }

//     const calendar = await getCalendarClient();

//     // Recheck your primary calendar immediately before creating the event.
//     const freebusy = await calendar.freebusy.query({
//       requestBody: {
//         timeMin: expectedStart.toISOString(),
//         timeMax: end,
//         timeZone: timezone,
//         items: [{ id: "primary" }],
//       },
//     });

//     const busy = freebusy.data.calendars?.primary?.busy || [];

//     const hasConflict = busy.some((item) => {
//       const busyStart = new Date(item.start || "").getTime();
//       const busyEnd = new Date(item.end || "").getTime();

//       return (
//         Number.isFinite(busyStart) &&
//         Number.isFinite(busyEnd) &&
//         busyStart < new Date(end).getTime() &&
//         busyEnd > expectedStart.getTime()
//       );
//     });

//     if (hasConflict) {
//       return NextResponse.json(
//         {
//           error:
//             "This time has just become busy. Refresh availability and choose another slot.",
//         },
//         { status: 409 },
//       );
//     }

//     // Create one event with all invitees.
//     const created = await calendar.events.insert({
//       calendarId: "primary",
//       sendUpdates: uniqueAttendees.length > 0 ? "all" : "none",
//       requestBody: {
//         summary: title,
//         description,
//         start: {
//           dateTime: expectedStart.toISOString(),
//           timeZone: timezone,
//         },
//         end: {
//           dateTime: end,
//           timeZone: timezone,
//         },
//         attendees: uniqueAttendees.map((email) => ({
//           email,
//         })),
//       },
//     });

//     return NextResponse.json(
//       {
//         event: {
//           id: created.data.id,
//           htmlLink: created.data.htmlLink,
//           summary: created.data.summary,
//           start: created.data.start,
//           end: created.data.end,
//           attendees: created.data.attendees?.map((attendee) => ({
//             email: attendee.email,
//             responseStatus: attendee.responseStatus,
//           })) || [],
//         },
//       },
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error("Event creation failed:", error);

//     const message =
//       error instanceof Error
//         ? error.message
//         : "Event creation failed";

//     const status = message.includes("not connected") ? 401 : 502;

//     return NextResponse.json({ error: message }, { status });
//   }
// }




// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { getCalendarClient } from "@/lib/google";
// import {
//   addMinutes,
//   getTimeZone,
//   isValidDateString,
//   localDateTimeToIso,
// } from "@/lib/time";

// export const runtime = "nodejs";

// const schema = z.object({
//   title: z.string().trim().min(1).max(150),
//   description: z.string().max(2000).optional().default(""),
//   date: z.string().refine(isValidDateString, {
//     message: "Date must be YYYY-MM-DD.",
//   }),
//   durationMinutes: z.number().int().min(15).max(180),
//   start: z.string().datetime(),
//   attendees: z
//     .array(z.string().trim().email())
//     .max(50)
//     .optional()
//     .default([]),
// });

// export async function POST(request: Request) {
//   try {
//     const body: unknown = await request.json();
//     const parsed = schema.safeParse(body);

//     if (!parsed.success) {
//       return NextResponse.json(
//         {
//           error:
//             parsed.error.issues[0]?.message ||
//             "Invalid event details.",
//         },
//         { status: 400 },
//       );
//     }

//     const {
//       title,
//       description,
//       date,
//       durationMinutes,
//       start,
//       attendees,
//     } = parsed.data;

//     const uniqueAttendees = [
//       ...new Set(
//         attendees
//           .map((email) => email.trim().toLowerCase())
//           .filter(Boolean),
//       ),
//     ];

//     const timezone = getTimeZone();
//     const expectedStart = new Date(start);

//     if (!Number.isFinite(expectedStart.getTime())) {
//       return NextResponse.json(
//         { error: "Invalid meeting start time." },
//         { status: 400 },
//       );
//     }

//     if (expectedStart.getTime() <= Date.now()) {
//       return NextResponse.json(
//         { error: "That time is in the past. Refresh availability." },
//         { status: 400 },
//       );
//     }

//     // Ensure the selected instant belongs to the requested local date.
//     const localDate = new Intl.DateTimeFormat("en-CA", {
//       timeZone: timezone,
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     }).format(expectedStart);

//     if (localDate !== date) {
//       return NextResponse.json(
//         { error: "Selected time does not match the chosen date." },
//         { status: 400 },
//       );
//     }

//     const dayStart = localDateTimeToIso(
//       date,
//       process.env.WORKDAY_START || "09:00",
//       timezone,
//     );

//     const dayEnd = localDateTimeToIso(
//       date,
//       process.env.WORKDAY_END || "17:00",
//       timezone,
//     );

//     const end = addMinutes(
//       expectedStart.toISOString(),
//       durationMinutes,
//     );

//     const startMs = expectedStart.getTime();
//     const endMs = new Date(end).getTime();
//     const dayStartMs = new Date(dayStart).getTime();
//     const dayEndMs = new Date(dayEnd).getTime();

//     if (
//       !Number.isFinite(endMs) ||
//       startMs < dayStartMs ||
//       endMs > dayEndMs
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "Selected time is outside configured working hours.",
//         },
//         { status: 400 },
//       );
//     }

//     const calendar = await getCalendarClient();

//     // Recheck the primary calendar immediately before creating the event.
//     const freebusy = await calendar.freebusy.query({
//       requestBody: {
//         timeMin: expectedStart.toISOString(),
//         timeMax: end,
//         timeZone: timezone,
//         items: [{ id: "primary" }],
//       },
//     });

//     const busy = freebusy.data.calendars?.primary?.busy || [];

//     const hasConflict = busy.some((item) => {
//       const busyStart = new Date(item.start || "").getTime();
//       const busyEnd = new Date(item.end || "").getTime();

//       return (
//         Number.isFinite(busyStart) &&
//         Number.isFinite(busyEnd) &&
//         busyStart < endMs &&
//         busyEnd > startMs
//       );
//     });

//     if (hasConflict) {
//       return NextResponse.json(
//         {
//           error:
//             "This time has just become busy. Refresh availability and choose another slot.",
//         },
//         { status: 409 },
//       );
//     }

//     const created = await calendar.events.insert({
//       calendarId: "primary",
//       sendUpdates: uniqueAttendees.length > 0 ? "all" : "none",
//       requestBody: {
//         summary: title,
//         description,
//         start: {
//           dateTime: expectedStart.toISOString(),
//           timeZone: timezone,
//         },
//         end: {
//           dateTime: end,
//           timeZone: timezone,
//         },
//         attendees: uniqueAttendees.map((email) => ({ email })),
//       },
//     });

//     if (!created.data.id) {
//       throw new Error(
//         "Google Calendar did not return an event ID.",
//       );
//     }

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Meeting created successfully in Google Calendar.",
//         event: {
//           id: created.data.id,
//           htmlLink: created.data.htmlLink ?? null,
//           summary: created.data.summary,
//           start: created.data.start,
//           end: created.data.end,
//           attendees:
//             created.data.attendees?.map((attendee) => ({
//               email: attendee.email,
//               responseStatus: attendee.responseStatus,
//             })) || [],
//         },
//       },
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error("Event creation failed:", error);

//     const message =
//       error instanceof Error
//         ? error.message
//         : "Event creation failed";

//     const status = message.includes("not connected") ? 401 : 502;

//     return NextResponse.json({ error: message }, { status });
//   }
// }



// /button calender


import { NextResponse } from "next/server";
import { z } from "zod";
import { getCalendarClient } from "@/lib/google";
import {
  addMinutes,
  getTimeZone,
  isValidDateString,
  localDateTimeToIso,
} from "@/lib/time";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().max(2000).optional().default(""),
  date: z.string().refine(isValidDateString, {
    message: "Date must be YYYY-MM-DD.",
  }),
  durationMinutes: z.number().int().min(15).max(180),
  start: z.string().datetime(),
  attendees: z
    .array(z.string().trim().email())
    .max(50)
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Invalid event details.",
        },
        { status: 400 },
      );
    }

    const {
      title,
      description,
      date,
      durationMinutes,
      start,
      attendees,
    } = parsed.data;

    const uniqueAttendees = [
      ...new Set(
        attendees.map((email) => email.trim().toLowerCase()),
      ),
    ];

    const timezone = getTimeZone();
    const expectedStart = new Date(start);

    if (!Number.isFinite(expectedStart.getTime())) {
      return NextResponse.json(
        { error: "Invalid meeting start time." },
        { status: 400 },
      );
    }

    if (expectedStart.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "That time is in the past. Refresh availability." },
        { status: 400 },
      );
    }

    // Validate the selected date in the configured calendar timezone.
    const localDateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(expectedStart);

    const datePart = (type: string) =>
      localDateParts.find((part) => part.type === type)?.value ?? "";

    const actualLocalDate =
      `${datePart("year")}-${datePart("month")}-${datePart("day")}`;

    if (actualLocalDate !== date) {
      return NextResponse.json(
        { error: "Selected time does not match the chosen date." },
        { status: 400 },
      );
    }

    const dayStart = localDateTimeToIso(
      date,
      process.env.WORKDAY_START || "09:00",
      timezone,
    );

    const dayEnd = localDateTimeToIso(
      date,
      process.env.WORKDAY_END || "17:00",
      timezone,
    );

    const end = addMinutes(
      expectedStart.toISOString(),
      durationMinutes,
    );

    const startMs = expectedStart.getTime();
    const endMs = new Date(end).getTime();
    const dayStartMs = new Date(dayStart).getTime();
    const dayEndMs = new Date(dayEnd).getTime();

    if (
      !Number.isFinite(endMs) ||
      startMs < dayStartMs ||
      endMs > dayEndMs
    ) {
      return NextResponse.json(
        {
          error:
            "Selected time is outside configured working hours.",
        },
        { status: 400 },
      );
    }

    const calendar = await getCalendarClient();

    // Recheck availability immediately before creating the event.
    const freebusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: expectedStart.toISOString(),
        timeMax: end,
        timeZone: timezone,
        items: [{ id: "primary" }],
      },
    });

    const busy = freebusy.data.calendars?.primary?.busy ?? [];

    const hasConflict = busy.some((item) => {
      const busyStart = new Date(item.start ?? "").getTime();
      const busyEnd = new Date(item.end ?? "").getTime();

      return (
        Number.isFinite(busyStart) &&
        Number.isFinite(busyEnd) &&
        busyStart < endMs &&
        busyEnd > startMs
      );
    });

    if (hasConflict) {
      return NextResponse.json(
        {
          error:
            "This time has just become busy. Refresh availability and choose another slot.",
        },
        { status: 409 },
      );
    }

    const created = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: uniqueAttendees.length > 0 ? "all" : "none",
      requestBody: {
        summary: title,
        description,
        start: {
          dateTime: expectedStart.toISOString(),
          timeZone: timezone,
        },
        end: {
          dateTime: end,
          timeZone: timezone,
        },
        attendees: uniqueAttendees.map((email) => ({ email })),
      },
    });

    const eventId = created.data.id;

    if (!eventId) {
      throw new Error(
        "Google Calendar did not return an event ID.",
      );
    }

    // Fetch the saved event again to retrieve its direct calendar URL.
    const savedEvent = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    // If Google does not return htmlLink, open the calendar on the
    // meeting date instead. This is a calendar-date link, not a direct
    // event link.
    const calendarDateUrl =
      `https://calendar.google.com/calendar/u/0/r/day/` +
      `${date.slice(0, 4)}/${Number(date.slice(5, 7)) - 1}/` +
      `${Number(date.slice(8, 10))}`;

    const htmlLink =
      savedEvent.data.htmlLink ??
      created.data.htmlLink ??
      calendarDateUrl;

    console.info("Google Calendar event created:", {
      eventId,
      hasDirectEventLink: Boolean(
        savedEvent.data.htmlLink ?? created.data.htmlLink,
      ),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Meeting created successfully in Google Calendar.",
        event: {
          id: eventId,
          htmlLink,
          isDirectEventLink: Boolean(
            savedEvent.data.htmlLink ?? created.data.htmlLink,
          ),
          summary: savedEvent.data.summary ?? title,
          start: savedEvent.data.start,
          end: savedEvent.data.end,
          attendees:
            savedEvent.data.attendees?.map((attendee) => ({
              email: attendee.email,
              responseStatus: attendee.responseStatus,
            })) ?? [],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Event creation failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Event creation failed.";

    const status = message.toLowerCase().includes("not connected")
      ? 401
      : 502;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
