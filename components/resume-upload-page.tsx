"use client";

import React, { useState } from "react";
import { Upload, FileText, Linkedin, Briefcase } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { extractTextFromPDF, askGPTForResumeMatch } from "../utils/resumeUtils";
import { askGPTForColdEmail } from "../utils/coldEmailUtils";
import { getCompanyData } from "../utils/getEmailLeads";
import Link from "next/link";

interface ExtractedData {
  company: string;
  potential_domain: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  feedback: string;
}

interface Lead {
  firstName: string;
  lastName: string;
  email: string;
}

interface Leads {
  companyName: string;
  location: string;
  emails: Lead[];
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

const ResumeUploadPage = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(
    null
  );
  const [jobUrl, setJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [parsedData, setParsedData] = useState<ExtractedData | null>(null);
  const [leads, setLeads] = useState<Leads | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) {
      setError("No file selected");
      return;
    }
    const file = files[0];
    if (
      file &&
      (file.type === "application/pdf" || file.type === "application/msword")
    ) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractTextFromPDF(arrayBuffer);
        setResumeText(text);
        setError("");
        console.log(
          " Handle File Change Called, Extracting resume text, sending to handleExtract"
        );
      } catch (error) {
        console.error("Error processing file:", error);
        setError("Failed to process resume. Please try again.");
      }
    } else {
      setError("Please upload a PDF or DOC file");
    }
  };

  const handleExtract = async (text: string, jobDescription: string) => {
    console.log("handleExtract called with:", { text, jobDescription });
    const data: ExtractedData = await askGPTForResumeMatch(
      text,
      jobDescription
    );
    console.log("Extracted Data askGPTForResumeMatch:", data);
    setParsedData(data);
    const leads: Leads = await getCompanyData(data.potential_domain);
    console.log("Leads:", leads);
    setLeads(leads);
  };

  const handleColdEmailGeneration = async (
    text: string,
    jobDescription: string
  ) => {
    console.log("handleColdEmailGeneration called with:", {
      text,
      jobDescription,
    });
    const data: GeneratedEmail = await askGPTForColdEmail(text, jobDescription);
    console.log("Generated Email:", data);
    setGeneratedEmail(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await handleExtract(resumeText, jobDescription);
      await handleColdEmailGeneration(resumeText, jobDescription);
    } catch {
      setError("Failed to generate email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openGmail = () => {
    if (!leads || !generatedEmail) return;
    const to = leads.emails.map((email) => email.email).join(",");
    const subject = encodeURIComponent(generatedEmail.subject);
    const body = encodeURIComponent(generatedEmail.body);
    const gmailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    window.open(gmailURL, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-6 font-sans">
      <div className="max-w-5xl mx-auto grid gap-6">
        {/* Top Section: Input Form */}
        <div className="">
          {/* Left Column: Resume Upload and Job Description */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-gray-800 border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
              <CardHeader className="border-b border-gray-700 pb-2">
                <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  Upload Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-10 w-10 text-cyan-400 mb-2" />
                    <span className="text-sm text-gray-400">
                      Drop your resume or click to browse
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Supports PDF, DOC formats
                    </span>
                  </label>
                  {resumeText && (
                    <div className="mt-2 text-sm text-cyan-400">
                      Resume Uploaded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
              <CardHeader className="border-b border-gray-700 pb-1">
                <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                  <Link className="text-cyan-400" href={"/"} />
                  <Linkedin className="h-5 w-5 text-cyan-400" />
                  Job URL
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Input
                  type="url"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                  placeholder="Paste the job URL here..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
              <CardHeader className="border-b border-gray-700 pb-2">
                <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                  <Linkedin className="h-5 w-5 text-cyan-400" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <textarea
                  className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none transition-all duration-200"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-900/50 border-red-700 text-red-200"
                  >
                    <div>{error}</div>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full bg-cyan-600 text-white font-semibold py-2 rounded-md transition-all duration-300 ease-in-out transform hover:bg-cyan-700 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={!resumeText || isLoading}
                  onClick={handleSubmit}
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
                      Processing...
                    </span>
                  ) : (
                    "Generate Email"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Results */}
          <div className="md:col-span-2 space-y-6 mt-7">
            {parsedData && (
              <Card className="bg-gray-800 border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
                <CardHeader className="border-b border-gray-700 pb-2">
                  <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                    <Briefcase className="h-5 w-5 text-cyan-400" />
                    Match Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400">
                        Company Name
                      </h3>
                      <p className="text-cyan-400">{parsedData.company}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400">
                        Potential Domain
                      </h3>
                      <p className="text-cyan-400">
                        {parsedData.potential_domain}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400">
                        Match Score
                      </h3>
                      <p className="text-cyan-400">{parsedData.match_score}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400">
                      Matching Skills
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {parsedData.matching_skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-cyan-900/50 text-cyan-300 rounded-md text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400">
                      Missing Skills
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {parsedData.missing_skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-red-900/50 text-red-300 rounded-md text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400">
                      Feedback
                    </h3>
                    <p className="mt-2 text-gray-300">{parsedData.feedback}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {leads && (
              <Card className="bg-gray-800 border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
                <CardHeader className="border-b border-gray-700 pb-2">
                  <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                    <Briefcase className="h-5 w-5 text-cyan-400" />
                    Leads - Hunter.io
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-gray-300">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-2 px-4 text-left text-sm font-semibold text-gray-400">
                            Company Name
                          </th>
                          <th className="py-2 px-4 text-left text-sm font-semibold text-gray-400">
                            Location
                          </th>
                          <th className="py-2 px-4 text-left text-sm font-semibold text-gray-400">
                            Emails
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 px-4">{leads.companyName}</td>
                          <td className="py-2 px-4">{leads.location}</td>
                          <td className="py-2 px-4">
                            <ul className="space-y-1">
                              {leads.emails.map((email, index) => (
                                <li key={index} className="text-cyan-400">
                                  {email.firstName} {email.lastName} -{" "}
                                  {email.email}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Section: Generated Email */}
        {generatedEmail && (
          <Card className="bg-gray-800 border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
            <CardHeader className="border-b border-gray-700 pb-2">
              <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
                <Briefcase className="h-5 w-5 text-cyan-400" />
                Generated Cold Email
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-400">
                  Subject:
                </h3>
                <p className="text-cyan-400 mt-1">{generatedEmail.subject}</p>
              </div>
              <div>
                <p className="whitespace-pre-wrap bg-gray-700 p-4 rounded-md text-gray-300">
                  {generatedEmail.body}
                </p>
              </div>
              {leads && (
                <Button
                  onClick={openGmail}
                  className="w-full bg-cyan-600 text-white font-semibold py-2 rounded-md transition-all duration-300 ease-in-out transform hover:bg-cyan-700 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40"
                >
                  Send Email
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResumeUploadPage;
