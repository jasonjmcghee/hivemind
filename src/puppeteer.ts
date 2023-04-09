import * as puppeteer from "puppeteer";
import { Browser, Page } from "puppeteer";

export class Puppeteer {
  browser: Browser;
  page: Page;

  async init() {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();

    await this.page.goto("http://localhost:5173/documents/hello");
    await this.page.setViewport({ width: 1080, height: 1024 });
    await this.page.waitForSelector(".mantine-RichTextEditor-content");

    await this.page.evaluate(async () => {
      await (window as any).editor
        .chain()
        .focus("end")
        .insertContent("<p></p>")
        .run();
    });
  }

  async close() {
    await this.browser.close();
  }

  async insertContent(content: string) {
    await this.page.evaluate(async (content) => {
      await (window as any).editor
        .chain()
        .focus("end")
        .insertContent(`<p>${content}</p>`)
        .run();
    }, content);
  }

  async getContent() {
    let content = "";
    await this.page.evaluate(async () => {
      content = await (window as any).editor?.view.state.doc.textContent.trim();
    });
    return content;
  }
}
