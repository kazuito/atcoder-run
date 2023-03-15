import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import { Asset } from "../../types";
import statusBarItem from "./statusBarItem";

export type TestResult = {
  input: string;
  output: string;
  expected: string;
  isPassed: boolean;
  time: number;
  error: {
    timedOut: boolean;
    msg?: string;
  };
};

function compile(
  cmd: string,
  options: string[]
): Promise<{ msg: string } | undefined> {
  statusBarItem.text = "$(sync~spin) Compiling...";

  return new Promise(async (resolve, reject) => {
    const child = cp.spawn(cmd, options);

    let errors: string[] = [];

    child.stderr.on("data", (data: Buffer) => {
      errors.push(data.toString());
    });

    child.on("close", () => {
      if (errors.length === 0) {
        resolve(undefined);
      }

      resolve({
        msg: errors.join("\n"),
      });
    });
  });
}

async function execute(
  context: vscode.ExtensionContext,
  assets: Asset[],
  editor: vscode.TextEditor
): Promise<{
  results?: Promise<TestResult>[];
  compileError?: {
    msg: string;
  };
}> {
  const filePath = editor.document.uri.fsPath;
  const filePathWithoutExt = path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath))
  );
  const binaryPath = `${filePathWithoutExt}.exe`;

  const lang = editor.document.languageId;

  let cmd = "";
  let options: string[] = [];
  let compileError: { msg: string } | undefined;

  switch (lang) {
    case "python": {
      cmd = "python";
      options = [filePath];
      break;
    }
    case "c": {
      compileError = await compile("gcc", [filePath, "-o", binaryPath]);
      cmd = binaryPath;
      break;
    }
    case "cpp": {
      compileError = await compile("g++", [filePath, "-o", binaryPath]);
      cmd = binaryPath;
      break;
    }
    case "go": {
      compileError = await compile("go", ["build", "-o", binaryPath, filePath]);
      cmd = binaryPath;
      break;
    }
  }

  if (compileError) {
    return {
      compileError: compileError,
    };
  }

  let results = [];

  const executionLimitTime = 3000;

  for (let asset of assets) {
    results.push(
      new Promise<TestResult>(async (resolve, reject) => {
        const child = cp.spawn(cmd, options);
        const startTime = Date.now();

        let errorMessages: string[] = [];
        let outputs: string[] = [];

        // Set timeout
        setTimeout(() => {
          child.kill();
          resolve({
            input: asset.input,
            expected: asset.expected,
            output: genOutputStr(outputs),
            isPassed: false,
            time: executionLimitTime,
            error: {
              timedOut: true,
              msg: genErrStr(errorMessages),
            },
          });
        }, executionLimitTime);

        // On Error
        child.stderr.on("data", (data: Buffer) => {
          errorMessages.push(data.toString());
        });

        // On Stdout
        child.stdout.on("data", (data: Buffer) => {
          outputs.push(data.toString());
        });

        // On Close
        child.on("close", (code: number) => {
          resolve({
            input: asset.input,
            expected: asset.expected,
            output: genOutputStr(outputs),
            isPassed: isPassed(outputs.join(""), asset.expected),
            time: Date.now() - startTime,
            error: {
              timedOut: false,
              msg: genErrStr(errorMessages),
            },
          });
        });

        // Input
        let inputs = asset.input.split("\n");
        for (const input of inputs) {
          child.stdin.write(input + "\n");
        }
        child.stdin.end();
      })
    );
  }

  return { results: results };
}

function genErrStr(messages: string[]) {
  return messages.length > 0 ? messages.join("\n") : undefined;
}

function genOutputStr(outputs: string[]) {
  return outputs.join("").replace(/\n(?=$)/, "");
}

function isPassed(actually: string, expected: string) {
  let isSameStr =
    actually
      .replace(/\r/g, "")
      .replace(/(?<=^)\n+|\n+(?=$)/g, "")
      .replace(/\n/g, " ") ===
    expected
      .replace(/\r/g, "")
      .replace(/(?<=^)\n+|\n+(?=$)/g, "")
      .replace(/\n/g, " ");
  let isSameNum = Number(actually) === Number(expected);

  return isSameStr || isSameNum;
}

export default execute;
