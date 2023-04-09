import * as puppeteer from "puppeteer";
import { Browser, Page } from "puppeteer";

export class Puppeteer {
  browser: Browser;
  page: Page;

  async init() {
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();

    await this.page.goto("http://localhost:5173/documents/hello");
    await this.page.setViewport({ width: 1080, height: 1024 });
    await this.page.waitForSelector(".mantine-RichTextEditor-content");

    this.page.on('console', (message) => {
      if (message.type() === 'log') {
        console.log(`Console log: ${message.text()}`);
      } else if (message.type() === 'error') {
        console.error(`Console error: ${message.text()}`);
      }
    });

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
        .insertContent(`<p></p>`)
        .run();

      const letters = content.split("")
      for (let i = 0; i < letters.length; i++) {
        await new Promise((resolve) => {
          setTimeout(() => {
            (window as any).editor
              .chain()
              .insertContent(letters[i])
              .run();
            resolve(true);
          }, 10)
        });
      }
    }, content);
  }

  async insertContentChunk(chunk: string) {
    await this.page.evaluate(async (content) => {
      (window as any).editor
        .chain()
        .insertContent(content)
        .run();
    }, chunk);
  }

  async getContent() {
    return await this.page.evaluate(async () => {
      return (window as any).editor?.view.state.doc.textContent.trim();
    });
  }
}
