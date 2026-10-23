import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Resend } from "resend";

const resendApiKey = defineSecret("RESEND_API_KEY");

export const sendBookingEmail = onDocumentCreated(
  {
    document: "Booking/{bookingId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    const booking = event.data?.data();
    const customerEmail = booking?.customerEmail;

    if (
      typeof customerEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
    ) {
      logger.warn("Created booking has no valid customer email.", {
        bookingId: event.params.bookingId,
      });
      return;
    }

    const resend = new Resend(resendApiKey.value());
    const appointmentTime = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Lisbon",
    }).format(new Date(booking?.startAt));
    const result = await resend.emails.send(
      {
        from: "Simple Booking <noreply@simplebooking.pt>",
        to: [customerEmail.trim().toLowerCase()],
        subject: "Your booking is confirmed",
        text: `Hello ${booking?.customerName || "there"},\n\nYour booking is confirmed for ${appointmentTime}.\n\nWe look forward to seeing you.`,
      },
      { idempotencyKey: `booking-${event.id}` },
    );

    if (result.error) {
      logger.error("Could not send booking email.", result.error);
      throw new Error(result.error.message);
    }
  },
);
