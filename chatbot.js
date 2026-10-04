import "dotenv/config";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import readline from 'node:readline/promises'
import { stdout, stdin } from "node:process";



const tvly = tavily({ apiKey:  process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


async function main(){
    const rl = readline.createInterface({input: stdin, output: stdout})
    const messages = [
        {
            role: "system",
            content:`You are Jarivs, a smart personal assistant. you have access to following tool :
            1. webSearch({query}) // search the latest information and realtime data on the internet.
            Current date and time: ${new Date().toUTCString()} `,
        },
        // {
        //     role: "user",
        //     content: "When will be iphone 18 will launch?",
        //     //What will current wheather of uttarakhand?
        //     //When will be iphone 18 will launch?

        // }
    ];

    while(true){
        const question = await rl.question('You: ');
        if(question =="bye"){
            break;
        }
        messages.push({
            role:'user',
            content: question
        })

        while(true){
            const completion = await groq.chat.completions.create({
                temperature:0,
                model: "openai/gpt-oss-20b",
                messages:messages,
                tools:[
                    {
                        type:"function",
                        function:{
                            name: "webSearch",
                            description:"search the latest information and realtime data on the internet.",
                            parameters: {
                                type: 'object',
                                properties:{
                                    query:{
                                        type:'string',
                                        description: "To search query to perform search on. "
                                    },
                                },
                                required: ['query']
                            }



                        }
                    }
                ],
                tool_choice:'auto',
            })
            messages.push(completion.choices[0].message);

            const toolCalls = completion.choices[0].message.tool_calls;

            if(!toolCalls){
                console.log(`Assistant: ${completion.choices[0].message.content}`);
                break;
            }

            for(const tool of toolCalls){
            
                const functionName = tool.function.name;
                const functionArguments = tool.function.arguments;
                if(functionName === "webSearch"){
                    const toolResult = await webSearch(JSON.parse(functionArguments));

                    messages.push({
                        tool_call_id :tool.id,
                        role: 'tool',
                        name:functionName,
                        content: toolResult,
                    })
                    
                }
            }

            const completion2 = await groq.chat.completions.create({
                temperature:0,
                model: "openai/gpt-oss-20b",
                messages: messages,
                tools:[
                    {
                        type:"function",
                        function:{
                            name: "webSearch",
                            description:"search the latest information and realtime data on the internet.",
                            parameters: {
                                type: 'object',
                                properties:{
                                    query:{
                                        type:'string',
                                        description: "To search query to perform search on. "
                                    },
                                },
                                required: ['query']
                            }



                        }
                    }
                ],
                tool_choice:'auto',
            })
            
            // console.log("Output", JSON.stringify(completion2.choices[0].message, null, 2))

        }
    }

    rl.close();


}
main();


async function webSearch({query}){
    //Web API call wil be here
    console.log("Tool calling")
    const response = await tvly.search(query);
    const finalResult = response.results.map((item)=> item.content).join('/n/n');
    // console.log("response", finalResult);
    return finalResult;

}