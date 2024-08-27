const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");
export const maxDuration = 30;
const app = express();

app.get("/api/source", async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(500).json({ error: "URL is required" });
    }
    let now = Date.now();

    try {
        const browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                "--hide-scrollbars",
                "--disable-web-security",
            ],
            // defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(
                `https://github.com/Sparticuz/chromium/releases/download/v127.0.0/chromium-v127.0.0-pack.tar`
            ),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();
        await page.goto(url);

        // Wait for the video element to load
        await page.waitForSelector("video");

        // Get the video source URL
        const videoSources = await page.evaluate(() => {
            const sources = Array.from(document.querySelectorAll("source"));
            const videoSources = {};
            sources.forEach((source) => {
                videoSources[source.getAttribute("size") + "p"] =
                    source.getAttribute("src");
            });
            return videoSources;
        });

        await browser.close();
        let time = Date.now() - now;
        time = Math.floor(time / 1000);
        res.json({ videoSources, time });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to scrape video source URL" });
    }
});

app.listen(3001, () => {
    console.log("Server listening on port 3001");
});

module.exports = app;
