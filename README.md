# equip

`equip` is a `Node.js` framework for building LLM assistants on top of OpenAI's GPT Assistants API

## Dependencies

- A working `Node.js` installation with version 20+
- Running `Redis` server
- OpenAI API Key

## How to Use

### Setting up

Copy `.env.example` to `.env` by running

```
cp .env.example .env
```

Modify it by adding in your `OPENAI_API_KEY` and your `REDIS_URL`.

### Run the Server

Run `equip` to start the server. It will take requests through http://localhost:3000

### Customize your assistants

1. Define your OpenAI Assistant parameters in `assistants/` in a JSON file.

```json
{
  "name": "Demo Assistant",
  "instructions": "You are a weather bot. Use the provided functions to answer questions.",
  "model": "gpt-4-turbo-preview",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "getCurrentWeather",
        "description": "Get the weather in location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state e.g. San Francisco, CA"
            },
            "unit": { "type": "string", "enum": ["c", "f"] }
          },
          "required": ["location"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "getNickname",
        "description": "Get the nickname of a city",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state e.g. San Francisco, CA"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

2. Define function tools in `tools/functions`. Each function file must be named EXACTLY the same as the function tool as defined in your assistants file.

```typescript
// tools/functions/getCurrentWeather.ts

interface getCurrentWeatherArgs {
  location: string;
}

export default function getCurrentWeather(args: getCurrentWeatherArgs) {
  // Add your business logic here
  return "22C";
}
```

```typescript
// tools/functions/getNickname.ts

interface getNicknameArgs {
  location: string;
}

export default function getNickname(args: getNicknameArgs) {
  // Add your business logic here
  return "LA";
}
```

3. Run `equip sync` to upload your OpenAI Assistant.
