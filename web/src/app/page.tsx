
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [pickup, setPickup] = useState("");
  const [bookingType, setBookingType] = useState("hourly");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pickup.trim() || !date || !time) {
      setError("Please enter your pickup location, date and start time.");
      return;
    }

    const selectedDateTime = new Date(`${date}T${time}`);

    if (Number.isNaN(selectedDateTime.getTime()) || selectedDateTime <= new Date()) {
      setError("Please choose a future date and time.");
      return;
    }

    const params = new URLSearchParams({
      pickup: pickup.trim(),
      type: bookingType,
      date,
      time,
    });

    router.push(`/drivers?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#17251f]">
      <nav className="flex items-center justify-between border-b border-black/10 px-6 py-5 md:px-16">
        <a href="/" className="text-2xl font-bold tracking-tight">
          drive<span className="text-emerald-700">mate.</span>
        </a>

        <div className="hidden items-center gap-8 text-sm md:flex">
          <a href="#how">How it works</a>
          <a href="#booking">Find a driver</a>
          <a href="#about">About us</a>
        </div>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="rounded-full bg-[#17251f] px-5 py-3 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-16 md:py-24">
        <div>
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            Your car. Your journey. Your driver.
          </p>

          <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
            Good drivers.
            <br />
            <span className="text-emerald-800">Better journeys.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
            Book a driver to drive your own car. Whether it’s a quick city
            trip or a full day out in Pune, we make getting there easier.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>✓ Verified drivers</span>
            <span>✓ Flexible bookings</span>
            <span>✓ Your own car</span>
          </div>
        </div>

        <div id="booking" className="rounded-3xl bg-[#e8eee7] p-5 md:p-8">
          <div className="mb-6">
            <p className="text-sm text-gray-600">BOOK YOUR DRIVER</p>
            <h2 className="mt-2 text-2xl font-semibold">
              Where are you headed?
            </h2>
          </div>

          <form onSubmit={handleSearch} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Pickup location
              </span>
              <input
                required
                value={pickup}
                onChange={(event) => setPickup(event.target.value)}
                placeholder="e.g. Baner, Pune"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-emerald-700"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Booking type
              </span>
              <select
                value={bookingType}
                onChange={(event) => setBookingType(event.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3"
              >
                <option value="hourly">By the hour</option>
                <option value="full-day">Full day</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Date</span>
                <input
                  required
                  type="date"
                  min={new Date().toLocaleDateString("en-CA")}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Start time
                </span>
                <input
                  required
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-3"
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-800 px-5 py-4 font-semibold text-white transition hover:bg-emerald-900"
            >
              Explore drivers →
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            Simple booking. Reliable journeys.
          </p>
        </div>
      </section>

      <section id="how" className="bg-[#17251f] px-6 py-16 text-white md:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm uppercase tracking-widest text-emerald-300">
            THREE SIMPLE STEPS
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Getting there is easy.
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div>
              <span className="text-emerald-300">01</span>
              <h3 className="mt-3 text-xl font-semibold">Choose your trip</h3>
              <p className="mt-2 text-gray-300">
                Pick your date, time and booking duration.
              </p>
            </div>
            <div>
              <span className="text-emerald-300">02</span>
              <h3 className="mt-3 text-xl font-semibold">Find your driver</h3>
              <p className="mt-2 text-gray-300">
                Browse profiles and compare your options.
              </p>
            </div>
            <div>
              <span className="text-emerald-300">03</span>
              <h3 className="mt-3 text-xl font-semibold">Enjoy the ride</h3>
              <p className="mt-2 text-gray-300">
                Your driver drives while you enjoy the journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer id="about" className="px-6 py-8 text-center text-sm text-gray-500">
        © 2026 drivemate. · Pune, India · Your car, your journey.
      </footer>
    </main>
  );
}
