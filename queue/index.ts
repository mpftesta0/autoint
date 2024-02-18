import OpenAI from "openai";
import { Queue, Worker, Job, ConnectionOptions } from "bullmq";
import openaiClient from "../config/openaiClient";

const connection: ConnectionOptions = {
  host: "127.0.0.1",
  port: 6379,
};

export const runningAssistants = new Queue("runningAssistants", { connection });

const runToolFunction = async (
  toolCall: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall
) => {
  const { function: func, id: toolCallId } = toolCall;
  const { name: functionName, arguments: args } = func;

  try {
    const moduleA = await import(
      `${process.cwd()}/tools/functions/${functionName}`
    );
    const returnValue = await moduleA.default(args);
    return {
      tool_call_id: toolCallId,
      output: JSON.stringify(returnValue),
    };
  } catch (err) {
    console.log(err);
  }

  return {
    tool_call_id: toolCallId,
    output: "No output",
  };
};

const processRun = async (job: Job) => {
  const { threadId, runId } = job.data;
  const run = await openaiClient.beta.threads.runs.retrieve(threadId, runId);
  console.log("Run status:", run.status);

  if (run.status === "in_progress" || run.status === "queued") {
    await runningAssistants.add("runAssistantJob", job.data, { delay: 2000 });
    return null;
  }

  if (
    run.status === "requires_action" &&
    run.required_action?.type === "submit_tool_outputs"
  ) {
    // Code to run tools here
    const toolJobPromises =
      run.required_action.submit_tool_outputs.tool_calls.map((tool_call) =>
        runToolFunction(tool_call)
      );
    const toolOutputs = await Promise.all(toolJobPromises);
    await openaiClient.beta.threads.runs.submitToolOutputs(
      job.data.threadId,
      job.data.runId,
      {
        tool_outputs: toolOutputs,
      }
    );
    await runningAssistants.add("runAssistantJob", job.data, { delay: 2000 });
    return null;
  }

  const messageList = await openaiClient.beta.threads.messages.list(threadId);
  const lastMessage = messageList.data
    .filter(
      (threadMessage) =>
        threadMessage.run_id === runId && threadMessage.role === "assistant"
    )
    .pop();
  const gptResponse = (
    lastMessage?.content[0] as OpenAI.Beta.Threads.Messages.MessageContentText
  ).text.value;
  return { llmResponse: gptResponse };
};

export const runAssistantWorker = new Worker(
  "runningAssistants",
  async (job) => processRun(job),
  {
    connection,
  }
);
