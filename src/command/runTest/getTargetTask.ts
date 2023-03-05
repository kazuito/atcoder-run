import * as vscode from "vscode";
import * as path from "path";

import { Task } from "../../types";

function getTargetTask(editor: vscode.TextEditor): Task | undefined {
  const lang = editor.document.languageId;

  let doc = editor.document;
  let text = doc.getText();
  let commentRegex = new RegExp("");

  if (lang === "python") {
    commentRegex = new RegExp("(?<=#).*?$", "gm");
  } else if (lang === "c" || lang === "cpp" || lang === "go") {
    commentRegex = new RegExp(/(?<=\/\/).*?$|(?<=\/\*).*?(?=\*\/)/, "gm");
  }

  let comments = text.match(commentRegex);

  let task: Task | undefined = undefined;

  // Get from comment
  if (comments) {
    for (let comment of comments) {
      let commentText = comment
        .replace(/\s+|\n|\r/g, " ")
        .replace(/^\s*|\s*$/, "");

      let problemIdMatch = commentText.match(
        /^([^\s\r\n]+)[-_ ]+([a-z]?[a-z])$/i
      );

      if (problemIdMatch) {
        task = {
          contestId: problemIdMatch[1],
          index: problemIdMatch[2],
        };
        break;
      }
    }
  }

  // Get from file/dir structure
  if (!task) {
    const filePath = doc.uri.fsPath;
    const fileBaseName = path.basename(filePath, path.extname(filePath));
    const pDirName = path.basename(path.dirname(filePath));
    const ppDirName = path.basename(path.dirname(path.dirname(filePath)));

    let fileNameFullMatch = fileBaseName.match(
      /^([^\s\r\n]+)[-_ ]+([a-z]?[a-z])$/i
    );

    let fileNameProblemIndexMatch = fileBaseName.match(/^([a-z]?[a-z])$/i);
    let pDirContestNumMatch = pDirName.match(/^[0-9]+$/);
    let ppDirContestNameMatch = ppDirName.match(/^.+?$/);

    if (fileNameFullMatch) {
      task = {
        contestId: fileNameFullMatch[1],
        index: fileNameFullMatch[2],
      };
    } else if (
      fileNameProblemIndexMatch &&
      pDirContestNumMatch &&
      ppDirContestNameMatch
    ) {
      task = {
        contestId: ppDirContestNameMatch[0] + pDirContestNumMatch[0],
        index: fileNameProblemIndexMatch[0],
      };
    } else {
      return undefined;
    }
  }

  return task;
}

export default getTargetTask;
