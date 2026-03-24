import OpenAI from "openai";

async function test() {
  const client = new OpenAI({
    apiKey: "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",
    baseURL: "https://models.inference.ai.azure.com",
  });

  try {
    console.log("Testing GitHub Models with OpenAI SDK...");
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hola, ¿quién eres?" }],
    });
    console.log("Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Body:", await err.response.text());
    }
  }
}

test();
