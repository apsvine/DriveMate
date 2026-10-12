
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import User from "./models/User.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Authenticated request type
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Verify customer JWT
function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      message: "Authentication is not configured.",
    });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);

    if (
      typeof payload === "string" ||
      typeof payload.userId !== "string"
    ) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({
      message: "Your session is invalid or expired. Please log in again.",
    });
  }
}

// Demo driver data
const drivers = [
  {
    id: "driver-1",
    name: "Rahul Sharma",
    experience: "8 years of driving experience",
    rating: "4.9",
    hourlyRate: 199,
    dailyRate: 1499,
    initials: "RS",
  },
  {
    id: "driver-2",
    name: "Amit Patil",
    experience: "6 years of driving experience",
    rating: "4.8",
    hourlyRate: 179,
    dailyRate: 1399,
    initials: "AP",
  },
  {
    id: "driver-3",
    name: "Sandeep More",
    experience: "10 years of driving experience",
    rating: "5.0",
    hourlyRate: 249,
    dailyRate: 1799,
    initials: "SM",
  },
];

interface IBooking {
  reference: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  phone: string;
  driverId: string;
  driverName: string;
  pickup: string;
  type: "hourly" | "daily";
  date: string;
  time: string;
  duration: number;
  total: number;
  status: string;
}

// Booking database schema
const bookingSchema = new mongoose.Schema<IBooking>(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    driverId: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    pickup: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["hourly", "daily"],
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

const Booking: mongoose.Model<IBooking> =
  (mongoose.models.Booking as mongoose.Model<IBooking> | undefined) ??
  mongoose.model<IBooking>("Booking", bookingSchema);

// API home
app.get("/", (_req, res) => {
  res.json({
    message: "DriveMate API is running!",
  });
});

// Health checks
function healthCheck(_req: Request, res: Response) {
  res.json({
    status: "ok",
    service: "DriveMate API",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
}

app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

// Get all demo drivers
app.get("/api/drivers", (_req, res) => {
  res.json(drivers);
});

// Register a customer
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message:
          "Provide a name, valid email, and password between 8 and 128 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Could not create your account. Please try again.",
    });
  }
});

// Customer login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is missing.");

      return res.status(500).json({
        message: "Authentication is not configured.",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      jwtSecret,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Could not log in. Please try again.",
    });
  }
});

// Get the logged-in customer's bookings
app.get(
  "/api/bookings",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          message: "Please log in to continue.",
        });
      }

      const bookings = await Booking.find({
        customerId: new mongoose.Types.ObjectId(req.userId),
      })
        .select("-phone -customerId -__v")
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ bookings });
    } catch (error) {
      console.error("Get customer bookings error:", error);

      return res.status(500).json({
        message: "Could not retrieve your bookings.",
      });
    }
  }
);

// Find a booking by reference, for its owner only
app.get(
  "/api/bookings/:reference",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          message: "Please log in to continue.",
        });
      }

      const referenceParam = req.params.reference;

      if (typeof referenceParam !== "string" || !referenceParam.trim()) {
        return res.status(400).json({
          message: "Booking reference is required.",
        });
      }

      const reference = referenceParam.trim().toUpperCase();

      const booking = await Booking.findOne({
        reference,
        customerId: new mongoose.Types.ObjectId(req.userId),
      })
        .select("-phone -customerId -__v")
        .lean();

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found.",
        });
      }

      return res.json({ booking });
    } catch (error) {
      console.error("Find booking error:", error);

      return res.status(500).json({
        message: "Could not retrieve the booking.",
      });
    }
  }
);

// Create a booking for the logged-in customer
app.post(
  "/api/bookings",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        phone,
        driverId,
        pickup,
        type,
        date,
        time,
        duration,
      } = req.body ?? {};

      if (
        typeof phone !== "string" ||
        !phone.trim() ||
        typeof pickup !== "string" ||
        !pickup.trim() ||
        !driverId ||
        typeof date !== "string" ||
        !date.trim() ||
        typeof time !== "string" ||
        !time.trim() ||
        duration === undefined ||
        duration === null
      ) {
        return res.status(400).json({
          message: "Please provide all required booking details.",
        });
      }

      const normalizedType =
        type === "full-day" ? "daily" : type;

      if (normalizedType !== "hourly" && normalizedType !== "daily") {
        return res.status(400).json({
          message: "Booking type must be hourly or daily.",
        });
      }

      const selectedDriver = drivers.find(
        (driver) =>
          driver.id === String(driverId) ||
          driver.id === `driver-${driverId}`
      );

      if (!selectedDriver) {
        return res.status(404).json({
          message: "Driver not found.",
        });
      }

      const bookingDuration = Number(duration);

      if (
        !Number.isInteger(bookingDuration) ||
        bookingDuration < 1 ||
        bookingDuration > 24
      ) {
        return res.status(400).json({
          message: "Duration must be a whole number between 1 and 24.",
        });
      }

      if (!req.userId) {
        return res.status(401).json({
          message: "Please log in to continue.",
        });
      }

      const customer = await User.findById(req.userId);

      if (!customer) {
        return res.status(401).json({
          message: "Customer account not found. Please log in again.",
        });
      }

      const rate =
        normalizedType === "hourly"
          ? selectedDriver.hourlyRate
          : selectedDriver.dailyRate;

      const total = rate * bookingDuration;

      const reference = `DM-${randomUUID()
        .replace(/-/g, "")
        .slice(0, 10)
        .toUpperCase()}`;

      const booking = await Booking.create({
        reference,
        customerId: customer._id,
        customerName: customer.name,
        phone: phone.trim(),
        driverId: selectedDriver.id,
        driverName: selectedDriver.name,
        pickup: pickup.trim(),
        type: normalizedType,
        date: date.trim(),
        time: time.trim(),
        duration: bookingDuration,
        total,
      });

      return res.status(201).json({
        message: "Booking request saved successfully.",
        booking: {
          id: booking._id,
          reference: booking.reference,
          driverName: booking.driverName,
          total: booking.total,
          status: booking.status,
        },
      });
    } catch (error) {
      console.error("Booking error:", error);

      return res.status(500).json({
        message: "Could not save the booking. Please try again.",
      });
    }
  }
);

// Start server after MongoDB connects
async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI is missing from the api/.env file."
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET is missing from the api/.env file."
      );
    }

    await mongoose.connect(mongoUri);

    console.log("Connected to MongoDB Atlas!");

    app.listen(PORT, () => {
      console.log(
        `DriveMate API running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start DriveMate API:", error);
    process.exit(1);
  }
}

startServer();
