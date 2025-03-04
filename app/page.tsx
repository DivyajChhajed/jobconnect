"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs"; // Client-side Clerk hook
import { Button } from "@/components/ui/button";
import Link from "next/link";
import NavigationBar from "@/components/NavigationBar"; // Import your NavigationBar

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth(); // Clerk hook to check auth status

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push("/jobconnect"); // Redirect to JobConnect if signed in
    } else {
      router.push("/sign-in"); // Redirect to sign-in if not signed in
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      {/* Navigation Bar at the top */}
      <NavigationBar />

      {/* Main Landing Content */}
      <div className="flex items-center justify-center p-4 md:p-6 h-[calc(100vh-80px)]">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-4">
            Welcome to JobConnect
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-6">
            Connect talent with opportunities effortlessly. Upload resumes,
            scrape job postings, and send tailored cold emails—all in one place.
          </p>
          <Button
            onClick={handleGetStarted}
            className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-md transition-all duration-300 ease-in-out transform hover:bg-cyan-700 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40"
            disabled={!isLoaded} // Disable until auth status is loaded
          >
            Get Started
          </Button>
          <div className="mt-8">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-cyan-400 hover:underline">
                Sign In
              </Link>
            </p>
            <p className="text-gray-400 mt-2">
              New here?{" "}
              <Link href="/sign-up" className="text-cyan-400 hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
