import fs from "fs";
import * as vscode from "vscode";

export const USER_CHOICE = {
  YES: "Yes",
  NO: "No",
  YES_TO_ALL: "Yes to all",
  NO_TO_ALL: "No to all",
};

export class WindowWrapper {
  public static error(message: string): void {
    vscode.window.showErrorMessage(message);
  }

  public static success(message: string): void {
    vscode.window.showInformationMessage(message);
  }

  public static showLoader(message: string) {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left
    );

    statusBarItem.text = message;
    statusBarItem.show();

    return statusBarItem;
  }

  public static dropdown(options: string[], title: string) {
    const picker = vscode.window.createQuickPick();

    picker.title = title;
    picker.canSelectMany = false;
    picker.items = options.map((option) => ({ label: option }));

    picker.show();

    return new Promise<string>((resolve) => {
      picker.onDidChangeSelection((selection) => {
        if (selection.length > 0) {
          resolve(selection[0].label);
          picker.dispose();
        }
      });
    });
  }

  public static userChoicePopup(message: string) {
    const popup = vscode.window.showWarningMessage(
      message,
      {
        modal: true,
      },
      ...Object.values(USER_CHOICE)
    );

    return new Promise<string>((resolve) => {
      popup.then((selection) => {
        resolve(selection || USER_CHOICE.NO);
      });
    });
  }

  public static createFileInProjectDirectory(
    filename: string,
    content: string
  ) {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (!workspaceFolders) {
        WindowWrapper.error("No workspace folder found");
        return false;
      }

      const folderPath = workspaceFolders[0].uri.fsPath;

      fs.writeFileSync(`${folderPath}/${filename}`, content, {
        encoding: "utf-8",
      });

      return true;
    } catch (error) {
      WindowWrapper.error(`Error creating file: ${error}`);
      return false;
    }
  }

  public static getProjectDirectory() {
    return vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
  }
}
