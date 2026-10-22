# Booking System — Data Model

## Overview

The booking system uses Firebase Firestore and consists of four core collections:

- `BookableResource` — Resources that can be booked, such as barbers or padel courts.
- `Availability` — Recurring weekly availability for each resource.
- `Booking` — Customer reservations.
- `AvailabilityException` — Holidays, time off, and temporary blocks.

## 1. BookableResource

Represents a resource that can be booked.

```ts
type BookableResource = {
  id: string;
  name: string;
  type: "BARBER" | "PADEL_COURT";
  active: boolean;
};
```

## 2. Availability

Defines the recurring weekly schedule of a resource.

```ts
type Availability = {
  id: string;
  resourceId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
};
```

Each document represents an availability interval for a specific day of the week.

## 3. Booking

Represents a customer's reservation.

```ts
type Booking = {
  id: string;
  resourceId: string;
  customerId: string;
  startAt: string; // ISO 8601 datetime
  endAt: string;   // ISO 8601 datetime
  durationMinutes: number;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
};
```

The reservation duration depends on the booking type or selected service. For example, a haircut may take 60 minutes, while a padel court reservation may last 90 minutes.

## 4. AvailabilityException

Represents exceptional periods when a resource is unavailable.

```ts
type AvailabilityException = {
  id: string;
  resourceId: string;
  startAt: string; // ISO 8601 datetime
  endAt: string;   // ISO 8601 datetime
  reason: "HOLIDAY" | "TIME_OFF" | "BLOCKED";
  createdAt: string;
};
```

Examples include holidays, personal time off, and temporary booking blocks.

## Availability Rules

A time slot can be booked only when:

1. It falls within the resource's recurring availability.
2. It does not overlap with an availability exception.
3. It does not overlap with another active booking for the same resource.
4. The resource is active and the requested booking duration is valid.

Overlapping bookings must be prevented by server-side validation, not solely by frontend checks.

## Relationships

- `Availability.resourceId` references `BookableResource.id`.
- `Booking.resourceId` references `BookableResource.id`.
- `AvailabilityException.resourceId` references `BookableResource.id`.
- `Booking.customerId` identifies the customer who made the reservation.

## Implementation Notes

- Store dates using Firestore timestamps or consistently formatted ISO 8601 datetimes with an explicit timezone.
- Define the business's timezone when calculating availability.
- Keep `endAt` consistent with `startAt` and `durationMinutes`.
- Treat cancelled bookings as non-blocking.
- Consider adding a `Service` collection if different services have different durations or prices.
- Configure and test Firestore Security Rules to prevent unauthorized access and modifications.

## Date-first booking UI integration

The UI keeps presentation and Firestore access in separate layers:

- `src/pages/BookingPage.tsx` coordinates the booking flow.
- `src/components/` contains the calendar and barber-selection views.
- `src/services/resourceService.ts` reads and validates bookable resources.
- `src/services/availabilityService.ts` checks date-specific exceptions for
  each resource.
- `src/services/timeSlotService.ts` checks one-hour appointment intervals
  against `AvailabilityException` records.
- `src/lib/firebase.ts` initializes Firebase; shared booking types live in
  `src/types/booking.ts`.

The collection names and fields are based on this document; the app does not
create substitute resource or exception data.
Configure
The default business timezone is `Europe/Lisbon`. Override it with
`VITE_BUSINESS_TIME_ZONE` in a root-level `.env.local` file (see
`.env.example`) and restart the Vite dev server. Only a valid exception whose
`resourceId` matches the resource and whose interval overlaps the selected
date in the business timezone blocks that barber. Invalid exception records
are ignored with a warning. If the configured timezone is invalid, the app
falls back to UTC date boundaries and displays a warning.
The booking horizon is not defined, so the calendar does not impose an invented
maximum date. The calendar uses the business timezone to determine today and
prevent selecting past dates.

The UI uses `BookableResource.name` when present; resources without a name are
shown with an `Unnamed barber (<document ID>)` label. For the current
barber-only booking flow, missing `type` defaults to `BARBER` and missing
`active` defaults to `true`; explicit non-`BARBER` types and `active: false`
are excluded. A resource with no
`AvailabilityException` record matching its ID is shown as selectable. A
resource with a matching exception is hidden only when that interval overlaps
the selected date; exceptions for other dates do not block it. Exception
documents retain the confirmed string fields `startAt`, `endAt`, `resourceId`,
and `reason`; `startAt` and `endAt` must be canonical UTC ISO 8601 strings in
`YYYY-MM-DDTHH:mm:ss.sssZ` format. `reason` does not change blocking behavior.
Malformed exception data is ignored with a warning; records with no usable
`resourceId` are not treated as global closures. The `Availability` collection
is not used for this exception-only barber selection check.

The browser needs read access under the deployed Firestore Security Rules.
The time list shows 09:00 through 19:00 one-hour start times (the last slot
ends at 20:00), and disables hours blocked by matching exceptions. Existing
bookings are not queried because that would expose customer details to the
browser. Times are therefore unconfirmed requests, and the contact form is
presentational only: it does not save customer information or create a
booking. Do not grant unrestricted Firestore access; use a trusted backend and
restrictive rules before enabling booking submission.
