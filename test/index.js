const {waitForResponses} = require('../dist')
const puppeteer = require('puppeteer')
const Promise = require('bluebird')


setImmediate(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--window-size=1920,1080`
        ]
    })

    const page = await browser.newPage()
    await page.setViewport({
        width: 1920,
        height: 1080
    })


    // await page.goto('https://github.com')

    const filter1 = async (response) => {
        const url =  response.url()
        console.log("URL1:", url)


        return url.includes("webgl-globe/data/data.json")
    }

    const filter2 = async (response) => {
        const url =  response.url()
        console.log("URL2:", url)

        return url.includes("api.github.com/_private/browser/stats")
    }

    try {
        const responses = await waitForResponses(page, 'https://github.com')([filter1, filter2], {timeout: 10000})

        const r = await Promise.map(responses, async (response) => {
            return response.status()
        })

        console.log("R", r)
    } catch (error) {
        console.log("ERROR", error)
    }
})