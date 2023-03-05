import * as vscode from "vscode";

export default function drawCompileError(
  outputChannel: vscode.OutputChannel,
  err: {
    msg: string;
  }
) {
  outputChannel.appendLine("✖ Compile Error:\n");
  outputChannel.appendLine(err.msg);
  outputChannel.show(true);
}
