# Firestore Data Model

## Overview

The current Firestore export contains:

- `BusinessShop` — the shop name.
- `BusinessHours` — opening/closing times and closed weekdays.
- `BookableResource` — bookable barbers.
- `Booking` — reservation records.
- `AvailabilityException` — resource unavailability blocks.

These descriptions reflect fields present in the export, not a guarantee that
every document contains every field. Some documents are incomplete or
inconsistent.

## Collections

### `BusinessShop`

The export contains a document with a `name` (`Ring Barber Shop`).

```ts
type BusinessShop = {
  name: string;
};
```

### `BusinessHours`

The export contains closed weekdays (`0` = Sunday through `6` = Saturday),
opening/closing times, and a `businessShopId`.

```ts
type BusinessHours = {
  closedDays: number[];
  openingTime: string; // e.g. "09:00"
  closingTime: string; // e.g. "20:00"
  businessShopId: string;
};
```

The current exported record has Sunday and Monday in `closedDays`.

### `BookableResource`

The export contains `name` and `BusinessId` on all three resources. `type` and
`active` are not present in these exported records.

```ts
type BookableResource = {
  id: string; // Firestore document ID
  name: string;
  BusinessId?: string;
  // `type` and `active` are not currently present in the export.
};
```

The app defaults missing `type` to `BARBER` and missing `active` to `true`.

### `Booking`

The exported booking has `resourceId`, `durationMinutes`, `BusinessId`, and
`customerName`, but those values are empty strings in the current sample. It
does not contain `startAt` or `endAt`.

```ts
type Booking = {
  id: string; // Firestore document ID
  resourceId: string;
  durationMinutes: string | number;
  BusinessId?: string;
  customerName: string;
  // startAt, endAt, status, and contact fields are absent from this sample.
};
```

This sample is not sufficient to represent a schedulable reservation. Populate
valid time fields before relying on the backoffice calendar or using bookings
to block customer-facing slots.

### `AvailabilityException`

The exported exception contains the four expected fields plus `BusinessId`.
The four expected fields are empty strings in the current sample.

```ts
type AvailabilityException = {
  startAt: string;
  endAt: string;
  reason: string;
  resourceId: string;
  BusinessId?: string;
};
```

The application expects a usable resource ID and canonical UTC ISO 8601
timestamps for interval checks; empty values do not describe a valid block.
The rules require the four exception fields above and permit an optional
`BusinessId`. If supplied, it must identify an existing `BusinessShop` and
match the referenced resource's `BusinessId`. Existing exported records may
retain this field; the current app creates exceptions without it.

The checked-in rules allow public reads of shop, hours, resources, and
exceptions for the customer availability UI. Writes to these collections are
admin-only. Booking reads and writes are admin-only because customer booking
submission is not enabled yet. These rules do not make incomplete records
valid; fill in real business hours and exception intervals before relying on
availability behavior.

## Availability Rules

A time slot can be booked only when:

1. It falls within `BusinessHours`.
2. It does not overlap with an availability exception.
3. It does not overlap with another active booking for the same resource.
4. The resource is bookable and the requested booking duration is valid.

Overlapping bookings must be prevented by server-side validation, not solely by frontend checks.

## Relationships

- `BusinessHours.businessShopId` references `BusinessShop.id`.
- `Booking.resourceId` references `BookableResource.id`.
- `AvailabilityException.resourceId` references `BookableResource.id`.
- `BusinessId` on resources, bookings, and exceptions refers to the
  `BusinessShop` document. `BusinessHours` refers to that same document using
  the differently named `businessShopId` field.

## Implementation Notes

- Store reservation and exception dates using Firestore timestamps or
  consistently formatted ISO 8601 datetimes with an explicit timezone.
- Define the business's timezone when calculating availability.
- Keep `endAt` consistent with `startAt` and `durationMinutes`.
- Treat cancelled bookings as non-blocking.
- Configure and test Firestore Security Rules to prevent unauthorized access and modifications.

## Firestore Security Rules

The Firebase CLI is configured to deploy `firestore.rules` to the default
project (`barbershopbooking-ff17d`). After installing and authenticating with
the Firebase CLI, deploy the rules with:

```sh
firebase deploy --only firestore:rules
```

This deploys the rules to Firebase; adding or changing the local rules file
does not update the live project until the command succeeds. Review the rules
before deploying because deployment replaces the project's active Firestore
rules.

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

## Staff backoffice

Open `/backoffice` and sign in with an existing Firebase Authentication
email/password account. The account must have the Firebase custom claim
`admin: true`; authenticated users without that claim are denied. Assign this
claim only from a trusted Admin SDK environment after verifying the staff
identity, never from browser code. Deploy the restrictive rules in
`firestore.rules` (or apply the same rules in Firebase Console): they permit
public reads only for barber resources and exception intervals, admin-only
access to reservations, and admin-only exception management. Avoid the prior
catch-all public read/write rule: reservations contain customer contact
information.

The backoffice displays `Booking` records using the documented `resourceId`,
`startAt`, `endAt`, `status`, and available customer fields. It creates and
removes `AvailabilityException` records using only the existing four string
fields: `resourceId`, `startAt`, `endAt`, and `reason`. Date/time inputs are
interpreted in the configured business timezone and stored as canonical UTC
ISO strings.

Create staff accounts in Firebase Authentication, then grant the admin claim
from a trusted Admin SDK environment (never from client code). For example,
after initializing the Admin SDK and verifying the staff UID:

```ts
const user = await getAuth().getUser(uid)
await getAuth().setCustomUserClaims(uid, {
  ...user.customClaims,
  admin: true,
})
```

The staff member must sign in again after claims change. Deploy the rules from
`firestore.rules` in Firestore Console or with the Firebase CLI before opening
the backoffice. Do not restore public `read, write: if true` rules: reservation
documents contain private customer contact information.
