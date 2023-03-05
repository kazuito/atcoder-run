import * as vscode from "vscode";
import * as superagent from "superagent";
import * as cheerio from "cheerio";

function getLoginCommand(context: vscode.ExtensionContext) {
  return async () => {
    let username = await vscode.window.showInputBox({
      prompt: "Enter username on AtCoder",
      placeHolder: "Username",
      value: "",
    });

    if (!username) {
      return;
    }

    let password = await vscode.window.showInputBox({
      prompt: "Enter password on AtCoder",
      placeHolder: "Password",
      value: "",
    });

    if (!password) {
      return;
    }

    const agent = superagent.agent();
    const loginUrl =
      "https://atcoder.jp/login?continue=https%3A%2F%2Fatcoder.jp%2F&lang=en";
    let csrfToken = "";

    // Get CSRF token
    await agent
      .get(loginUrl)
      .then((res) => {
        const $ = cheerio.load(res.text);
        csrfToken = $('input[name="csrf_token"]').val();
      })
      .catch((err) => {
        throw err;
      });

    // Login
    await agent
      .post(loginUrl)
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send({
        username: username,
        password: password,
        csrf_token: csrfToken,
      })
      .then(async (res) => {
        if (
          res.text.indexOf(`Welcome, ${username}.`) >= 0 &&
          username &&
          password
        ) {
          vscode.window.showInformationMessage(
            `Login as ${username} successfully.`
          );
          await context.secrets.store("user_id", username);
          await context.secrets.store("user_password", password);
        } else {
          let retry = "Retry";
          vscode.window
            .showErrorMessage(
              "Login failed. Please check your username and password for errors and try again.",
              retry
            )
            .then((selection) => {
              if (selection === retry) {
                vscode.commands.executeCommand("atcoder-run.login");
              }
            });
        }
      });
  };
}

export default getLoginCommand;
