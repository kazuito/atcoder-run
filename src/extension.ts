import * as vscode from "vscode";
import getLoginCommand from "./command/login";
import getLogoutCommand from "./command/logout";
import getRunTestCommand from "./command/runTest/main";


export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel(
    "AtCoder",
    "atcoder-run"
  );

  const loginCommand = vscode.commands.registerCommand(
    "atcoder-run.login",
    getLoginCommand(context)
  );

  const logoutCommand = vscode.commands.registerCommand(
    "atcoder-run.logout",
    getLogoutCommand(context)
  );

  const runTestCommand = vscode.commands.registerCommand(
    "atcoder-run.runTest",
    getRunTestCommand(context, outputChannel)
  );

  context.subscriptions.push(loginCommand);
  context.subscriptions.push(logoutCommand);
  context.subscriptions.push(runTestCommand);
}

export function deactivate() {}
