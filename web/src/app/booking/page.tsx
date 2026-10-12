
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

type Driver = {
  id: string;
  name: string;
  experience: string;
  rating: string;
  hourlyRate: number;
  dailyRate: number;
  initials: string;
};

type BookingResponse = {
  booking?: {
    reference?: string;
    total?: number;
    status?: string;
  };
  message?: string;
};

function BookingContent() {
  const params = useSearchParams();
  const router = useRouter();

  const driverId = params.get("driverId")?.trim() || "";
  const pickup = params.get("pickup") || "";
  const requestedType = params.get("type") || "hourly";

  const type = ["daily", "full-day"].includes(requestedType)
    ? "daily"
    : "hourly";

  const date = params.get("date") || "";
  const time = params.get("time") || "";

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [duration, setDuration] = useState(type === "hourly" ? "2" : "1");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [savedTotal, setSavedTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDrivers() {
      try {
        const response = await fetch("http://localhost:4000/api/drivers", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not fetch drivers.");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The API did not return a valid driver list.");
        }

        const validDrivers: Driver[] = data
          .filter(
            (item: unknown): item is Record<string, unknown> =>
              typeof item === "object" &&
              item !== null &&
              "id" in item &&
              "name" in item
          )
          .map((item) => ({
            id: String(item.id),
            name: String(item.name),
            experience: String(item.experience ?? ""),
            rating: String(item.rating ?? ""),
            hourlyRate: Number(item.hourlyRate) || 0,
            dailyRate: Number(item.dailyRate) || 0,
            initials: String(item.initials ?? ""),
          }));

        if (validDrivers.length === 0) {
          throw new Error("No usable drivers were returned by the API.");
        }

        if (!cancelled) {
          setDrivers(validDrivers);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? `${err.message} Make sure your backend is running at http://localhost:4000.`
              : "Could not connect to the DriveMate API."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDrivers();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedDriverId = driverId.replace(/^driver-/i, "").trim();

  const driver = drivers.find(
    (item) =>
      item.id.replace(/^driver-/i, "").trim() === normalizedDriverId
  );

  const rate = driver
    ? type === "hourly"
      ? driver.hourlyRate
      : driver.dailyRate
    : 0;

  const numericDuration = Number(duration) || 0;
  const total = rate * numericDuration;

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (submitting) return;

    if (!driver) {
      setError("Please select a driver from the Find Drivers page.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!pickup.trim() || !date || !time) {
      setError(
        "Trip details are incomplete. Return to the homepage and select your pickup, date, and time."
      );
      return;
    }

    const start = new Date(`${date}T${time}`);

    if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
      setError("Your booking date and time must be in the future.");
      return;
    }

    const allowedDurations =
      type === "hourly"
        ? [2, 3, 4, 5, 6, 8, 10, 12]
        : [1, 2, 3, 4, 5, 6, 7];

    if (
      rate <= 0 ||
      !Number.isInteger(numericDuration) ||
      !allowedDurations.includes(numericDuration)
    ) {
      setError("Please select a valid booking duration.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("drivemate_token");

      if (!token) {
        const returnTo = `/booking?${params.toString()}`;
        router.push(`/login?next=${encodeURIComponent(returnTo)}`);
        return;
      }

      const response = await fetch("http://localhost:4000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: phone.trim(),
          driverId: driver.id,
          pickup: pickup.trim(),
          type,
          date,
          time,
          duration: numericDuration,
        }),
      });

      const data: BookingResponse = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("drivemate_token");
        localStorage.removeItem("drivemate_user");

        const returnTo = `/booking?${params.toString()}`;
        router.push(`/login?next=${encodeURIComponent(returnTo)}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not save your booking.");
      }

      if (!data.booking?.reference) {
        throw new Error(
          "The server did not return a booking reference. Check your backend response."
        );
      }

      setReference(data.booking.reference);
      setSavedTotal(
        typeof data.booking.total === "number"
          ? data.booking.total
          : total
      );
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the DriveMate API."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9f6] p-8 text-[#17251f]">
        <p>Loading booking details...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#faf9f6] p-8 text-[#17251f]">
        <h1 className="text-2xl font-semibold">Unable to load booking</h1>
        <p className="mt-3 text-gray-600">{loadError}</p>
        <Link
          href="/drivers"
          className="mt-5 inline-block text-emerald-800 underline"
        >
          Browse drivers
        </Link>
      </main>
    );
  }

  if (!driver) {
    return (
      <main className="min-h-screen bg-[#faf9f6] px-6 py-16 text-[#17251f]">
        <section className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-white p-8 text-center">
          <h1 className="text-3xl font-semibold">Select a driver first</h1>
          <p className="mt-4 leading-7 text-gray-600">
            To make a booking, choose a driver from our available drivers list.
            Your selected driver and trip details will then be carried into
            the booking form.
          </p>
          <Link
            href="/drivers"
            className="mt-6 inline-block rounded-xl bg-emerald-800 px-6 py-3 font-semibold text-white hover:bg-emerald-900"
          >
            Find a Driver
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            If you arrived here from a driver profile, return to that profile
            and select its booking option.
          </p>
        </section>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#faf9f6] px-6 py-16 text-[#17251f]">
        <section className="mx-auto max-w-xl rounded-3xl border border-black/10 bg-white p-8 text-center md:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-800">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-semibold">
            Booking request saved!
          </h1>

          <p className="mt-3 leading-7 text-gray-600">
            Your booking request has been saved to the DriveMate database.
            No driver has been notified, and your reservation is not yet
            confirmed.
          </p>

          <div className="mt-6 rounded-xl bg-[#e8eee7] p-5 text-left">
            <p className="text-sm text-gray-500">Booking reference</p>
            <p className="mt-1 break-all text-xl font-semibold">{reference}</p>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>Driver: {driver.name}</p>
              <p>Pickup: {pickup}</p>
              <p>
                Date and time: {date} at {time}
              </p>
              <p>
                Duration: {numericDuration}{" "}
                {type === "hourly" ? "hours" : "days"}
              </p>
              <p>
                Estimated total: ₹
                {(savedTotal ?? total).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <Link
            href="/my-bookings"
            className="mt-6 block rounded-xl bg-emerald-800 px-5 py-4 font-semibold text-white transition hover:bg-emerald-900"
          >
            View My Bookings
          </Link>

          <Link
            href="/"
            className="mt-3 block rounded-xl border border-black/10 px-5 py-4 font-semibold hover:bg-gray-50"
          >
            Back to homepage
          </Link>
        </section>
      </main>
    );
  }

  const profileUrl = `/drivers/${driver.id}?${new URLSearchParams({
    pickup,
    type: type === "daily" ? "full-day" : "hourly",
    date,
    time,
  }).toString()}`;

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#17251f]">
      <div className="flex items-center justify-between border-b border-black/10 px-6 py-5 md:px-16">
        <Link href="/" className="text-2xl font-bold">
          drive<span className="text-emerald-700">mate.</span>
        </Link>

        <Link href={profileUrl} className="text-sm hover:text-emerald-800">
          ← Back to profile
        </Link>
      </div>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-12 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-800">
            FINAL STEP
          </p>

          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Review your booking
          </h1>

          <p className="mt-3 text-gray-600">
            Enter your contact details to save your booking request.
          </p>

          <form
            onSubmit={submitBooking}
            className="mt-8 space-y-5 rounded-2xl border border-black/10 bg-white p-6"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Mobile number
              </span>
              <input
                required
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, ""))
                }
                placeholder="10-digit Indian mobile number"
                className="w-full rounded-xl border border-black/10 px-4 py-3 outline-none focus:border-emerald-700"
              />
            </label>

            <div>
              <label
                htmlFor="duration"
                className="mb-2 block text-sm font-medium"
              >
                {type === "hourly" ? "Number of hours" : "Number of days"}
              </label>

              <select
                id="duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3"
              >
                {(type === "hourly"
                  ? [2, 3, 4, 5, 6, 8, 10, 12]
                  : [1, 2, 3, 4, 5, 6, 7]
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}{" "}
                    {type === "hourly"
                      ? "hours"
                      : value === 1
                        ? "day"
                        : "days"}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-800 px-5 py-4 font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving booking..." : "Confirm booking request →"}
            </button>

            <p className="text-xs leading-5 text-gray-500">
              Your booking request will be saved to the DriveMate database.
              This demo does not notify a driver or confirm a real reservation.
            </p>
          </form>
        </div>

        <aside className="h-fit rounded-2xl bg-[#e8eee7] p-6">
          <h2 className="text-xl font-semibold">Trip summary</h2>

          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-gray-500">Selected driver</p>
              <p className="mt-1 font-medium">{driver.name}</p>
            </div>

            <div>
              <p className="text-gray-500">Pickup location</p>
              <p className="mt-1 font-medium">{pickup || "Not selected"}</p>
            </div>

            <div>
              <p className="text-gray-500">Date and start time</p>
              <p className="mt-1 font-medium">
                {date || "Not selected"} · {time || "Not selected"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Booking type</p>
              <p className="mt-1 font-medium">
                {type === "hourly" ? "By the hour" : "Full day"}
              </p>
            </div>

            <div className="border-t border-black/10 pt-4">
              <p className="text-gray-500">Rate</p>
              <p className="mt-1 font-medium">
                ₹{rate.toLocaleString("en-IN")} /{" "}
                {type === "hourly" ? "hour" : "day"}
              </p>
            </div>

            <div className="border-t border-black/10 pt-4">
              <p className="text-gray-500">Estimated total</p>
              <p className="mt-1 text-3xl font-semibold">
                ₹{total.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Estimate only. Taxes, extra hours and final pricing are not
                implemented.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#faf9f6] p-8 text-[#17251f]">
          Loading booking page...
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
