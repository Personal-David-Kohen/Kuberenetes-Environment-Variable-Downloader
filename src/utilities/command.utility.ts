import cmd from "child_process";
import commandExists from "command-exists";

export class CommandLine {
  public static execute(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cmd.exec(command, (error, stdout, _stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  public static checkIfCommandExists(command: string): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      commandExists(command, (error, exists) => {
        if (error) {
          resolve(false);
        } else {
          resolve(exists);
        }
      });
    });
  }
}
