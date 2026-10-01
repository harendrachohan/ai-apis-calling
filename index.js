import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "openai/gpt-oss-20b";

// ---------------------------------------------------------------
// Tool calling 
// ---------------------------------------------------------------
async function getWeather({ city }) {
  // In a real app: call a weather API here (OpenWeather, etc.)
  const fakeData = {
    ludhiana: { temp_c: 31, condition: "Sunny" },
    delhi: { temp_c: 34, condition: "Hazy" },
  };
  return fakeData[city.toLowerCase()] ?? { error: `No data for ${city}` };
}

// Map tool name -> function
const availableFunctions = {
  getWeather: getWeather
};

// ---------------------------------------------------------------
// 2. Tool definitions (this is what the MODEL sees)
// ---------------------------------------------------------------
const tools = [
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "Get the current weather for a city. Use this for any live weather question.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name, e.g. Ludhiana" },
        },
        required: ["city"],
      },
    },
  }
];

// ---------------------------------------------------------------
// 3. The tool-calling loop
// ---------------------------------------------------------------
export async function runAgent(userPrompt) {
  console.log(`\n=== USER: ${userPrompt}`);

  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. If you lack live or private data, use the provided tools instead of guessing.",
    },
    { role: "user", content: userPrompt },
  ];

  // Loop because the model may call tools more than once
  for (let step = 0; step < 5; step++) {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto", // model decides: answer directly OR call a tool
    });

    const msg = response.choices[0].message;
    messages.push(msg); // keep the assistant message (with tool_calls) in history

    // No tool call -> this is the final answer
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.log(`=== AI: ${msg.content}`);
      return msg.content;
    }

    // Model asked for tool(s) -> run them and send results back
    for (const call of msg.tool_calls) {
      const fnName = call.function.name;
      const args = JSON.parse(call.function.arguments || "{}");
      console.log(`--- TOOL CALL: ${fnName}(${JSON.stringify(args)})`);

      let result;
      try {
        result = await availableFunctions[fnName](args);
      } catch (err) {
        result = { error: err.message };
      }
      console.log(`--- TOOL RESULT: ${JSON.stringify(result)}`);

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
    // loop again so the model can read the tool results and answer
  }
}

// ---------------------------------------------------------------
// 4. Test cases
// ---------------------------------------------------------------
async function main() {
  // A) General knowledge -> model should NOT call a tool
  await runAgent("what will be sum of 2 +3?");

  // B) Needs live data -> model SHOULD call get_weather
  await runAgent("What's the weather in Ludhiana right now?");

}

main();