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

