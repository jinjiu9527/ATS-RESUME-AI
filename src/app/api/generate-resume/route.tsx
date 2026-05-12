import { NextResponse } from "next/server";

/**
 * resumeai - API Route Handler
 * 功能：接收简历表单数据，调用 DeepSeek API 进行职业化润色
 */

export async function POST(req: Request) {
  try {
    // 1. 获取前端传来的数据
    const body = await req.json();
    const { 
      fullName, 
      targetPosition, 
      summary, 
      experience, 
      projects, 
      skills, 
      education,
      jobDescription 
    } = body;

    // 2. 校验 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DeepSeek API Key is not configured in environment variables." },
        { status: 500 }
      );
    }

  // 3. 构建专业 Prompt
// 策略：赋予 AI 双重身份（ATS 扫描器 + 顶级简历专家），并强制输出严格的 JSON 格式

const systemPrompt = `CRITICAL LANGUAGE REQUIREMENT: 
All user input (including Chinese or other languages) must be translated into professional, native-sounding North American English. Every single field in the final JSON output—especially 'optimizedMarkdown', 'missingKeywords', 'suggestions', and 'recruiterInsight'—MUST be 100% in English.
You are a world-class Technical Recruiter, ATS (Applicant Tracking System) Algorithm Expert, and Executive Resume Writer. 
Your goal is to analyze the user's raw experience against a specific Job Description, optimize their resume using the STAR method, and return a strict JSON response.
IMPORTANT FORMATTING RULE:
In the "optimizedMarkdown" field, do NOT use any Markdown syntax.
Do not use **, ##, *, _, or any other Markdown characters.
Use plain text only. Use the • character for bullet points.
Separate job titles and companies with | character.
Separate dates with – character.`;


const userPrompt = `
Please deeply analyze the provided resume information against the Target Job Description and optimize it.

### USER DATA:
- Full Name: ${fullName}
- Target Position: ${targetPosition}
- Professional Summary: ${summary}
- Work Experience: ${experience}
- Skills: ${skills}
- Education: ${education}
- Target Job Description: ${jobDescription || "N/A (Optimize for general industry standards if empty)"}

### TASKS:
1. ATS Analysis: Compare the user's data against the Target Job Description. Calculate a realistic ATS match score (0-100), identify missing keywords, and provide actionable optimization suggestions.
2. Resume Optimization: Rewrite the resume to maximize ATS compatibility. Use Professional Business English. Use the STAR method (Situation, Task, Action, Result) for experience bullets. Focus on quantifiable metrics (e.g., "increased revenue by $2M").

### STRICT OUTPUT FORMAT:
You MUST respond with a valid, parsable JSON object. DO NOT wrap the JSON in Markdown formatting (do not use \`\`\`json). Return ONLY the raw JSON string.

The JSON MUST exactly match this schema:
{
  "score": number,
  "missingKeywords": string[],
  "suggestions": string[],
  "recruiterInsight": string,
  "optimizedSummary": string, // 2-3 sentence summary ONLY, no other sections
  "optimizedExperience": string, // work history ONLY, no summary/skills/education
  "optimizedSkills": string, // comma separated skills ONLY
  "optimizedEducation": string // education ONLY, no other sections
}

CRITICAL: Each field contains ONLY its own section. Never mix content between fields.

### OPTIMIZED MARKDOWN STRUCTURE REQUIRED IN THE JSON:
# [Name]
[Target Position]

## PROFESSIONAL SUMMARY
(A powerful 3-4 line paragraph)

## PROFESSIONAL EXPERIENCE
(Chronological order, bold company names, italicize roles, STAR bullet points)

## CORE COMPETENCIES
(Categorized technical and soft skills)

## EDUCATION
(School name, Degree, Year)
`;

    // 4. 调用 DeepSeek API
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7, // 保持专业性的同时具有一定的表达灵活性
        max_tokens: 2000,
      }),
    });

    // 5. 处理响应
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to call DeepSeek API" },
        { status: response.status }
      );
    }

    // --- 替换 1000011509.jpg 中 // 6. 返回结果 的部分 ---

const result = await response.json();
const resultText = result.choices[0].message.content;

try {
  // 1. 将 AI 返回的 JSON 字符串解析为对象
  // 使用之前建议的正则处理，防止 AI 自作聪明加了 ```json
  const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsedData = JSON.parse(cleanJson);
  
  // 2. 返回解析后的结构化数据
  return NextResponse.json({
    success: true,
    data: parsedData // 现在的 data 包含了 score, missingKeywords, optimizedMarkdown 等
  });

} catch (parseError) {
  console.error("AI JSON 解析失败，原始文本为:", resultText);
  return NextResponse.json({ 
    success: false, 
    error: "AI response format error",
    raw: resultText 
  }, { status: 500 });
}

  } catch (error: any) {
    console.error("GENERATE_RESUME_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}