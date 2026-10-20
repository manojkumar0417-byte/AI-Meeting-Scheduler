// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { getCalendarClient } from "@/lib/google";
// import { addMinutes, getTimeZone, isValidDateString, localDateTimeToIso } from "@/lib/time";

// export const runtime = "nodejs";

// const schema = z.object({
//   date: z.string().refine(isValidDateString, "Date must be YYYY-MM-DD."),
//   durationMinutes: z.number().int().min(15).max(180)
// });

// export async function POST(request: Request) {
//   try {
//     const parsed = schema.safeParse(await request.json());
//     if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });

//     const { date, durationMinutes } = parsed.data;
//     const timezone = getTimeZone();
//     const workStart = process.env.WORKDAY_START || "09:00";
//     const workEnd = process.env.WORKDAY_END || "17:00";
//     const interval = Math.max(15, Number(process.env.SLOT_INTERVAL_MINUTES || 30));

//     const rangeStart = localDateTimeToIso(date, workStart, timezone);
//     const rangeEnd = localDateTimeToIso(date, workEnd, timezone);
//     if (new Date(rangeStart) <= new Date()) {
//       // Keep past slots out of the result; the loop below also checks each candidate.
//     }

//     const calendar = await getCalendarClient();
//     const response = await calendar.freebusy.query({
//       requestBody: {
//         timeMin: rangeStart,
//         timeMax: rangeEnd,
//         timeZone: timezone,
//         items: [{ id: "primary" }]
//       }
//     });

//     const busy = response.data.calendars?.primary?.busy || [];
//     const busyRanges = busy.map((item) => ({
//       start: new Date(item.start || "").getTime(),
//       end: new Date(item.end || "").getTime()
//     }));
//     const slots = [];
//     const workEndMs = new Date(rangeEnd).getTime();
//     const nowMs = Date.now();
//     let cursor = new Date(rangeStart).getTime();

//     while (cursor + durationMinutes * 60_000 <= workEndMs) {
//       const end = cursor + durationMinutes * 60_000;
//       const conflicts = busyRanges.some((b) => cursor < b.end && end > b.start);
//       if (cursor > nowMs && !conflicts) {
//         const startIso = new Date(cursor).toISOString();
//         const endIso = addMinutes(startIso, durationMinutes);
//         slots.push({
//           start: startIso,
//           end: endIso,
//           label: new Intl.DateTimeFormat("en-IN", {
//             timeZone: timezone, weekday: "short", month: "short", day: "numeric"
//           }).format(new Date(startIso))
//         });
//       }
//       cursor += interval * 60_000;
//     }

//     return NextResponse.json({ date, timezone, slots });
//   } catch (error) {
//     const message = error instanceof Error ? error.message : "Availability lookup failed";
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

// const timeSchema = z
//   .string()
//   .regex(
//     /^(?:[01]\d|2[0-3]):[0-5]\d$/,
//     "Time must be in HH:mm format.",
//   );

// const schema = z.object({
//   date: z.string().refine(isValidDateString, "Date must be YYYY-MM-DD."),
//   durationMinutes: z.number().int().min(15).max(180),
//   preferredStartTime: timeSchema.nullable().optional(),
//   preferredEndTime: timeSchema.nullable().optional(),
// });

// export async function POST(request: Request) {
//   try {
//     const parsed = schema.safeParse(await request.json());

//     if (!parsed.success) {
//       return NextResponse.json(
//         {
//           error:
//             parsed.error.issues[0]?.message || "Invalid request.",
//         },
//         { status: 400 },
//       );
//     }

//     const {
//       date,
//       durationMinutes,
//       preferredStartTime,
//       preferredEndTime,
//     } = parsed.data;

//     // Both preference times must be supplied together.
//     if (
//       Boolean(preferredStartTime) !== Boolean(preferredEndTime)
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "Provide both preferredStartTime and preferredEndTime.",
//         },
//         { status: 400 },
//       );
//     }

//     if (
//       preferredStartTime &&
//       preferredEndTime &&
//       preferredStartTime >= preferredEndTime
//     ) {
//       return NextResponse.json(
//         {
//           error: "Preferred end time must be later than start time.",
//         },
//         { status: 400 },
//       );
//     }

//     const timezone = getTimeZone();

//     const workStart = process.env.WORKDAY_START || "09:00";
//     const workEnd = process.env.WORKDAY_END || "17:00";

//     const interval = Math.max(
//       15,
//       Number(process.env.SLOT_INTERVAL_MINUTES || 30),
//     );

//     // Start/end of the working day in the configured timezone.
//     const rangeStart = localDateTimeToIso(
//       date,
//       workStart,
//       timezone,
//     );

//     const rangeEnd = localDateTimeToIso(
//       date,
//       workEnd,
//       timezone,
//     );

//     const workStartMs = new Date(rangeStart).getTime();
//     const workEndMs = new Date(rangeEnd).getTime();

//     if (
//       !Number.isFinite(workStartMs) ||
//       !Number.isFinite(workEndMs) ||
//       workStartMs >= workEndMs
//     ) {
//       return NextResponse.json(
//         { error: "Invalid working-day time configuration." },
//         { status: 400 },
//       );
//     }

//     // Convert preferred local times to actual instants.
//     // If no preference was supplied, use the whole workday.
//     const preferredStartIso = localDateTimeToIso(
//       date,
//       preferredStartTime || workStart,
//       timezone,
//     );

//     const preferredEndIso = localDateTimeToIso(
//       date,
//       preferredEndTime || workEnd,
//       timezone,
//     );

//     const preferredStartMs = Math.max(
//       workStartMs,
//       new Date(preferredStartIso).getTime(),
//     );

//     const preferredEndMs = Math.min(
//       workEndMs,
//       new Date(preferredEndIso).getTime(),
//     );

//     if (
//       !Number.isFinite(preferredStartMs) ||
//       !Number.isFinite(preferredEndMs)
//     ) {
//       return NextResponse.json(
//         { error: "Unable to interpret the preferred time." },
//         { status: 400 },
//       );
//     }

//     if (preferredStartMs >= preferredEndMs) {
//       return NextResponse.json({
//         date,
//         timezone,
//         preferredStartTime: preferredStartTime ?? null,
//         preferredEndTime: preferredEndTime ?? null,
//         slots: [],
//       });
//     }

//     const calendar = await getCalendarClient();

//     // Check calendar conflicts for the whole working day.
//     const response = await calendar.freebusy.query({
//       requestBody: {
//         timeMin: rangeStart,
//         timeMax: rangeEnd,
//         timeZone: timezone,
//         items: [{ id: "primary" }],
//       },
//     });

//     const busy = response.data.calendars?.primary?.busy || [];

//     const busyRanges = busy
//       .map((item) => ({
//         start: new Date(item.start || "").getTime(),
//         end: new Date(item.end || "").getTime(),
//       }))
//       .filter(
//         (item) =>
//           Number.isFinite(item.start) &&
//           Number.isFinite(item.end) &&
//           item.start < item.end,
//       );

//     const slots: {
//       start: string;
//       end: string;
//       label: string;
//     }[] = [];

//     const nowMs = Date.now();
//     const durationMs = durationMinutes * 60_000;
//     const intervalMs = interval * 60_000;

//     // Start at the later of the workday start and preferred start.
//     // Each complete meeting must fit inside the preferred window.
//     let cursor = preferredStartMs;

//     while (cursor + durationMs <= preferredEndMs) {
//       const end = cursor + durationMs;

//       const conflicts = busyRanges.some(
//         (busyRange) =>
//           cursor < busyRange.end && end > busyRange.start,
//       );

//       // Exclude past times and events that overlap calendar bookings.
//       if (cursor > nowMs && !conflicts) {
//         const startIso = new Date(cursor).toISOString();
//         const endIso = addMinutes(startIso, durationMinutes);

//         slots.push({
//           start: startIso,
//           end: endIso,
//           label: new Intl.DateTimeFormat("en-IN", {
//             timeZone: timezone,
//             weekday: "short",
//             month: "short",
//             day: "numeric",
//           }).format(new Date(startIso)),
//         });
//       }

//       cursor += intervalMs;
//     }

//     return NextResponse.json({
//       date,
//       timezone,
//       preferredStartTime: preferredStartTime ?? null,
//       preferredEndTime: preferredEndTime ?? null,
//       slots,
//     });
//   } catch (error) {
//     console.error("Availability lookup failed:", error);

//     const message =
//       error instanceof Error
//         ? error.message
//         : "Availability lookup failed";

//     const status = message.includes("not connected") ? 401 : 502;

//     return NextResponse.json({ error: message }, { status });
//   }
// }




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

const timeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format.");

const schema = z.object({
  date: z.string().refine(isValidDateString, "Date must be YYYY-MM-DD."),
  durationMinutes: z.number().int().min(15).max(180),
  preferredStartTime: timeSchema.nullable().optional(),
  preferredEndTime: timeSchema.nullable().optional(),
});

function timeInZone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request." },
        { status: 400 },
      );
    }

    const {
      date,
      durationMinutes,
      preferredStartTime,
      preferredEndTime,
    } = parsed.data;

    if (Boolean(preferredStartTime) !== Boolean(preferredEndTime)) {
      return NextResponse.json(
        { error: "Provide both preferredStartTime and preferredEndTime." },
        { status: 400 },
      );
    }

    if (
      preferredStartTime &&
      preferredEndTime &&
      preferredStartTime >= preferredEndTime
    ) {
      return NextResponse.json(
        { error: "Preferred end time must be later than start time." },
        { status: 400 },
      );
    }

    const timezone = getTimeZone();
    const workStart = process.env.WORKDAY_START || "09:00";
    const workEnd = process.env.WORKDAY_END || "17:00";
    const interval = Math.max(
      15,
      Number(process.env.SLOT_INTERVAL_MINUTES || 30),
    );

    if (
      !timeSchema.safeParse(workStart).success ||
      !timeSchema.safeParse(workEnd).success ||
      !Number.isFinite(interval)
    ) {
      return NextResponse.json(
        { error: "Invalid working-day configuration." },
        { status: 500 },
      );
    }

    const rangeStart = localDateTimeToIso(date, workStart, timezone);
    const rangeEnd = localDateTimeToIso(date, workEnd, timezone);

    const workStartMs = new Date(rangeStart).getTime();
    const workEndMs = new Date(rangeEnd).getTime();

    if (
      !Number.isFinite(workStartMs) ||
      !Number.isFinite(workEndMs) ||
      workStartMs >= workEndMs
    ) {
      return NextResponse.json(
        { error: "Invalid working-day time configuration." },
        { status: 400 },
      );
    }

    const preferredStartIso = localDateTimeToIso(
      date,
      preferredStartTime || workStart,
      timezone,
    );

    const preferredEndIso = localDateTimeToIso(
      date,
      preferredEndTime || workEnd,
      timezone,
    );

    const preferredStartMs = Math.max(
      workStartMs,
      new Date(preferredStartIso).getTime(),
    );

    const preferredEndMs = Math.min(
      workEndMs,
      new Date(preferredEndIso).getTime(),
    );

    if (
      !Number.isFinite(preferredStartMs) ||
      !Number.isFinite(preferredEndMs)
    ) {
      return NextResponse.json(
        { error: "Unable to interpret the preferred time." },
        { status: 400 },
      );
    }

    if (preferredStartMs >= preferredEndMs) {
      return NextResponse.json({
        date,
        timezone,
        preferredStartTime: preferredStartTime ?? null,
        preferredEndTime: preferredEndTime ?? null,
        slots: [],
      });
    }

    const calendar = await getCalendarClient();

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: rangeStart,
        timeMax: rangeEnd,
        timeZone: timezone,
        items: [{ id: "primary" }],
      },
    });

    const busy = response.data.calendars?.primary?.busy || [];

    const busyRanges = busy
      .map((item) => ({
        start: new Date(item.start || "").getTime(),
        end: new Date(item.end || "").getTime(),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.start) &&
          Number.isFinite(item.end) &&
          item.start < item.end,
      );

    const slots: {
      start: string;
      end: string;
      startTime: string;
      endTime: string;
      label: string;
    }[] = [];

    const nowMs = Date.now();
    const durationMs = durationMinutes * 60_000;
    const intervalMs = interval * 60_000;

    for (
      let cursor = preferredStartMs;
      cursor + durationMs <= preferredEndMs;
      cursor += intervalMs
    ) {
      const end = cursor + durationMs;

      const conflicts = busyRanges.some(
        (busyRange) => cursor < busyRange.end && end > busyRange.start,
      );

      if (cursor > nowMs && !conflicts) {
        const startIso = new Date(cursor).toISOString();
        const endIso = addMinutes(startIso, durationMinutes);

        slots.push({
          start: startIso,
          end: endIso,
          startTime: timeInZone(startIso, timezone),
          endTime: timeInZone(endIso, timezone),
          label: new Intl.DateTimeFormat("en-IN", {
            timeZone: timezone,
            weekday: "short",
            month: "short",
            day: "numeric",
          }).format(new Date(startIso)),
        });
      }
    }

    return NextResponse.json({
      date,
      timezone,
      preferredStartTime: preferredStartTime ?? null,
      preferredEndTime: preferredEndTime ?? null,
      slots,
    });
  } catch (error) {
    console.error("Availability lookup failed:", error);

    const message =
      error instanceof Error ? error.message : "Availability lookup failed";

    const status = message.toLowerCase().includes("not connected") ? 401 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
