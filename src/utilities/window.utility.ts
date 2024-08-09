import fs from "fs";
import * as vscode from "vscode";

export class WindowWrapper {
  public static alert(message: string): void {
    vscode.window.showErrorMessage(message);
  }

  public static dropdown(options: string[]) {
    const picker = vscode.window.createQuickPick();

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

  public static createFileInProjectDirectory(
    filename: string,
    content: string
  ) {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (!workspaceFolders) {
        WindowWrapper.alert("No workspace folder found");
        return;
      }

      const folderPath = workspaceFolders[0].uri.fsPath;

      fs.writeFileSync(`${folderPath}/${filename}`, content, {
        encoding: "utf-8",
      });

      WindowWrapper.alert(`File ${filename} created successfully`);
    } catch (error) {
      WindowWrapper.alert(`Error creating file: ${error}`);
    }
  }
}
