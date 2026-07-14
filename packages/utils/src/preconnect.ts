// 预连接 CDN 域名，减少图片加载时的 DNS + TCP + TLS 握手延迟
export function preconnectImageCDNs() {
    // 生成 t1~t4、i1~i4 全部域名
    const origins: string[] = []
    for (let n = 1; n <= 4; n++) {
        origins.push(`https://t${n}.nhentai.net`)
        origins.push(`https://i${n}.nhentai.net`)
    }

    for (const origin of origins) {
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = origin
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
    }
}
