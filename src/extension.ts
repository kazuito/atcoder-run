import * as vscode from "vscode";

import getLoginCommand from "./command/login";
import getLogoutCommand from "./command/logout";
import getRunTestCommand from "./command/runTest/main";

export class ResultWebviewViewProvider implements vscode.WebviewViewProvider {
  public webview!: vscode.Webview;
  constructor(public context: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.webview = webviewView.webview;

    webviewView.webview.options = {
      ...webviewView.webview.options,
      enableScripts: true,
    };

    const scriptUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "out",
        "webview",
        "assets",
        "index.js"
      )
    );

    webviewView.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AtCoder Run</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="${scriptUri}"></script>
      </body>
    </html>
    `;

    webviewView.webview.onDidReceiveMessage((msg) => {
      switch (msg.id) {
        case "run-test": {
          vscode.commands.executeCommand("atcoder-run.runTest");
        }
      }
    });
  }

  public postMessage(msg: any) {
    this.webview.postMessage(msg);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const resultViewProvider = new ResultWebviewViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "atcoder-run.views.result",
      resultViewProvider
    )
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
    getRunTestCommand(context, resultViewProvider)
  );

  context.subscriptions.push(loginCommand);
  context.subscriptions.push(logoutCommand);
  context.subscriptions.push(runTestCommand);
}

export function deactivate() {}
