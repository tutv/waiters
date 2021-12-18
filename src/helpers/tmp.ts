const tmp = require('tmp-promise')
const path = require('path')


export const getPath = async (ext: string = 'jpg') => {
    const {path: dir} = await tmp.dir()
    const now = Date.now()

    return path.join(dir, now + '.' + ext)
}

