import dotenv from "dotenv";
import { USER_CHOICE, WindowWrapper } from "./window.utility";

export class DotEnv {
  public static async readDotEnvFile() {
    const projectDirectory = WindowWrapper.getProjectDirectory();

    const envFilePath = `${projectDirectory}/.env`;

    const { parsed } = dotenv.config({ path: envFilePath });

    return parsed || {};
  }

  public static async createDotEnvFile(variables: Record<string, string>) {
    const fileContent = Object.keys(variables)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${key}="${variables[key]}"`)
      .join("\n");

    return WindowWrapper.createFileInProjectDirectory(".env", fileContent);
  }

  public static async upsertDotEnvFile(values: Record<string, string>) {
    const variables = await this.readDotEnvFile();

    const userChoice = {
      yesToAll: false,
      noToAll: false,
    };

    for (const key in values) {
      if (!variables[key] || userChoice.yesToAll) {
        variables[key] = values[key];
        continue;
      }

      if (userChoice.noToAll) {
        continue;
      }

      const userResponse = await WindowWrapper.userChoicePopup(
        `Variable ${key} already exists in .env file. Do you want to overwrite it?`
      );

      userChoice.noToAll = userResponse === USER_CHOICE.NO_TO_ALL;
      userChoice.yesToAll = userResponse === USER_CHOICE.YES_TO_ALL;

      if ([USER_CHOICE.YES, USER_CHOICE.YES_TO_ALL].includes(userResponse)) {
        variables[key] = values[key];
      }
    }

    return await this.createDotEnvFile(variables);
  }
}
