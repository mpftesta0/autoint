import { promises as fs } from "fs";
import * as path from "path";
import OpenAI from "openai";

const __dirname = process.cwd();

const openai = new OpenAI();

interface Assistants {
  [assistantName: string]: string;
}

async function doesFolderExist(folderPath: string) {
  try {
    await fs.access(folderPath);
    return true;
  } catch (err) {
    return false;
  }
}

async function doesFileExist(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

async function createFolder(folderPath: string) {
  try {
    await fs.mkdir(folderPath, { recursive: true });
    console.log("Folder created:", folderPath);
  } catch (err) {
    console.error("Error creating folder:", err);
  }
}

async function readAssistantsFileToJson(filePath: string): Promise<Assistants> {
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const jsonData = JSON.parse(fileContent);
    console.log("JSON Content:", jsonData);
    return jsonData;
  } catch (err) {
    console.error("Error reading file:", err);
    throw new Error("Error reading file");
  }
}

async function main() {
  const autointFolderpath = path.join(__dirname, ".autoint");
  const assistantIdsFilePath = path.join(autointFolderpath, "assistants.json");
  const assistantsFolderPath = path.join(__dirname, "assistants");

  const doesAutointFolderExist = await doesFolderExist(autointFolderpath);

  if (doesAutointFolderExist) {
    const doesAssistantsFileExist = await doesFileExist(assistantIdsFilePath);

    if (doesAssistantsFileExist) {
      const assistantsInFile = await readAssistantsFileToJson(
        assistantIdsFilePath
      );
      const assistantsInFolder = await fs.readdir(assistantsFolderPath);

      for (const assistantIdx in assistantsInFolder) {
        const assistant = assistantsInFolder[assistantIdx];
        const assistantFilePath = path.join(assistantsFolderPath, assistant);
        const assistantFileContent = await fs.readFile(
          assistantFilePath,
          "utf8"
        );
        const assistantJson = JSON.parse(assistantFileContent);
        const assistantId = assistantsInFile[assistant];

        if (assistantId) {
          console.log("Updating assistant:", assistant);
          const updateAssistantResponse = await openai.beta.assistants.update(
            assistantId,
            assistantJson
          );
          console.log("Assistant updated:", updateAssistantResponse);
        } else {
          console.log("Creating assistant:", assistant);
          const createAssistantResponse = await openai.beta.assistants.create(
            assistantJson
          );
          console.log("Assistant created:", createAssistantResponse);
          assistantsInFile[assistant] = createAssistantResponse.id;
        }

        await fs.writeFile(
          assistantIdsFilePath,
          JSON.stringify(assistantsInFile, null, 2)
        );
      }
    } else {
      const assistantsInFolder = await fs.readdir(assistantsFolderPath);
      const createdAssistants = {};

      for (const assistantIdx in assistantsInFolder) {
        const assistant = assistantsInFolder[assistantIdx];
        const assistantFilePath = path.join(assistantsFolderPath, assistant);
        const assistantFileContent = await fs.readFile(
          assistantFilePath,
          "utf8"
        );
        const assistantJson = JSON.parse(assistantFileContent);
        const createAssistantResponse = await openai.beta.assistants.create(
          assistantJson
        );
        console.log("Assistant created:", createAssistantResponse);
        createdAssistants[assistant] = createAssistantResponse.id;
      }

      await fs.writeFile(
        assistantIdsFilePath,
        JSON.stringify(createdAssistants, null, 2)
      );
    }
  } else {
    await createFolder(autointFolderpath);
    await main();
  }
}

await main();
