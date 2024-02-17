import OpenAI from "openai";
import { Server } from "socket.io";
import { runningAssistants, runAssistantWorker } from "./queue";

const openai = new OpenAI();

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
