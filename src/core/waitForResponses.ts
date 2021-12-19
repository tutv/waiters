import {HTTPResponse, Page} from "puppeteer"
import {WaiterError} from "./WaiterError"
import {getPath} from "../helpers/tmp"


enum MODES {
    and = "and",
    or = "or"
}

interface Options {
    timeout: number
    mode?: MODES,
}

type Filter = (res: HTTPResponse) => Promise<boolean>


const _screenshot = async (page: Page) => {
    const file = await getPath('jpg')
    await page.screenshot({path: file, fullPage: true, type: 'jpeg', quality: 100})

    return file
}

export const waitForResponses = (page: Page, url?: string) => async (filters: Array<Filter>, opts?: Options): Promise<Array<HTTPResponse>> => {
    const _ = async (): Promise<Array<HTTPResponse>> => {
        const _maps: Record<string, boolean> = {}
        const _results: Record<string, HTTPResponse> = {}
        let _count: number = 0
        let _fulfilled = false
        const {timeout} = Object.assign({}, opts)
        const vTimeout = timeout > 0 ? parseInt(timeout + "", 10) : 30000

        return new Promise(async (resolve, reject) => {
            const urls: Array<string> = []

            const _handler = async (response: HTTPResponse) => {
                const _run = async (filter: Filter, index: number) => {
                    if (_maps[index]) return false

                    try {
                        const url = response.url()
                        urls.push(url)

                        const res = await filter(response)

                        if (!res) return false

                        _maps[index] = true
                        _results[index] = response
                        _count++

                        return true
                    } catch (error) {
                        return false
                    }
                }

                try {
                    await Promise.all(filters.map(_run))

                    if (_count === filters.length) {
                        const arr = filters.map((_, index) => {
                            return _results[index]
                        })

                        if (_fulfilled) return false
                        _fulfilled = true
                        _t && clearTimeout(_t)

                        return resolve(arr)
                    }
                } catch (error) {
                    if (_fulfilled) return
                    _fulfilled = true
                    reject(error)
                }
            }

            const _t = setTimeout(async () => {
                if (_fulfilled) return false

                _fulfilled = true
                const error = new WaiterError('Timeout.')
                error.urls = urls

                try {
                    error.screenshot = await _screenshot(page)
                } catch (error) {
                    console.error('ERROR_SCREENSHOT:', error)
                }

                reject(error)
            }, vTimeout)

            page.on("response", _handler)

            if (url) {//Trigger go to url
                try {
                    await page.goto(url, {waitUntil: 'networkidle2'})
                } catch (error) {
                    console.error('GO_TO_ERROR:', error)
                }
            }
        })
    }

    try {
        return await _()
    } catch (error) {
        throw error
    }
}

