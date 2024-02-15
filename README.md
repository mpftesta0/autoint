# equipable

`equipable` is a `Node.js` framework for building LLM assistants on top of OpenAI's GPT Assistants API

## Dependencies

- A working `Node.js` installation with version 20+
- Running `Redis` server
- OpenAI API Key

### Optional (for Docker-based Redis installs)

- Docker

## How to Use

### Installing Dependencies

#### Node JS

To use `equipable`, you need Node.js version 20 or higher. You can check your current Node.js version by running node -v in your terminal. If you need to install Node.js, either [download](https://nodejs.org/en/download) an installer for your operating system or [install Node.js via command line](https://nodejs.org/en/download/package-manager)

#### Redis

##### Option 1: Use Docker (Recommended)

If you prefer Docker for managing Redis, ensure Docker is installed on your machine. If you don't have Docker, download it from the [official Docker website](https://docs.docker.com/engine/install/). After installing Docker, run the following command to pull and run the Redis image:

```bash
docker run --name equipable-redis -p 6379:6379 -d redis
```

This command downloads the latest Redis image, names the container equipable-redis, maps the default Redis port 6379 on the container to the same port on your host, and runs the container in detached mode.

##### Option 2: Local Redis Installation

For a local Redis installation, follow the [instructions](https://redis.io/docs/install/install-redis/) for your OS.

#### OpenAI API Key

Follow these steps to obtain one:

1. Sign up or log in to your [OpenAI account](https://platform.openai.com).
2. Navigate to the [API key page](https://platform.openai.com/account/api-keys) and "Create a new secret key".
3. Optionally name your secret key.

#### Setting your environment variables

Copy `.env.example` to `.env` by running

```
cp .env.example .env
```

Modify it by adding in your `OPENAI_API_KEY` and your `REDIS_URL`.

### Run the Server

Run `npm run equipable start` to start the server. It will take requests through http://localhost:3000

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

3. Run `npm run equipable sync` to upload your OpenAI Assistant.

## Roadmap to 0.1.0 (Feb 2024)

- [ ] [Break up core components into separate exports](https://github.com/mpftesta0/equipable/issues/1)
- [ ] [Allow the initialization an empty project with `equipable init`](https://github.com/mpftesta0/equipable/issues/2)
- [ ] [Set up error handling](https://github.com/mpftesta0/equipable/issues/3)
- [ ] [Set up automated testing](https://github.com/mpftesta0/equipable/issues/4)
- [ ] [Adding REST interface by providing `express` middleware](https://github.com/mpftesta0/equipable/issues/5)
- [ ] [Migration project into a monorepo structure](https://github.com/mpftesta0/equipable/issues/6)
- [ ] [Set up Docusaurus docs](https://github.com/mpftesta0/equipable/issues/7)
- [ ] [Set up automated changelog generation](https://github.com/mpftesta0/equipable/issues/8)
- [ ] [Implement a CI/CD pipeline](https://github.com/mpftesta0/equipable/issues/9)
