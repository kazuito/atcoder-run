import * as vscode from "vscode";

function getLogoutCommand(context: vscode.ExtensionContext) {
  return async () => {
    await context.secrets.delete("user_id");
    await context.secrets.delete("user_password");

    vscode.window.showInformationMessage("Logout successful.");
  };
}

export default getLogoutCommand;
