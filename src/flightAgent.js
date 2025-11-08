
const { GoogleGenAI, Type } = require("@google/generative-ai");
const mockFlightData = require('./mockFlightData');

class FlightAgent {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }
        this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            // systemInstruction is not a part of the getGenerativeModel config. It goes into generateContent.
        });
    }

    // Agent Tools: These are the functions the AI can call.
    tools = [
        {
            functionDeclarations: [
                {
                    name: "searchSameAirline",
                    description: "Searches for alternative flights on the same airline as the original flight.",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            departure: { type: Type.STRING, description: "The departure airport code, e.g., ATL" },
                            arrival: { type: Type.STRING, description: "The arrival airport code, e.g., LAX" },
                            date: { type: Type.STRING, description: "The date of travel in YYYY-MM-DD format." },
                            airline: { type: Type.STRING, description: "The two-letter airline code, e.g., AA" },
                        },
                        required: ["departure", "arrival", "date", "airline"],
                    },
                },
                {
                    name: "searchOtherAirlines",
                    description: "Searches for alternative flights on all other airlines.",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            departure: { type: Type.STRING, description: "The departure airport code, e.g., ATL" },
                            arrival: { type: Type.STRING, description: "The arrival airport code, e.g., LAX" },
                            date: { type: Type.STRING, description: "The date of travel in YYYY-MM-DD format." },
                        },
                        required: ["departure", "arrival", "date"],
                    },
                },
            ],
        },
    ];

    // Simulates executing the function call
    async executeFunction(name, args) {
        switch (name) {
            case 'searchSameAirline':
                return mockFlightData.searchFlights(args.departure, args.arrival, args.date, args.airline);
            case 'searchOtherAirlines':
                return mockFlightData.searchFlights(args.departure, args.arrival, args.date);
            default:
                return { error: `Unknown function: ${name}` };
        }
    }

    async analyze(flightData) {
        let agentReasoning = [];
        let alternatives = [];
        let recommendation = {};

        const systemInstruction = `You are "FlightSaver AI", an autonomous agent that helps travelers with flight disruptions.
Your goal is to proactively find and recommend the best alternative flights when a user's flight is significantly delayed or cancelled.
You must reason step-by-step, use the provided tools to gather information, and explain your decisions clearly.
A delay is significant if it's more than 60 minutes.`;

        const chat = this.model.startChat({
            tools: this.tools,
            // systemInstruction should be passed to generateContent, not startChat
        });

        const initialPrompt = `My flight ${flightData.flightNumber} from ${flightData.departure} to ${flightData.arrival} is currently in status: "${flightData.status}".
The delay is ${flightData.delay} minutes.
Based on this information, analyze the situation. If action is required, find alternative flights using the available tools.
1.  Start by searching for flights on the original airline.
2.  Then, search for flights on other airlines to have more options.
3.  After gathering all flight options, analyze them based on arrival time, duration, connections, and price.
4.  Finally, present a summary of the top 3-5 options, clearly state your top recommendation, and explain why you chose it.
Think step-by-step and show your work.`;
        
        agentReasoning.push("🔍 Analyzing flight status...");
        
        let result = await chat.sendMessage(initialPrompt, {systemInstruction});
        
        // This is the core agentic loop. It continues as long as the model wants to call functions.
        while (true) {
            const response = result.response;
            
            // Log the model's reasoning text
            const thought = response.text;
            if (thought) {
                 agentReasoning.push(`🧠 ${thought}`);
            }

            const functionCalls = response.functionCalls;
            if (!functionCalls || functionCalls.length === 0) {
                // If there are no more function calls, the agent is done.
                // The final text response contains the summary and recommendation.
                recommendation = response.text;
                break;
            }
            
            agentReasoning.push(`🛠️ Planning to use tool: ${functionCalls.map(fc => fc.name).join(', ')}`);

            const functionResponses = [];
            for (const call of functionCalls) {
                const apiResponse = await this.executeFunction(call.name, call.args);
                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: apiResponse
                    }
                });

                // Store alternatives found
                if (Array.isArray(apiResponse) && apiResponse.length > 0) {
                   alternatives.push(...apiResponse);
                }
            }
            
            // Send the function results back to the model
            result = await chat.sendMessage(functionResponses);
        }

        // De-duplicate alternatives
        const uniqueAlternatives = Array.from(new Map(alternatives.map(item => [item.flightNumber, item])).values());


        return { agentReasoning, alternatives: uniqueAlternatives, recommendation };
    }
}

module.exports = FlightAgent;
