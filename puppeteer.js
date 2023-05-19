const http = require('http');
const https = require('https');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { EventEmitter } = require('events')
EventEmitter.defaultMaxListeners = 20 

const chatgptJson = require('./chatgpt.json');

const processFaviconUrl = async (item) => {
    const url = item.url;
    const url_object = new URL(url);
    const website_url = url_object.protocol + "//" + url_object.host
    const default_favicon_url = website_url + '/favicon.ico';

    try {
        console.log("check website url")
        const website_url_available = await checkURLAvailable(website_url);
        if (!website_url_available) {
            console.log('website url not available');
            return item;
        }
    } catch (err) {
        console.log('Error:', err);
    }

    try {
        console.log("check default favicon url")
        const default_favicon_url_available = await checkURLAvailable(default_favicon_url);
        console.log(`The URL is ${hasFavicon ? 'valid' : 'invalid'}`);
        if (default_favicon_url_available) {
            console.log('has favicon');
            item.favicon = default_favicon_url;
            return item;
        }
    } catch (err) {
        console.error('Error:', err);
    }


    try {
        console.log('use puppeteer');
        const browser = await puppeteer.launch({
            headless: "new",
        });
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);
        await page.goto(item.url);
        // get favicon
        const favicon = await page.evaluate(() => {
            const favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
            return favicon ? favicon.href : null;
        });

        console.log(favicon);

        if (favicon) {
            item.favicon = favicon;
            console.log(item);
        }
        await browser.close();
        return item;
    } catch (err) {
        console.log(err);
    }

}

function checkURLAvailable(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol
            .request(url, { method: 'HEAD' }, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            })
            .on('error', (err) => {
                reject(err);
            })
            .end();
    });
}


Promise.all(chatgptJson.map(processFaviconUrl)).then((results) => {
    fs.writeFileSync('./chatgpt_new.json', JSON.stringify(results));
    console.log('All done!');
}).catch((err) => {
    console.error(err);
});