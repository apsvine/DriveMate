
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

type Driver = {
  id: string;
  name: string;
  experience: string;
  rating: string;
  hourlyRate: number;
  dailyRate: number;
  initials: string;
};

export default function DriverProfilePage() {
  const params = useParams<{ driverId: string }>();
  const search = useSearchParams();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pickup = search.get("pickup") || "Pune";
  const type = search.get("type") || "hourly";
  const date = search.get("date") || "";
  const time = search.get("time") || "";

  useEffect(() => {
    async function fetchDriver() {
      try {
        const response = await fetch(
          "http://localhost:4000/api/drivers"
        );

        if (!response.ok) {
          throw new Error("Unable to load drivers.");
        }

        const drivers: Driver[] = await response.json();

        const selectedDriver = drivers.find(
          (item) => item.id === params.driverId
        );

        if (!selectedDriver) {
          setError("Driver not found.");
          return;
        }

        setDriver(selectedDriver);
      } catch {
        setError(
          "Could not load this driver. Please check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDriver();
  }, [params.driverId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9f6] p-10 text-[#17251f]">
        Loading driver profile...
      </main>
    );
  }

  if (error || !driver) {
    return (
      <main className="min-h-screen bg-[#faf9f6] p-10 text-[#17251f]">
        <h1 className="text-3xl font-semibold">
          {error || "Driver not found"}
        </h1>
        <Link
          className="mt-5 inline-block text-emerald-800 underline"
          href="/drivers"
        >
          Back to drivers
        </Link>
      </main>
    );
  }

  const rate = type === "hourly" ? driver.hourlyRate : driver.dailyRate;

  const bookingQuery = new URLSearchParams({
  pickup,
  type,
  date,
  time,
  driverId: driver.id,
}).toString();

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#17251f]">
      <nav className="flex items-center justify-between border-b border-black/10 px-6 py-5 md:px-16">
        <Link href="/" className="text-2xl font-bold">
          drive<span className="text-emerald-700">mate.</span>
        </Link>

        <Link
          href={`/drivers?${bookingQuery}`}
          className="text-sm hover:text-emerald-800"
        >
          ← Back to results
        </Link>
      </nav>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-7 md:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#e8eee7] text-3xl font-semibold text-emerald-900">
              {driver.initials}
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-800">
                DRIVER PROFILE · DEMO
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {driver.name}
              </h1>
              <p className="mt-2 text-gray-600">{driver.experience}</p>
              <p className="mt-2 text-amber-600">
                ★ {driver.rating}{" "}
                <span className="text-gray-500">sample rating</span>
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            Demonstration profile only. Driver identity, licence, reviews,
            and availability have not been verified.
          </div>

          <h2 className="mt-8 text-xl font-semibold">About this profile</h2>
          <p className="mt-3 leading-7 text-gray-600">
            This is a sample DriveMate driver profile. Driver details must be
            verified before the marketplace launches.
          </p>

          <div className="mt-8 rounded-2xl bg-[#e8eee7] p-6">
            <p className="text-sm text-gray-600">
              {type === "hourly" ? "Hourly rate" : "Full-day rate"}
            </p>
            <p className="mt-2 text-3xl font-semibold">
              ₹{rate}
              <span className="text-base font-normal text-gray-600">
                {type === "hourly" ? " / hour" : " / day"}
              </span>
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Pickup: {pickup}
              {date ? ` · Date: ${date}` : ""}
              {time ? ` · Start: ${time}` : ""}
            </p>
          </div>

          <Link
            href={`/booking?${bookingQuery}`}
            className="mt-6 block w-full rounded-xl bg-emerald-800 px-5 py-4 text-center font-semibold text-white transition hover:bg-emerald-900"
          >
            Select this driver →
          </Link>
        </div>
      </section>
    </main>
  );
}
