import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Resend } from "resend";

const resendApiKey = defineSecret("RESEND_API_KEY");

const sendEmail = async (to: string, subject: string, text: string, idempotencyKey: string) => {
  const resend = new Resend(resendApiKey.value());
  const result = await resend.emails.send(
    {
      from: "Simple Booking <noreply@simplebooking.pt>",
      to: [to],
      subject,
      text,
    },
    { idempotencyKey },
  );

  if (result.error) {
    logger.error("Could not send email.", result.error);
    throw new Error(result.error.message);
  }
}

export const sendBookingEmail = onDocumentCreated(
  {
    document: "Booking/{bookingId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    const booking = event.data?.data();
    const customerEmail = booking?.customerEmail;
    const resourceEmail = booking?.resourceEmail;
    const customerName = typeof booking?.customerName === "string" ? booking.customerName : "A customer";
    const appointmentTime = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Lisbon",
    }).format(new Date(booking?.startAt));

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof customerEmail === "string" && emailPattern.test(customerEmail.trim())) {
      await sendEmail(
        customerEmail.trim().toLowerCase(),
        "Your booking is confirmed",
        `Hello ${customerName},\n\nYour booking is confirmed for ${appointmentTime}.\n\nWe look forward to seeing you.`,
        `booking-${event.id}-customer`,
      );
    } else {
      logger.warn("Created booking has no valid customer email.", {
        bookingId: event.params.bookingId,
      });
    }

    if (typeof resourceEmail === "string" && emailPattern.test(resourceEmail.trim())) {
      const customerContact = [
        typeof booking?.customerEmail === "string" ? `Email: ${booking.customerEmail}` : null,
        typeof booking?.customerPhone === "string" ? `Phone: ${booking.customerPhone}` : null,
      ].filter((contact): contact is string => contact !== null).join("\n");
      await sendEmail(
        resourceEmail.trim().toLowerCase(),
        "New booking received",
        `Hello ${customerName},\n\nA new booking is scheduled for ${appointmentTime}.\n${customerContact}`,
        `booking-${event.id}-resource`,
      );
    } else {
      logger.warn("Created booking has no valid resource email.", {
        bookingId: event.params.bookingId,
      });
    }
  },
);
