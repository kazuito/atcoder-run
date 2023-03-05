import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import { ContestData, Task, Asset } from "../../types";
import * as superagent from "superagent";
import statusBarItem from "./statusBarItem";

export default class AssetDB {
  dbPath: string;
  db: ContestData[] = [];

  constructor(public context: vscode.ExtensionContext) {
    this.dbPath = path.join(context.extensionPath, "asset-db");
  }

  /**
   * Returns assets from database. If not exists in database,
   * fetch the data from the website.
   */
  public async getAssets(task: Task) {
    this.db = await this.readDB();

    let contest = this.db.find((contest) => {
      return (
        contest.id === task.contestId &&
        contest.tasks[task.index as keyof typeof contest.tasks] !== undefined
      );
    });

    if (contest !== undefined) {
      return contest.tasks[task.index as keyof typeof contest.tasks];
    }

    return await this.fetch(task);
  }

  /**
   * Fetch the sample data.
   */
  private async fetch(task: Task) {
    statusBarItem.text = "$(sync~spin) Fetching samples...";

    const loginUrl = `https://atcoder.jp/login`;
    const taskUrl = `https://atcoder.jp/contests/${
      task.contestId
    }/tasks/${task.contestId.replace(/-/g, "_")}_${task.index}`;
    let html = "";

    let username = await this.context.secrets.get("user_id");
    let password = await this.context.secrets.get("user_password");

    if (!username || !password) {
      throw Error("login_required_to_fetch");
    }

    const agent = superagent.agent();
    let csrfToken = "";

    // Get CSRF token
    await agent
      .get(loginUrl)
      .then((res) => {
        const $ = cheerio.load(res.text);
        csrfToken = $('input[name="csrf_token"]').val();
      })
      .catch(() => {
        throw Error(`Failed to access to the login page.`);
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
      .catch(() => {
        throw Error("Failed to login to AtCoder.");
      });

    // Get Task HTML
    await agent
      .get(taskUrl)
      .then((res) => {
        html = res.text;
      })
      .catch(() => {
        throw Error(`Failed to access to the task url. ${taskUrl}`);
      });

    let assets: Asset[] = [];

    const $ = cheerio.load(html);

    let parts = $(".part");

    // Parse HTML and get sample data.
    for (let i = 0; i < parts.length; i++) {
      let elem = $(parts[i]);

      if (elem.find("h3").text().includes("入力例")) {
        let input = elem.find("pre").text();
        let expected = $(parts[i + 1])
          .find("pre")
          .text();

        assets.push({
          input: input.replace(/\n(?=$)/, ""),
          expected: expected.replace(/\n(?=$)/, ""),
        });

        i++;
      }
    }

    // Update the local DB
    let contestIndex = this.db.findIndex((contest) => {
      return contest.id === task.contestId;
    });

    if (contestIndex >= 0) {
      let contest = this.db[contestIndex];
      this.db[contestIndex].tasks[task.index as keyof typeof contest.tasks] =
        assets;
    } else {
      this.db.push({
        id: task.contestId,
        tasks: {
          [task.index]: assets,
        },
      });
    }
    await this.writeDB(this.db);

    return assets;
  }

  /**
   * Read the Asset DB file.
   */
  private async readDB() {
    return new Promise<ContestData[]>((resolve, reject) => {
      fs.readFile(this.dbPath, "utf8", (err, data) => {
        if (err) {
          resolve([]);
        }
        this.db = JSON.parse(data) as ContestData[];
        resolve(this.db);
      });
    });
  }

  /**
   * Write data to the Asset DB file.
   */
  private async writeDB(data: ContestData[]) {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(this.dbPath, JSON.stringify(data), () => {
        resolve();
      });
    });
  }
}
