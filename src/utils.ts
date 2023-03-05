import * as vscode from "vscode";

export function openUrl(url: string) {
  vscode.env.openExternal(vscode.Uri.parse(url));
}

export function copyToClipboard(text: string, message?: string) {
  vscode.env.clipboard.writeText(text).then(() => {
    if (message) {
      vscode.window.showInformationMessage(message);
    }
  });
}
