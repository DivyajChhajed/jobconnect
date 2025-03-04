"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import NavigationBar from "@/components/NavigationBar";
import Link from "next/link";

const employmentTypes = [
  "Full-Time",
  "Part-Time",
  "Internship",
  "Contract",
  "Temporary",
  "Freelance",
];

export default function ScrapeJobsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobLocation: "",
    employmentType: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.jobTitle ||
      !formData.jobLocation ||
      !formData.employmentType
    ) {
      setError("Please fill out all fields.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      // Placeholder for scraping logic (e.g., call an API)
      console.log("Scraping jobs with:", formData);
      // Example: You could call an API here and redirect to a results page
      // router.push("/job-results"); // Uncomment and adjust once implemented
    } catch (err: any) {
      setError(err.message || "Failed to scrape jobs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6 text-center">
          Scrape Jobs
        </h1>

        <Card className="bg-gray-800 border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
          <CardHeader className="border-b border-gray-700 pb-2">
            <CardTitle className="text-gray-100 text-lg text-center">
              Find Your Next Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Title/Name */}
              <div>
                <label
                  htmlFor="jobTitle"
                  className="text-sm font-semibold text-gray-400 block mb-1"
                >
                  Job Title/Name
                </label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  placeholder="e.g., Software Engineer"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                />
              </div>

              {/* Job Location */}
              <div>
                <label
                  htmlFor="jobLocation"
                  className="text-sm font-semibold text-gray-400 block mb-1"
                >
                  Job Location
                </label>
                <Input
                  id="jobLocation"
                  name="jobLocation"
                  type="text"
                  value={formData.jobLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., New York, NY"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                />
              </div>

              {/* Employment Type */}
              <div>
                <label
                  htmlFor="employmentType"
                  className="text-sm font-semibold text-gray-400 block mb-1"
                >
                  Employment Type
                </label>
                <select
                  id="employmentType"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                >
                  <option value="" disabled>
                    Select Employment Type
                  </option>
                  {employmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-900/50 border-red-700 text-red-200"
                >
                  <div>{error}</div>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-cyan-600 text-white font-semibold py-2 rounded-md transition-all duration-300 ease-in-out transform hover:bg-cyan-700 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40 disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Scraping...
                  </span>
                ) : (
                  "Scrape Jobs"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-cyan-400 hover:underline">
            Back to Home
          </Link>
          <span className="mx-2 text-gray-500">|</span>
          <Link href="/jobconnect" className="text-cyan-400 hover:underline">
            Go to JobConnect
          </Link>
        </div>
      </div>
    </div>
  );
}
