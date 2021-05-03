import {HTTPResponse, Page} from "puppeteer"

enum MODES {
    and = "and",
    or = "or"
}

interface Options {
    timeout: number
    mode?: MODES,
}

type Filter = (res: HTTPResponse) => Promise<boolean>

export const waitForResponses = (page: Page) => async (filters: Array<Filter>, opts?: Options): Promise<Array<HTTPResponse>> => {
    const _ = async (): Promise<Array<HTTPResponse>> => {
        const _maps: Record<string, boolean> = {}
        const _results: Record<string, HTTPResponse> = {}
        let _count: number = 0
        let _fulfilled = false
        const {timeout} = Object.assign({}, opts)
        const vTimeout = timeout > 0 ? parseInt(timeout + "", 10) : 30000

        return new Promise((resolve, reject) => {
            const _handler = async (response: HTTPResponse) => {
                const _run = async (filter: Filter, index: number) => {
                    if (_maps[index]) return false

                    try {
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

            const _t = setTimeout(() => {
                if (_fulfilled) return false

                _fulfilled = true
                reject(new Error('Timeout.'))
            }, vTimeout)

            page.on("response", _handler)
        })
    }

    try {
        return await _()
    } catch (error) {
        throw error
    }
}

