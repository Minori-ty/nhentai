const SUBDOMAINS = ['t1', 't2', 't3', 't4']

export function handleImageError(event: Event) {
    const img = event.target
    if (!img || !(img instanceof HTMLImageElement)) return
    const currentSubdomain = img.src.match(/\/\/(t\d)\./)?.[1]
    if (!currentSubdomain) return
    const idx = SUBDOMAINS.indexOf(currentSubdomain)
    if (idx === -1 || idx >= SUBDOMAINS.length - 1) return
    img.src = img.src.replace(`//${currentSubdomain}.`, `//${SUBDOMAINS[idx + 1]}.`)
}
