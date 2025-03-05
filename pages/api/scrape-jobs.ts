import type { NextApiRequest, NextApiResponse } from "next";
import FirecrawlApp from "@mendable/firecrawl-js";
import createClient from "groq";
import fs from "fs";
import path from "path";
import os from "os";
import { createObjectCsvWriter } from "csv-writer";

// Initialize Firecrawl and Groq with API keys from environment variables
const firecrawlApp = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});
const groq = createClient(process.env.GROQ_API_KEY);

// Define the job data structure
interface JobData {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  salary: string | null;
  jobType: string;
  applicationLink: string;
}

// Job portal configurations
const jobPortals = {
  indeed: {
    baseUrl: "https://www.indeed.com/jobs",
    employmentTypeMap: {
      "Full-Time": "fulltime",
      "Part-Time": "parttime",
      Internship: "internship",
      Contract: "contract",
      Temporary: "temporary",
      Freelance: "",
    },
    buildUrl: (
      jobTitle: string,
      jobLocation: string,
      employmentType: string
    ) => {
      const typeParam =
        jobPortals.indeed.employmentTypeMap[employmentType] || "";
      return `${jobPortals.indeed.baseUrl}?q=${encodeURIComponent(
        jobTitle
      )}&l=${encodeURIComponent(jobLocation)}${
        typeParam ? `&jt=${typeParam}` : ""
      }`;
    },
  },
  glassdoor: {
    baseUrl: "https://www.glassdoor.com/Job/jobs.htm",
    employmentTypeMap: {
      "Full-Time": "FULL_TIME",
      "Part-Time": "PART_TIME",
      Internship: "INTERNSHIP",
      Contract: "CONTRACT",
      Temporary: "TEMPORARY",
      Freelance: "",
    },
    buildUrl: (
      jobTitle: string,
      jobLocation: string,
      employmentType: string
    ) => {
      const typeParam =
        jobPortals.glassdoor.employmentTypeMap[employmentType] || "";
      return `${jobPortals.glassdoor.baseUrl}?keyword=${encodeURIComponent(
        jobTitle
      )}&location=${encodeURIComponent(jobLocation)}${
        typeParam ? `&jobType=${typeParam}` : ""
      }`;
    },
  },
  naukri: {
    baseUrl: "https://www.naukri.com/jobsearch",
    employmentTypeMap: {
      "Full-Time": "full-time",
      "Part-Time": "part-time",
      Internship: "internship",
      Contract: "contract",
      Temporary: "temporary",
      Freelance: "freelance",
    },
    buildUrl: (
      jobTitle: string,
      jobLocation: string,
      employmentType: string
    ) => {
      const typeParam =
        jobPortals.naukri.employmentTypeMap[employmentType] || "";
      return `${jobPortals.naukri.baseUrl}?k=${encodeURIComponent(
        jobTitle
      )}&l=${encodeURIComponent(jobLocation)}${
        typeParam ? `&jt=${typeParam}` : ""
      }`;
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobTitle, jobLocation, employmentType, portal = "indeed" } = req.body;

  if (!jobTitle || !jobLocation || !employmentType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const selectedPortal =
    jobPortals[portal as keyof typeof jobPortals] || jobPortals.indeed;
  const jobTypeCode = selectedPortal.employmentTypeMap[employmentType];
  if (!jobTypeCode && employmentType !== "Freelance") {
    return res
      .status(400)
      .json({ error: `Invalid employment type for ${portal}` });
  }

  try {
    const searchUrl = selectedPortal.buildUrl(
      jobTitle,
      jobLocation,
      employmentType
    );
    console.log(`Attempting to scrape URL: ${searchUrl} from ${portal}`);

    // Scrape raw HTML using Firecrawl
    const scrapeResult = await firecrawlApp.scrapeUrl(searchUrl, {
      formats: ["html"],
      pageOptions: {
        useProxies: true,
        waitFor: 5000, // Wait for dynamic content
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!scrapeResult.success || !scrapeResult.data.html) {
      const errorDetails = {
        statusCode: scrapeResult.statusCode || 500,
        errorMessage: scrapeResult.error || "Unknown error",
        details: scrapeResult.details || "No additional details provided",
      };
      console.error(`Firecrawl failed to scrape ${portal}:`, errorDetails);

      if (scrapeResult.statusCode === 403) {
        return res.status(503).json({
          error: `Access to ${portal} was blocked (403 Forbidden)`,
          details: `${portal} may have detected scraping. Try adjusting headers or proxies.`,
        });
      } else if (scrapeResult.statusCode === 429) {
        return res.status(429).json({
          error: "Too many requests (429)",
          details: "Rate limit exceeded. Please try again later.",
        });
      } else {
        return res.status(500).json({
          error: "Scraping failed",
          details: `${errorDetails.errorMessage} (Status: ${errorDetails.statusCode})`,
        });
      }
    }

    const htmlContent = scrapeResult.data.html;
    console.log(`Scraped HTML length: ${htmlContent.length} characters`);

    // Pass HTML to Groq for job extraction
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192", // Groq model with 8192 token limit
      messages: [
        {
          role: "system",
          content:
            "You are an expert at extracting structured data from HTML content. Extract job listings from the provided HTML of a job search page. Return a JSON array of objects, each containing: companyName (string), jobTitle (string), jobDescription (string), salary (string or null), jobType (string), applicationLink (string). If a field is missing, use an empty string or null as appropriate.",
        },
        {
          role: "user",
          content: `Here is the HTML content from a job search page:\n\n${htmlContent}\n\nExtract the job listings and return them as a JSON array.`,
        },
      ],
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const groqResponse = JSON.parse(completion.choices[0].message.content);
    const jobs: JobData[] = groqResponse.jobs || [];
    console.log(`Extracted ${jobs.length} jobs via Groq`);

    if (jobs.length === 0) {
      console.warn(`No jobs extracted from ${portal} via Groq`);
      return res.status(200).json({
        message: `No jobs found for the given criteria on ${portal}`,
      });
    }

    const csvFileName = `jobs_${portal}_${Date.now()}.csv`;
    const csvFilePath = path.join(os.tmpdir(), csvFileName);

    const csvWriterInstance = createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: "companyName", title: "Company Name" },
        { id: "jobTitle", title: "Job Title" },
        { id: "jobDescription", title: "Job Description" },
        { id: "salary", title: "Salary" },
        { id: "jobType", title: "Job Type" },
        { id: "applicationLink", title: "Application Link" },
      ],
    });
    await csvWriterInstance.writeRecords(jobs);

    const fileStream = fs.createReadStream(csvFilePath);
    res.setHeader("Content-Disposition", `attachment; filename=${csvFileName}`);
    res.setHeader("Content-Type", "text/csv");
    fileStream.pipe(res);

    res.on("finish", () => {
      fs.unlinkSync(csvFilePath);
      console.log(`CSV file ${csvFileName} sent and deleted`);
    });
  } catch (error: any) {
    console.error(`Unexpected error during job scraping from ${portal}:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Internal server error",
      details: error.message || "An unexpected error occurred",
    });
  }
}
