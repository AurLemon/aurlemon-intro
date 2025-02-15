// plugins/baidu-stat

declare global {
    interface Window {
        _hmt: any[]
    }
}
  
export default defineNuxtPlugin(nuxtApp => {
    const baiduStatKey = process.env.BAIDU_STAT_KEY

    if (baiduStatKey) {
        window._hmt = window._hmt || []

        const script = document.createElement('script')
        script.src = `https://hm.baidu.com/hm.js?${baiduStatKey}`
        script.async = true
        const firstScript = document.getElementsByTagName('script')[0]
        firstScript.parentNode?.insertBefore(script, firstScript)
    }
})
  