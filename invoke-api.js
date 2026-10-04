import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "openai/gpt-oss-20b";

async function main(){
    const completion = await groq.chat.completions.create({
        temperature:1,
        // top_p:0.2, //use only one at time temperature or top_p
        // stop: "", 
        max_completion_tokens:1000,
        // frequency_penalty: 1, // between -2 and 2 
        // presence_penalty:1,  // between -2 and 2 
        model: MODEL,
        response_format: {
        type: "json_schema",
            json_schema: {
                name: "product_review",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                    product_name: { type: "string" },
                    rating: { type: "number" },
                    sentiment: { 
                        type: "string",
                        enum: ["positive", "negative", "neutral"]
                    },
                    key_features: { 
                        type: "array",
                        items: { type: "string" }
                    }
                    },
                    required: ["product_name", "rating", "sentiment", "key_features"],
                    additionalProperties: false
                }
            }
        },
        messages: [
            {
                role: "system",
                content:"You are Jarivs, a smart personal assistant. Be always polite"

            },
            {
                role: "user",
                content: "I bought the UltraSound Headphones last week and I'm really impressed! The noise cancellation is amazing and the battery lasts all day. Sound quality is crisp and clear. I'd give it 4.5 out of 5 stars.",

            }
        ]
    })
     
    console.log("Output", completion.choices[0].message.content)
}
main();