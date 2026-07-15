import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import Tour from "../models/Tour";

dotenv.config();

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not defined");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // --- Demo User ---
    const existingUser = await User.findOne({ email: "demo@trailnest.com" });
    let demoUser = existingUser;
    if (!existingUser) {
      demoUser = await User.create({
        name: "Demo Traveler",
        email: "demo@trailnest.com",
        password: "demo12345",
        role: "user",
        provider: "credentials",
      });
      console.log("✅ Demo user created: demo@trailnest.com / demo12345");
    } else {
      console.log("ℹ️ Demo user already exists");
    }

    // --- Demo Admin ---
    const existingAdmin = await User.findOne({ email: "admin@trailnest.com" });
    if (!existingAdmin) {
      await User.create({
        name: "TrailNest Admin",
        email: "admin@trailnest.com",
        password: "admin12345",
        role: "admin",
        provider: "credentials",
      });
      console.log("✅ Demo admin created: admin@trailnest.com / admin12345");
    } else {
      console.log("ℹ️ Demo admin already exists");
    }

    // --- Sample Tours (only if none exist) ---
    const tourCount = await Tour.countDocuments();
    if (tourCount === 0 && demoUser) {
      await Tour.insertMany([
        {
          title: "Sunrise Trek in the Swiss Alps",
          shortDescription:
            "A breathtaking guided hike through alpine trails at dawn.",
          fullDescription:
            "Join our expert guides for a 3-day trek through the Swiss Alps, starting before sunrise to catch the best light over the mountains. Includes accommodation, meals, and all safety equipment.",
          price: 450,
          duration: "3 Days 2 Nights",
          departureDate: new Date("2026-09-15"),
          location: "Interlaken, Switzerland",
          category: "Hiking",
          images: [
            "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
          ],
          maxGuests: 12,
          organizer: demoUser._id,
        },
        {
          title: "Kyoto Temples & Tea Ceremony",
          shortDescription:
            "Explore ancient shrines and learn the art of tea ceremony.",
          fullDescription:
            "A full cultural immersion day covering Kyoto's most iconic temples, a traditional tea ceremony with a certified tea master, and a walk through the historic Gion district.",
          price: 180,
          duration: "1 Day",
          departureDate: new Date("2026-10-02"),
          location: "Kyoto, Japan",
          category: "Cultural",
          images: [
            "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800",
            "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800",
          ],
          maxGuests: 15,
          organizer: demoUser._id,
        },
        {
          title: "Bali Beach & Sunset Cruise",
          shortDescription:
            "Relax on pristine beaches and sail into the sunset.",
          fullDescription:
            "A relaxing beach getaway with a sunset catamaran cruise, snorkeling stop, and dinner on the water. Perfect for a laid-back tropical escape.",
          price: 220,
          duration: "2 Days 1 Night",
          departureDate: new Date("2026-08-20"),
          location: "Bali, Indonesia",
          category: "Beach",
          images: [
            "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
            "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800",
          ],
          maxGuests: 10,
          organizer: demoUser._id,
        },
        {
          title: "Patagonia Wildlife Safari",
          shortDescription:
            "Spot condors, guanacos, and pumas in their natural habitat.",
          fullDescription:
            "A guided wildlife-focused trek through Torres del Paine National Park, with expert naturalists and prime spotting locations for Patagonian wildlife.",
          price: 620,
          duration: "5 Days 4 Nights",
          departureDate: new Date("2026-11-10"),
          location: "Patagonia, Chile",
          category: "Wildlife",
          images: [
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
            "https://images.unsplash.com/photo-1478827387698-1527781a4887?w=800",
          ],
          maxGuests: 8,
          organizer: demoUser._id,
        },
      ]);
      console.log("✅ Sample tours seeded");
    } else {
      console.log("ℹ️ Tours already exist, skipping sample data");
    }

    console.log("🎉 Seeding complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seed();
