import { openai } from "@workspace/integrations-openai-ai-server";

export interface AIVerificationResult {
  detectedAmount: number | null;
  detectedAddress: string | null;
  detectedTxHash: string | null;
  detectedTimestamp: string | null;
  confidence: number;
  raw: string;
}

export interface AICheckBreakdown {
  checkConfidence: boolean;
  checkAmount: boolean;
  checkAddress: boolean;
  checkTimestamp: boolean;
  checkDuplicate: boolean;
}

const VERIFICATION_PROMPT = `You are a USDT crypto payment receipt analyzer. Analyze the provided screenshot of a USDT (BEP20/BSC) transaction and extract the following information.

Return ONLY valid JSON with exactly these fields:
{
  "detectedAmount": <number or null — the USDT amount transferred>,
  "detectedAddress": <string or null — the recipient wallet address>,
  "detectedTxHash": <string or null — the transaction hash/ID if visible>,
  "detectedTimestamp": <string or null — date/time of transaction in ISO format if visible>,
  "confidence": <number between 0 and 1 — your confidence this is a real USDT BEP20 transaction screenshot>
}

Rules:
- If the image is not a crypto transaction screenshot, set confidence to 0
- If you can see a USDT amount clearly, extract it as a number (no currency symbols)
- Extract wallet addresses exactly as shown (0x... format for BEP20)
- confidence = 1.0 means definitely a real USDT transaction receipt with all details visible
- confidence = 0.5 means partial — some but not all details visible
- confidence = 0 means this is not a crypto transaction screenshot at all
- Return ONLY the JSON object, no other text`;

export async function verifyDepositScreenshot(
  base64Image: string,
  claimedAmount: number,
  platformAddress: string,
  submittedAt: Date,
  isDuplicate: boolean
): Promise<{
  result: AIVerificationResult;
  checks: AICheckBreakdown;
  passed: boolean;
  failReasons: string[];
}> {
  const failReasons: string[] = [];

  const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
  const mimeType = base64Image.startsWith("data:image/png") ? "image/png"
    : base64Image.startsWith("data:image/webp") ? "image/webp"
    : "image/jpeg";

  let result: AIVerificationResult = {
    detectedAmount: null,
    detectedAddress: null,
    detectedTxHash: null,
    detectedTimestamp: null,
    confidence: 0,
    raw: "",
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VERIFICATION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageData}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    result.raw = raw;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result = {
        detectedAmount: typeof parsed.detectedAmount === "number" ? parsed.detectedAmount : null,
        detectedAddress: typeof parsed.detectedAddress === "string" ? parsed.detectedAddress : null,
        detectedTxHash: typeof parsed.detectedTxHash === "string" ? parsed.detectedTxHash : null,
        detectedTimestamp: typeof parsed.detectedTimestamp === "string" ? parsed.detectedTimestamp : null,
        confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
        raw,
      };
    }
  } catch (err) {
    console.error("AI verification error:", err);
    failReasons.push("AI analysis failed — requires manual review");
    return {
      result,
      checks: { checkConfidence: false, checkAmount: false, checkAddress: false, checkTimestamp: true, checkDuplicate: !isDuplicate },
      passed: false,
      failReasons
    };
  }

  // Check 1: Confidence threshold
  const checkConfidence = result.confidence >= 0.6;
  if (!checkConfidence) {
    failReasons.push(`Low AI confidence (${(result.confidence * 100).toFixed(0)}%) — screenshot unclear or not a USDT transaction`);
  }

  // Check 2: Amount match (±2% tolerance)
  let checkAmount = false;
  if (result.detectedAmount !== null) {
    const tolerance = claimedAmount * 0.02;
    checkAmount = Math.abs(result.detectedAmount - claimedAmount) <= tolerance;
    if (!checkAmount) {
      failReasons.push(`Amount mismatch — claimed $${claimedAmount}, detected $${result.detectedAmount} (tolerance ±2%)`);
    }
  } else if (checkConfidence) {
    failReasons.push("Could not extract transfer amount from screenshot");
  }

  // Check 3: Address match — logged but not a hard blocker for auto-approval
  let checkAddress = false;
  if (result.detectedAddress !== null && platformAddress) {
    const detected = result.detectedAddress.toLowerCase().replace(/\s/g, "");
    const platform = platformAddress.toLowerCase().replace(/\s/g, "");
    const firstChars = platform.slice(0, 8);
    const lastChars = platform.slice(-6);
    checkAddress = detected.includes(firstChars) || detected.includes(lastChars) || platform.includes(detected.slice(0, 8));
    if (!checkAddress) {
      failReasons.push(`Address mismatch — screenshot shows ${result.detectedAddress.slice(0, 16)}..., expected platform address`);
    }
  } else if (checkConfidence) {
    failReasons.push("Recipient address not visible in screenshot — logged for admin review");
  }

  // Check 4: Timestamp within 2 hours of submission — logged but not a hard blocker
  let checkTimestamp = true;
  if (result.detectedTimestamp) {
    try {
      const txTime = new Date(result.detectedTimestamp).getTime();
      const submitTime = submittedAt.getTime();
      const diffHours = (submitTime - txTime) / (1000 * 60 * 60);
      checkTimestamp = diffHours <= 2 && diffHours >= -0.5;
      if (!checkTimestamp) {
        failReasons.push(`Timestamp out of window — transaction time is more than 2 hours before submission`);
      }
    } catch {
      failReasons.push("Transaction timestamp could not be parsed — logged for admin review");
    }
  }

  // Check 5: Duplicate txHash — only blocks if actually a duplicate
  const checkDuplicate = !isDuplicate;
  if (isDuplicate) {
    failReasons.push(`Duplicate transaction — this txHash has already been processed`);
  }

  // Auto-approve policy: confidence >= 60% + amount matches (core anti-fraud)
  // Address/timestamp/txHash are logged for admin review but don't block legitimate deposits
  const hasTxHash = result.detectedTxHash !== null;
  const effectiveCheckDuplicate = hasTxHash ? checkDuplicate : true;

  const checks: AICheckBreakdown = { checkConfidence, checkAmount, checkAddress, checkTimestamp, checkDuplicate: effectiveCheckDuplicate };
  // Core gate: confidence + amount. Everything else is logged for admin review.
  const passed = checkConfidence && checkAmount && effectiveCheckDuplicate;

  return { result, checks, passed, failReasons };
}
