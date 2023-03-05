import * as vscode from "vscode";
import { TestResult } from "./execute";
import statusBarItem from "./statusBarItem";

export default async function drawResults(
  outputChannel: vscode.OutputChannel,
  results: Promise<TestResult>[] | undefined,
  startTime: number,
  config: vscode.WorkspaceConfiguration
) {
  if (!results) {
    return;
  }

  let nTests = results.length;
  let nPassed = 0;

  statusBarItem.text = "$(sync~spin) Running tests...";

  // Draw results on OUTPUT tab
  await (
    await Promise.all(results)
  ).forEach((result, i) => {
    if (result.isPassed && !result.error.msg) {
      outputChannel.appendLine(`✔ Test ${i + 1}: PASSED`);
      if (config.showInputForPassed) {
        outputChannel.appendLine(`${result.input.replace(/^/gm, "┃ ")}`);
      }
      if (config.showOutputFromPassed) {
        outputChannel.appendLine(
          `┃ -> ${result.output.replace(/\n/g, "\n┃    ")}\n`
        );
      } else {
        outputChannel.appendLine("");
      }
      nPassed++;
    } else {
      outputChannel.appendLine(
        `✖ Test ${i + 1}: FAILED${result.error.timedOut ? ` (Timed Out)` : ""}`
      );
      if (config.showInputForFailed) {
        outputChannel.appendLine(`${result.input.replace(/^/gm, "┃ ")}`);
      }
      outputChannel.appendLine(
        `┃ Expected -> ${result.expected.replace(/\n/g, "\n┃             ")}`
      );
      outputChannel.appendLine(
        `┃ Actual   -> ${result.output.replace(/\n/g, "\n┃             ")}`
      );
      if (result.error.msg) {
        outputChannel.appendLine("┃");
        outputChannel.appendLine(
          `┃ ERROR: ${result.error.msg.replace(/\n/g, "\n┃        ")}\n`
        );
      } else {
        outputChannel.appendLine("");
      }
    }
  });

  let isAccepted = false;
  if (nTests === nPassed) {
    isAccepted = true;
  }

  let curTime = Date.now();

  let resultText = `Result: ${
    isAccepted ? "ACCEPTED" : "WRONG ANSWER"
  } (✔ ${nPassed} / ✖ ${nTests - nPassed})`;
  outputChannel.appendLine("-".repeat(resultText.length + 2));
  outputChannel.appendLine(resultText);
  outputChannel.appendLine(`Time  : ${curTime - startTime}ms`);

  outputChannel.show(true);

  return isAccepted;
}
