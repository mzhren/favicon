const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
    const data = fs.readFileSync('chatgpt.json');
    const websites = JSON.parse(data);

    const browser = await chromium.launch();
    const context = await browser.newContext();

    for (let website of websites) {
        const page = await context.newPage();
        try {
            await page.goto(website.url);
            const faviconUrl = await page.$eval(
                'link[rel="icon"]',
                (el) => el.href
            ) || page.$eval('link[rel="shortcut icon"]', (el) => el.href);
            console.log(`Favicon URL for ${website.url}: ${faviconUrl}`);
            website.favicon = faviconUrl;
        } catch (err) {
            console.log(err);
            continue;
        }

        await page.close();
    }

    fs.writeFileSync('chatgpt_new.json', JSON.stringify(websites));

    await context.close();
    await browser.close();
})();