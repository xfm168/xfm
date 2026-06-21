import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `你是一位专业的风水分析大师，同时也是图像识别专家。你需要分析用户上传的房间照片。

严格按照以下JSON结构返回，字段名和类型必须完全一致：

{
  "detectedRoomType": "string（客厅/卧室/厨房/阳台/其他之一）",
  "detectedObjects": ["string"],
  "roomMatch": true,
  "mismatchReason": "string（不匹配时填写原因，匹配时填空字符串）",
  "analysisBasis": "string",
  "score": 75,
  "summary": "string",
  "issues": [
    {
      "id": "issue_1",
      "severity": "high",
      "title": "string",
      "description": "string",
      "location": "string",
      "suggestion": "string",
      "relatedObjects": ["string"]
    }
  ]
}

注意：score必须是0到100之间的整数，severity只能是high/medium/low，roomMatch必须是布尔值。`;

const RETRY_DELAYS = [2000, 5000, 10000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const result: any = { debug: {} };
  let retryCount = 0;

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "GEMINI_API_KEY 未配置",
        debug: { apiKeyExists: false }
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 1: Get available models
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    let availableModels: any[] = [];
    try {
      const modelsResp = await fetch(modelsUrl, { method: "GET" });
      const modelsText = await modelsResp.text();
      result.debug.modelsListStatus = modelsResp.status;
      result.debug.modelsListRaw = modelsText;

      if (modelsResp.ok) {
        const modelsData = JSON.parse(modelsText);
        availableModels = modelsData.models || [];
        result.debug.availableModels = availableModels.map((m: any) => ({
          name: m.name,
          displayName: m.displayName,
          supportedGenerationMethods: m.supportedGenerationMethods,
        }));
      }
    } catch (e) {
      result.debug.modelsListError = String(e);
    }

    // Step 2: Find a vision model that supports generateContent
    // Priority: models with "flash" in name, then models supporting generateContent with image support
    let selectedModel = null;
    const visionKeywords = ["flash", "pro", "vision"];

    for (const keyword of visionKeywords) {
      for (const model of availableModels) {
        const name = model.name?.toLowerCase() || "";
        const methods = model.supportedGenerationMethods || [];
        if (name.includes(keyword) && methods.includes("generateContent")) {
          selectedModel = model;
          break;
        }
      }
      if (selectedModel) break;
    }

    // Fallback: any model supporting generateContent
    if (!selectedModel) {
      selectedModel = availableModels.find((m: any) =>
        (m.supportedGenerationMethods || []).includes("generateContent")
      );
    }

    if (!selectedModel) {
      return new Response(JSON.stringify({
        error: "未找到支持 generateContent 的模型",
        debug: result.debug
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const modelName = selectedModel.name.replace("models/", "");
    result.debug.selectedModel = modelName;
    result.debug.selectedModelInfo = {
      name: selectedModel.name,
      displayName: selectedModel.displayName,
      supportedGenerationMethods: selectedModel.supportedGenerationMethods,
    };

    // Step 3: Parse request body
    const body = await req.json();
    const { image, roomType } = body;

    if (!image || !roomType) {
      return new Response(JSON.stringify({
        error: "缺少图片或空间类型参数",
        debug: result.debug
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Extract base64
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    result.debug.mimeType = mimeType;
    result.debug.base64DataLength = base64Data.length;

    // Step 4: Call Gemini with selected model (with retries)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    const requestUrl = `${endpoint}?key=${apiKey}`;

    result.debug.requestUrl = endpoint;

    const requestBody = {
      contents: [{
        parts: [
          { text: SYSTEM_PROMPT },
          { inlineData: { mimeType, data: base64Data } },
          { text: `用户选择的空间类型：${roomType}` }
        ]
      }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2000, responseMimeType: "application/json" }
    };

    let geminiResp: Response | null = null;
    let responseText = "";

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      if (attempt > 0) {
        retryCount = attempt;
        const delay = RETRY_DELAYS[attempt - 1];
        result.debug[`retry_${attempt}_delay`] = delay;
        await sleep(delay);
      }

      geminiResp = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      responseText = await geminiResp.text();
      result.debug[`httpStatus_${attempt}`] = geminiResp.status;
      result.debug[`httpStatusText_${attempt}`] = geminiResp.statusText;
      result.debug[`responseBody_${attempt}`] = responseText;

      if (geminiResp.ok) {
        break;
      }

      // If not 503, don't retry
      if (geminiResp.status !== 503) {
        break;
      }

      // If 503 and last attempt, fail
      if (attempt === RETRY_DELAYS.length) {
        break;
      }
    }

    result.debug.retryCount = retryCount;

    // If all retries failed with 503
    if (geminiResp && !geminiResp.ok && geminiResp.status === 503) {
      return new Response(JSON.stringify({
        error: "当前服务繁忙，请稍后再试",
        retryExhausted: true,
        debug: result.debug,
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!geminiResp || !geminiResp.ok) {
      result.error = `Gemini API 错误 (${geminiResp?.status})`;
      return new Response(JSON.stringify(result, null, 2), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse response
    const geminiData = JSON.parse(responseText);
    const content = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      result.error = "Gemini 返回空内容";
      result.debug.geminiData = geminiData;
      return new Response(JSON.stringify(result, null, 2), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse JSON — handle multiple formats Gemini may return
    let jsonStr = content.trim();
    // Strip markdown code fences (```json ... ``` or ``` ... ```)
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    // Try direct parse first (responseMimeType=json should give clean output)
    let analysisResult: any = null;
    try {
      analysisResult = JSON.parse(jsonStr);
    } catch {
      // Fall back: extract the first {...} block
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch {
          // Last resort: strip trailing commas before closing braces/brackets
          const sanitized = jsonMatch[0]
            .replace(/,\s*([}\]])/g, "$1");
          try {
            analysisResult = JSON.parse(sanitized);
          } catch {
            // Give up
          }
        }
      }
    }

    if (analysisResult) {
      // Ensure required fields have safe defaults so the frontend never crashes
      analysisResult.detectedRoomType = analysisResult.detectedRoomType ?? "未知";
      analysisResult.detectedObjects = Array.isArray(analysisResult.detectedObjects) ? analysisResult.detectedObjects : [];
      analysisResult.roomMatch = typeof analysisResult.roomMatch === "boolean" ? analysisResult.roomMatch : true;
      analysisResult.mismatchReason = analysisResult.mismatchReason ?? "";
      analysisResult.analysisBasis = analysisResult.analysisBasis ?? "";
      analysisResult.score = typeof analysisResult.score === "number" ? Math.min(100, Math.max(0, analysisResult.score)) : 50;
      analysisResult.summary = analysisResult.summary ?? "";
      analysisResult.issues = Array.isArray(analysisResult.issues) ? analysisResult.issues : [];
      analysisResult._debug = result.debug;
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    result.error = "无法解析 Gemini 返回的 JSON";
    result.debug.content = content;
    return new Response(JSON.stringify(result, null, 2), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    result.error = "服务器错误";
    result.debug.exception = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify(result, null, 2), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
