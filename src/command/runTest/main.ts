import * as vscode from "vscode";

import { repoUrl } from "./../../statics";
import drawResults from "./drawResults";
import drawCompileError from "./drawCompileError";
import getTargetTask from "./getTargetTask";
import execute from "./execute";
import AssetDB from "./AssetDB";
import { copyToClipboard, openUrl } from "../../utils";
import statusBarItem from "./statusBarItem";

const supportedLangs = ["python", "c", "cpp", "go"];

// "Run Test" Command
function getRunTestCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel
) {
  return async () => {
    statusBarItem.show();
    try {
      const editor = vscode.window.activeTextEditor;

      // On active text editor not found
      if (!editor) {
        vscode.window.showInformationMessage(
          "Active Text Editor is not found."
        );
        return;
      }

      const lang = editor.document.languageId;

      // On language not supported
      if (!supportedLangs.includes(lang)) {
        let see = "See supported languages";
        vscode.window
          .showInformationMessage(
            `Code language "${lang}" is not supported.`,
            see
          )
          .then((selection) => {
            if (selection === see) {
              openUrl(`${repoUrl}#readme`);
            }
          });
        return;
      }

      const config = vscode.workspace.getConfiguration("atcoder-run");

      outputChannel.clear();

      let task = getTargetTask(editor);

      // On task specifier not found
      if (!task) {
        const howTo = "How to specify task?";
        vscode.window
          .showErrorMessage("Task not specified.", howTo)
          .then((selection) => {
            if (selection === howTo) {
              vscode.env.openExternal(
                vscode.Uri.parse(`${repoUrl}#task-specification`)
              );
            }
          });
        return;
      }

      outputChannel.appendLine(
        `# ${task.contestId.toUpperCase()} - ${task.index.toUpperCase()}\n`
      );
      outputChannel.show(true);

      const assetDB = new AssetDB(context);
      const assets = await assetDB.getAssets(task);

      let startTime = Date.now();
      let { results, compileError } = await execute(context, assets, editor);

      // On compile error
      if (compileError) {
        drawCompileError(outputChannel, compileError);
        throw Error(undefined);
      }

      let isAccepted = await drawResults(
        outputChannel,
        results,
        startTime,
        config
      );

      // On passed all tests, copy the code to clipboard automatically.
      if (isAccepted && config.autoCopy) {
        copyToClipboard(
          editor.document.getText(),
          config.notifyOnAutoCopy ? "Copied the code to clipboard!" : undefined
        );
      }
    } catch (error: any) {
      if (error.message === "login_required_to_fetch") {
        let why = "For what?";
        let login = "Login";
        vscode.window
          .showInformationMessage(
            "Login required to fetch sample data.",
            login,
            why
          )
          .then((selection) => {
            if (selection === why) {
              openUrl(`${repoUrl}#why-is-login-information-required`);
            } else if (selection === login) {
              vscode.commands.executeCommand("atcoder-run.login");
            }
          });
      } else if (error.message) {
        vscode.window.showErrorMessage(error.message);
      }
    }
    statusBarItem.hide();
  };
}

export default getRunTestCommand;
