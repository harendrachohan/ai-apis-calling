import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "openai/gpt-oss-20b";

async function main(){
    const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: "user",
                content: "Hi",
            }
        ]
    })
     
    console.log("Output", completion.choices[0].message.content)
}
main();