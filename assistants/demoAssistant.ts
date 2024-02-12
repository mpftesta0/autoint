import OpenAI from "openai";

const demoAssistant: OpenAI.Beta.AssistantUpdateParams = {
  name: "Demo Assistant",
  instructions:
    "You are a weather bot. Use the provided functions to answer questions.",
  model: "gpt-4-turbo-preview",
  tools: [
    {
      type: "function",
      function: {
        name: "getCurrentWeather",
        description: "Get the weather in location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state e.g. San Francisco, CA",
            },
            unit: { type: "string", enum: ["c", "f"] },
          },
          required: ["location"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "getNickname",
        description: "Get the nickname of a city",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state e.g. San Francisco, CA",
            },
          },
          required: ["location"],
        },
      },
    },
  ],
};

export default demoAssistant;