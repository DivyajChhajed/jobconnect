import { NextApiRequest, NextApiResponse } from "next";
import { Groq } from "groq-sdk"; // Import Groq SDK

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Initialize Groq client
  const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY, // Use your Groq API key from environment variables
  });

  console.info("Cold Email API hit");

  if (req.method !== "POST") {
    console.error("Method Not Allowed");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { resumeExtractedText, jobDescription } = req.body;

    if (!resumeExtractedText || !jobDescription) {
      console.error("Missing resume text or job description");
      return res
        .status(400)
        .json({ error: "Missing resume text or job description" });
    }

    console.debug("Extracted text received:", resumeExtractedText);
    console.debug("Job description received:", jobDescription);

    const prompt = `
    Generate a concise and professional cold email for the following job application. The email should be **highly personalized**, leveraging the most relevant skills and projects from the provided resume that align with the job description. **Avoid generic or templated responses.** Instead, craft a unique and engaging email that demonstrates genuine interest in the role.  

    ### **Guidelines:**   
    - Address the hiring manager or recruiter appropriately (Add company name only if able to find).  
    - Start with a compelling introduction mentioning the job title and company name.  
    - **Highlight 2-3 key skills or projects that directly match the job description.**  
    - If the resume does not explicitly mention a skill, **do not fabricate it**—instead, generalize similar relevant experience.  
    - Maintain a concise and engaging tone, avoiding robotic or overly formal language.  
    - End with a **strong call to action**, such as requesting a conversation or expressing interest in further discussion.  
    - Ensure **properly formatted JSON output**, escaping newline characters inside strings.  

    ---

    ### **Inputs:**  
    **Job Description:**  
    ${jobDescription}  

    **Resume:**  
    ${resumeExtractedText}  

    ---

    ### **Expected JSON Output Format**  

    Return **ONLY** valid JSON inside triple backticks, formatted for easy parsing.  
    **Do not include any additional text outside the JSON block.**  
    **Do NOT use the example below as a template.** It is only for output formatting. You can be creative. 
    \`\`\`json
    {
      "subject": "Excited to Apply for [Job Title] at [Company Name]",
      "body": "Hello [Company Name] Team,\\n\\nI came across the [Job Title] position at [Company Name] and was excited to see how well it aligns with my experience. With a background in [relevant skill] and hands-on experience in [key project], I believe I can bring value to your team.\\n\\nAt [Previous Company], I worked on [relevant achievement or project] that directly relates to this role. My expertise in [another relevant skill] makes me confident that I can contribute effectively.\\n\\nI would love the opportunity to discuss how my skills and experience align with your needs. Please let me know a convenient time for a quick chat.\\n\\nLooking forward to your response.\\n\\nBest regards,\\n[Your Name]\\n\\n[LinkedInProfileFromResume]\\n[GithubProfileFromResume]"
    }
    \`\`\`  

    ---

    ### **Important Notes:**  
    - **DO NOT copy the example structure directly; generate a uniquely tailored response.**  
    - **Use double quotes for JSON keys and values.**  
    - **Escape all newline characters inside JSON strings.**  
    - **Do not mention skills that are not in the resume. Instead, generalize related expertise if necessary.**  
    - **Do not add any Name of the Company if you were not able to find it in the Job Description, keep it generic.**
    `;

    console.debug("Prompt sent to Groq:", prompt);

    // Call Groq API
    const response = await groq.chat.completions.create({
      model: "qwen-2.5-32b", // Use a Groq-supported model like Mixtral
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Lower temperature for more deterministic output
      max_tokens: 1000, // Limit the response length
    });

    const jsonResponse = response.choices[0]?.message?.content?.trim();

    if (!jsonResponse) {
      console.error("Invalid response from Groq");
      return res.status(500).json({ error: "Invalid response from Groq" });
    }

    console.debug("Response from Groq:", jsonResponse);

    // Extract JSON from the response (if wrapped in triple backticks)
    const jsonMatch = jsonResponse.match(/```json([\s\S]*?)```/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : jsonResponse;

    console.info("Match result:", jsonText);

    try {
      // Ensure valid JSON parsing without stripping newlines
      const parsedJson = JSON.parse(jsonText);

      // Return properly formatted JSON with preserved newlines
      return res.status(200).json(parsedJson);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return res.status(500).json({ error: "Invalid JSON response" });
    }
  } catch (error) {
    console.error("Error processing cold email:", error);
    return res.status(500).json({ error: "Failed to generate cold email" });
  }
}
