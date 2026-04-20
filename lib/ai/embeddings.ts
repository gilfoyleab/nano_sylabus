import { getOpenAIEnv } from "@/lib/env";

export async function embedText(input: string) {
  const { apiKey } = getOpenAIEnv();
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create embedding: ${text}`);
  }

  const payload = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  return payload.data[0]?.embedding ?? [];
}

export async function embedTexts(inputs: string[]) {
  const results: number[][] = [];
  for (const input of inputs) {
    results.push(await embedText(input));
  }
  return results;
}
