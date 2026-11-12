import { ForgeFunction } from '@tryforge/forgescript';
import { suggestionLimits } from '../../config/suggestions';

export default new ForgeFunction({
  name: 'suggestionArt',
  // Downloads a suggestion image into the staging folder while its Discord CDN URL is still valid. Returns the stored file name, or nothing on failure.
  params: [
    {
      name: 'url',
      // The attachment URL to download.
      type: 'String',
      required: true,
    },
    {
      name: 'name',
      // The file name to store it under, without extension.
      type: 'String',
      required: true,
    },
  ],
  code: `
  $return[$js[
    (async () => {
      const url = String(ctx.getEnvironmentKey('url') ?? '')
      const allowed = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'
      const base = Array.from(String(ctx.getEnvironmentKey('name') ?? '')).filter((c) => allowed.includes(c)).join('')
      if (!url.startsWith('https://') || !base) return ''
      try {
        const res = await fetch(url)
        if (!res.ok) return ''
        const type = String(res.headers.get('content-type') || '').toLowerCase()
        const ext = type.includes('png') ? 'png' : type.includes('jpeg') || type.includes('jpg') ? 'jpg' : type.includes('webp') ? 'webp' : ''
        if (!ext) return ''
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length === 0 || buf.length > ${suggestionLimits.maxImageBytes}) return ''
        const fs = require('fs')
        const path = require('path')
        fs.mkdirSync('${suggestionLimits.stagingDir}', { recursive: true })
        const file = base + '.' + ext
        fs.writeFileSync(path.join('${suggestionLimits.stagingDir}', file), buf)
        return file
      } catch (e) {
        return ''
      }
    })()
  ]]
  `,
});
