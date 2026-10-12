
"use client";

import { useState } from "react";

type Booking = {
  reference: string;
  customerName: string;
  driverId: string;
  driverName: string;
  pickup: string;
  type: "hourly" | "daily";
  date: string;
  time: string;
  duration: number;
  total: number;
  status: string;
};

export default function MyBookingsPage() {
  const [reference, setReference] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function findBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBooking(null);
    setError("");

    const cleanReference = reference.trim().toUpperCase();

    if (!cleanReference) {
      setError("Please enter your booking reference.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:4000/api/bookings/${encodeURIComponent(cleanReference)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not find your booking.");
      }

      setBooking(data.booking);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-12 text-gray-900">
      <div className="mx-auto max-w-2xl">
        <a href="/" className="text-sm font-medium text-blue-700">
          ← Back to Home
        </a>

        <div className="mb-8 mt-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            DriveMate
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            My Bookings
          </h1>
          <p className="mt-3 text-gray-600">
            Enter your booking reference to check your reservation details.
          </p>
        </div>

        <form
          onSubmit={findBooking}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <label
            htmlFor="reference"
            className="mb-2 block text-sm font-semibold"
          >
            Booking reference
          </label>

          <input
            id="reference"
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. DM-049A7E9292"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Searching..." : "Find My Booking"}
          </button>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </form>

        {booking && (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-5">
              <div>
                <p className="text-sm text-gray-500">Booking reference</p>
                <h2 className="mt-1 text-xl font-bold">
                  {booking.reference}
                </h2>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold capitalize text-amber-800">
                {booking.status}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 py-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Driver</p>
                <p className="mt-1 font-semibold">{booking.driverName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Pickup location</p>
                <p className="mt-1 font-semibold">{booking.pickup}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="mt-1 font-semibold">{booking.date}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Pickup time</p>
                <p className="mt-1 font-semibold">{booking.time}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Booking type</p>
                <p className="mt-1 font-semibold capitalize">
                  {booking.type === "daily" ? "Full day" : "Hourly"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  {booking.type === "daily" ? "Days" : "Hours"}
                </p>
                <p className="mt-1 font-semibold">{booking.duration}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-5">
              <span className="font-medium text-gray-600">
                Estimated total
              </span>
              <span className="text-2xl font-bold">
                ₹{booking.total.toLocaleString("en-IN")}
              </span>
            </div>

            <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              Your booking is a request, not a confirmed reservation. The
              driver has not necessarily been notified.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
