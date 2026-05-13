import { checkAndIncrementUsage } from '../../actions/userActions';
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

export async function GET(req: NextRequest) {
  // --- 新增：PDF 导出次数校验 ---
  try {
    await checkAndIncrementUsage('pdf');
  } catch (error: any) {
    // 如果校验失败，直接返回错误信息给前端，不执行后面的浏览器逻辑
    return new Response(error.message, { status: 403 });
  }
  // -------------------------
  const { searchParams } = new URL(req.url);

  // 从 query 参数接收简历数据（由前端拼接后传入）
  const name        = searchParams.get("name")        || "Resume";
  const title       = searchParams.get("title")       || "";
  const email       = searchParams.get("email")       || "";
  const phone       = searchParams.get("phone")       || "";
  const location    = searchParams.get("location")    || "";
  const summary     = searchParams.get("summary")     || "";
  const experience  = searchParams.get("experience")  || "";
  const skills      = searchParams.get("skills")      || "";
  const education   = searchParams.get("education")   || "";

  // 将 skills 格式化为圆点分隔
  const skillsList = skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" • ");

  // 构建用于打印的 HTML（内联样式，确保 Puppeteer 渲染一致）
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Georgia", serif;
      color: #111;
      background: #fff;
      padding: 0.6in;
      font-size: 11px;
      line-height: 1.55;
    }
    /* ---- Header ---- */
    .header {
      text-align: center;
      border-bottom: 1.5px solid #111;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .header h1 {
      font-size: 26px;
      font-family: "Georgia", serif;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 4px;
    }
    .header .contact {
      font-family: Arial, sans-serif;
      font-size: 10px;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .header .contact span + span::before {
      content: " | ";
      color: #999;
    }
    /* ---- Sections ---- */
    .section { margin-bottom: 14px;
               page-break-inside: avoid; }
    .section h3 {
      font-family: Arial, sans-serif;
      font-size: 10.5px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #111;
      border-bottom: 1px solid #ccc;
      padding-bottom: 3px;
      margin-bottom: 6px;
    }
    .section p,
    .section .content {
      font-size: 11px;
      color: #222;
      white-space: pre-wrap;
      text-align: justify;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <h1>${escapeHtml(name)}</h1>
    <div class="contact">
      ${location  ? `<span>${escapeHtml(location)}</span>`  : ""}
      ${phone     ? `<span>${escapeHtml(phone)}</span>`     : ""}
      ${email     ? `<span>${escapeHtml(email)}</span>`     : ""}
    </div>
  </div>

  <!-- Professional Summary -->
  ${summary ? `
  <div class="section">
    <h3>Professional Summary</h3>
    <p>${escapeHtml(stripMarkdown(summary))}</p>
  </div>` : ""}

  <!-- Experience -->
  ${experience ? `
  <div class="section">
    <h3>Experience</h3>
    <div class="content">${escapeHtml(stripMarkdown(experience))}</div>
  </div>` : ""}

  <!-- Core Competencies -->
  ${skillsList ? `
  <div class="section">
    <h3>Core Competencies</h3>
    <p>${escapeHtml(stripMarkdown(skillsList))}</p>
  </div>` : ""}

  <!-- Education -->
  ${education ? `
  <div class="section">
    <h3>Education</h3>
    <div class="content">${escapeHtml(stripMarkdown(education))}</div>
  </div>` : ""}

</body>
</html>
`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
  waitUntil: ["load"]
});

       const pdfUint8 = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: {top: "0",right: "0",bottom: "0",left: "0"},
       });
       const pdfBuffer = Buffer.from(pdfUint8);
     

    await browser.close();

    const filename = `${name.replace(/\s+/g, "_")}_Resume.pdf`;

    // 推荐写法
   return new NextResponse(pdfBuffer, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
  },
});

  } catch (err) {
    console.error("Puppeteer PDF error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
const stripMarkdown = (str: string) =>
  str
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`(.*?)`/g, "$1");



// 防止 XSS 注入到 HTML 模板
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}