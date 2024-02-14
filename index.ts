import OpenAI from "openai";
import { Queue, Worker, Job, ConnectionOptions } from "bullmq";
import { Server } from "socket.io";

const openai = new OpenAI();

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
    const moduleA = await import("./tools/functions/" + functionName);
    const returnValue = moduleA.default(args);
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
  const run = await openai.beta.threads.runs.retrieve(threadId, runId);
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
    await openai.beta.threads.runs.submitToolOutputs(
      job.data.threadId,
      job.data.runId,
      {
        tool_outputs: toolOutputs,
      }
    );
    await runningAssistants.add("runAssistantJob", job.data, { delay: 2000 });
    return null;
  }

  const messageList = await openai.beta.threads.messages.list(threadId);
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

export async function createOrRetrieveThread(threadId?: string) {
  if (threadId) {
    return openai.beta.threads.retrieve(threadId);
  }
  return openai.beta.threads.create();
}

const io = new Server(3000);

io.on("connection", (socket) => {
  console.log(`Client connected with socket id: ${socket.id}`);

  socket.on("message", async (message) => {
    const { text, threadId, assistantId } = message;
    console.log(`Message received: ${text}`);
    const thread = await createOrRetrieveThread(threadId);

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: text,
    });
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Adding the getRun job to the queue
    await runningAssistants.add("runAssistantJob", {
      threadId: thread.id,
      runId: run.id,
      socketId: socket.id,
      assistantId: assistantId,
    });
  });
});

runAssistantWorker.on("completed", async (job, returnValue) => {
  console.log(`Run Job ${job.id} has completed!`);

  if (returnValue) {
    const { llmResponse } = returnValue;

    const socket = io.sockets.sockets.get(job.data.socketId);
    socket!.emit("response", { llmResponse, threadId: job.data.threadId });
  }
});

// Handle the worker's error events
runAssistantWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} has failed with error ${err.message}`);
});
