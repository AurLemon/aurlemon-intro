// plugins/baidu-stat

declare global {
    interface Window {
        _hmt: any[]
    }
}
  
export default defineNuxtPlugin(nuxtApp => {
    const baiduStatKey = useRuntimeConfig().public.baiduStatKey
    
    if (baiduStatKey) {
        window._hmt = window._hmt || []
        const script = document.createElement('script')
        script.src = `https://hm.baidu.com/hm.js?${baiduStatKey}`
        script.async = true
        const firstScript = document.getElementsByTagName('script')[0]
        firstScript.parentNode?.insertBefore(script, firstScript)
    }
})
  