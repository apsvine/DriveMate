"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Driver = {
  id: string;
  name: string;
  experience: string;
  rating: string;
  hourlyRate: number;
  dailyRate: number;
  initials: string;
};

export default function DriversPage() {
  const params = useSearchParams();

  const pickup = params.get("pickup") || "Pune";
  const type = params.get("type") || "hourly";
  const date = params.get("date") || "";
  const time = params.get("time") || "";

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDrivers() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:4000/api/drivers",
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(
            `Backend returned HTTP ${response.status}`
          );
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The backend returned an unexpected response.");
        }

        const validDrivers = data.filter(
          (item): item is Driver =>
            item !== null &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.name === "string"
        );

        if (!cancelled) {
          setDrivers(validDrivers);
        }
      } catch (err) {
        console.error("Driver fetch failed:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? `Could not load drivers: ${err.message}`
              : "Could not load drivers. Please check the backend connection."
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

  const formattedDate = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not selected";

  const bookingType =
    type === "daily" || type === "full-day" ? "daily" : "hourly";

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#17251f]">
      <nav className="flex items-center justify-between border-b border-black/10 px-6 py-5 md:px-16">
        <Link href="/" className="text-2xl font-bold">
          drive<span className="text-emerald-700">mate.</span>
        </Link>

        <Link href="/" className="text-sm hover:text-emerald-800">
          ← Edit search
        </Link>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-800">
          DRIVER SEARCH
        </p>

        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
          Drivers for your journey
        </h1>

        <p className="mt-4 text-gray-600">
          Pickup: {pickup} ·{" "}
          {bookingType === "hourly" ? "By the hour" : "Full day"} ·{" "}
          {formattedDate} · {time || "Time not selected"}
        </p>

        <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Demo profiles only. Driver availability and verification have not
          been connected yet.
        </div>

        {loading && (
          <p className="mt-8 text-gray-600">Loading drivers...</p>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg border border-red-300 px-4 py-2 font-medium hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && drivers.length === 0 && (
          <p className="mt-8 text-gray-600">
            No drivers were returned by the backend.
          </p>
        )}

        {!loading && !error && drivers.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {drivers.map((driver) => {
              const rate =
                bookingType === "hourly"
                  ? Number(driver.hourlyRate)
                  : Number(driver.dailyRate);

              return (
                <article
                  key={driver.id}
                  className="rounded-2xl border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8eee7] text-lg font-semibold text-emerald-900">
                    {driver.initials ||
                      driver.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                  </div>

                  <h2 className="mt-5 text-xl font-semibold">
                    {driver.name}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    {driver.experience || "Experience not listed"}
                  </p>

                  <p className="mt-4 text-sm text-amber-600">
                    ★ {driver.rating || "N/A"}{" "}
                    <span className="text-gray-500">demo rating</span>
                  </p>

                  <div className="mt-5 border-t border-black/10 pt-5">
                    <p className="text-sm text-gray-500">
                      {bookingType === "hourly"
                        ? "Hourly rate"
                        : "Full-day rate"}
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      ₹
                      {Number.isFinite(rate)
                        ? rate.toLocaleString("en-IN")
                        : "N/A"}
                      <span className="text-sm font-normal text-gray-500">
                        {bookingType === "hourly" ? " / hour" : " / day"}
                      </span>
                    </p>
                  </div>

                  <Link
                    href={`/drivers/${encodeURIComponent(
                      driver.id
                    )}?pickup=${encodeURIComponent(
                      pickup
                    )}&type=${encodeURIComponent(
                      bookingType === "daily" ? "full-day" : "hourly"
                    )}&date=${encodeURIComponent(
                      date
                    )}&time=${encodeURIComponent(time)}`}
                    className="mt-5 block w-full rounded-xl border border-emerald-800 px-4 py-3 text-center font-medium text-emerald-900 transition hover:bg-emerald-50"
                  >
                    View profile →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}