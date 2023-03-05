import * as vscode from "vscode";

const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  5
);

export default statusBarItem;
