/**
 * inject-emits-jsdoc.ts
 * 将 Emits 的 JSDoc 注入到 DefineComponent 的 emits 泛型参数中
 *
 * 支持两种写法：
 * 1. export interface XxxEmits { ... } + defineEmits<XxxEmits>()
 *    → 直接从 .d.ts 中的 Emits interface 提取 JSDoc
 * 2. defineEmits<{ ... }>() 内联写法
 *    → 从对应的 .vue 源文件中提取 JSDoc
 *
 * 本模块提取 JSDoc 后，注入到 DefineComponent 对应位置（emits 参数和 onXxx props）。
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// ======== JSDoc 提取 ========

/**
 * 从内容中提取大括号块内属性的 JSDoc 映射
 * 通用解析器，可用于 interface 块或 defineEmits<{...}> 块
 */
function extractJsDocFromBlock(lines: string[], startIdx: number): { map: Map<string, string>; endIdx: number } {
    const result = new Map<string, string>()
    let braceDepth = 0
    let currentJsDoc: string[] = []
    let collectingJsDoc = false

    // 找到第一个 { 开始计数
    let started = false
    let i = startIdx
    for (; i < lines.length; i++) {
        const line = lines[i]
        for (const ch of line) {
            if (ch === '{') {
                braceDepth++
                started = true
            }
            if (ch === '}') braceDepth--
        }
        if (started) {
            i++
            break
        }
    }

    for (; i < lines.length; i++) {
        const line = lines[i]

        // 追踪大括号深度
        for (const ch of line) {
            if (ch === '{') braceDepth++
            if (ch === '}') braceDepth--
        }

        if (braceDepth <= 0) {
            return { map: result, endIdx: i }
        }

        // 收集 JSDoc
        const trimmed = line.trim()
        if (trimmed.startsWith('/**')) {
            currentJsDoc = [line]
            if (trimmed.includes('*/')) {
                // 单行 JSDoc: /** xxx */
                collectingJsDoc = false
            } else {
                // 多行 JSDoc 开始
                collectingJsDoc = true
            }
        } else if (collectingJsDoc) {
            currentJsDoc.push(line)
            if (trimmed.includes('*/')) {
                collectingJsDoc = false
            }
        } else if (currentJsDoc.length > 0) {
            // 这行应该是属性声明
            const propMatch = trimmed.match(/^['"]([^'"]+)['"]|^(\w+)/)
            if (propMatch) {
                const eventName = propMatch[1] || propMatch[2]
                const jsdoc = currentJsDoc.map((l) => l.trimStart()).join('\n')
                result.set(eventName, jsdoc)
            }
            currentJsDoc = []
        } else {
            currentJsDoc = []
        }
    }

    return { map: result, endIdx: lines.length - 1 }
}

/**
 * 策略 1：从 .d.ts 文件内容中提取 export interface *Emits 的 JSDoc 映射
 */
function extractEmitsJsDocFromDts(content: string): Map<string, string> {
    const result = new Map<string, string>()
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
        if (/export\s+interface\s+\w*Emits\s*\{/.test(lines[i])) {
            const { map } = extractJsDocFromBlock(lines, i)
            for (const [k, v] of map) {
                result.set(k, v)
            }
        }
    }

    return result
}

/**
 * 策略 2：从 .vue 源文件中提取 defineEmits<{...}> 内部的 JSDoc 映射
 */
function extractEmitsJsDocFromVue(vueContent: string): Map<string, string> {
    const result = new Map<string, string>()
    const lines = vueContent.split('\n')

    for (let i = 0; i < lines.length; i++) {
        // 匹配 defineEmits<{ 开头（可能跨行或同行）
        if (/defineEmits\s*<\s*\{/.test(lines[i])) {
            const { map } = extractJsDocFromBlock(lines, i)
            for (const [k, v] of map) {
                result.set(k, v)
            }
        }
    }

    return result
}

// ======== JSDoc 注入 ========

/**
 * 事件名转为 onXxx 形式
 */
function toOnPropName(eventName: string): string {
    // update:modelValue -> onUpdate:modelValue
    return 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1)
}

/**
 * 逐行处理，在匹配的属性前注入 JSDoc
 */
function injectJsDocIntoContent(content: string, jsDocMap: Map<string, string>): string {
    if (jsDocMap.size === 0) return content

    const lines = content.split('\n')
    const result: string[] = []

    // 构建匹配 key -> jsdoc
    const matchMap = new Map<string, string>()
    for (const [eventName, jsdoc] of jsDocMap) {
        matchMap.set(eventName, jsdoc)
        matchMap.set(toOnPropName(eventName), jsdoc)
    }

    // 跳过 Emits interface 内部（避免重复注入）
    let inEmitsInterface = false
    let emitsBraceDepth = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // 跟踪 Emits interface 范围
        if (/export\s+interface\s+\w*Emits\s*\{/.test(line)) {
            inEmitsInterface = true
            emitsBraceDepth = 1
            result.push(line)
            continue
        }
        if (inEmitsInterface) {
            for (const ch of line) {
                if (ch === '{') emitsBraceDepth++
                if (ch === '}') emitsBraceDepth--
            }
            if (emitsBraceDepth <= 0) inEmitsInterface = false
            result.push(line)
            continue
        }

        // 检查这一行是否匹配需要注入的属性
        let injected = false
        for (const [key, jsdoc] of matchMap) {
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const patterns = [
                new RegExp(`^\\s*"${escapedKey}"\\s*\\??\\s*:`),
                new RegExp(`^\\s*'${escapedKey}'\\s*\\??\\s*:`),
                new RegExp(`^\\s*${escapedKey}\\s*\\??\\s*:`),
            ]

            if (patterns.some((p) => p.test(line))) {
                // 检查前一行是否已经是 JSDoc
                const prevLine = result.length > 0 ? result[result.length - 1].trim() : ''
                if (!prevLine.endsWith('*/')) {
                    const indent = line.match(/^(\s*)/)?.[1] || '    '
                    const jsdocLines = jsdoc.split('\n').map((l) => indent + l)
                    result.push(...jsdocLines)
                    injected = true
                }
                break
            }
        }

        result.push(line)
    }

    return result.join('\n')
}

// ======== 源文件查找 ========

/**
 * 尝试根据 .d.ts 文件路径找到对应的 .vue 源文件
 * 例：dist/components/Select.d.ts -> src/components/Select.vue
 */
function findVueSource(dtsFilePath: string, srcDir: string): string | null {
    const baseName = path.basename(dtsFilePath, '.d.ts')
    // 从 dist 目录开始，尝试重构出 src 路径
    const dtsDir = path.dirname(dtsFilePath)

    // 方式 1：直接用同目录结构在 srcDir 下找
    // 例如 dtsFilePath = /project/dist/components/Foo.d.ts
    //      srcDir = /project/src
    //      -> /project/src/components/Foo.vue
    const distRoot = findDistRoot(dtsFilePath)
    if (distRoot) {
        const relativePath = path.relative(distRoot, dtsDir)
        const vuePath = path.join(srcDir, relativePath, `${baseName}.vue`)
        if (fs.existsSync(vuePath)) {
            return vuePath
        }
    }

    // 方式 2：递归在 srcDir 中搜索同名 .vue 文件
    const found = findFileRecursive(srcDir, `${baseName}.vue`)
    return found
}

/**
 * 向上查找 dist 根目录（包含 package.json 的目录下的 dist）
 */
function findDistRoot(filePath: string): string | null {
    let dir = path.dirname(filePath)
    while (dir !== path.dirname(dir)) {
        if (path.basename(dir) === 'dist') {
            return dir
        }
        dir = path.dirname(dir)
    }
    return null
}

/**
 * 递归搜索目录下的文件
 */
function findFileRecursive(dir: string, fileName: string): string | null {
    if (!fs.existsSync(dir)) return null
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'dist') continue
            const found = findFileRecursive(fullPath, fileName)
            if (found) return found
        } else if (entry.name === fileName) {
            return fullPath
        }
    }
    return null
}

// ======== 主处理流程 ========

/**
 * 处理单个 .d.ts 文件
 */
function processFile(filePath: string, srcDir: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8')

    // 策略 1：从 .d.ts 中的 export interface *Emits 提取
    let jsDocMap = extractEmitsJsDocFromDts(content)

    // 策略 2：如果 .d.ts 中没有 Emits interface，从 .vue 源文件提取
    if (jsDocMap.size === 0) {
        const vueFile = findVueSource(filePath, srcDir)
        if (vueFile) {
            const vueContent = fs.readFileSync(vueFile, 'utf-8')
            jsDocMap = extractEmitsJsDocFromVue(vueContent)
        }
    }

    if (jsDocMap.size === 0) return false

    const processed = injectJsDocIntoContent(content, jsDocMap)

    if (processed !== content) {
        fs.writeFileSync(filePath, processed, 'utf-8')
        console.log(`[emit-jsdoc] \u2713 Injected ${jsDocMap.size} emit JSDoc(s) in: ${path.basename(filePath)}`)
        return true
    }
    return false
}

/**
 * 递归处理目录
 */
function processDir(dirPath: string, srcDir: string): number {
    let count = 0
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
            count += processDir(fullPath, srcDir)
        } else if (entry.name.endsWith('.d.ts')) {
            if (processFile(fullPath, srcDir)) count++
        }
    }
    return count
}

export interface InjectEmitsJsDocOptions {
    /** .vue 源文件所在目录，默认自动推断为 distDir 同级的 src */
    srcDir?: string
}

/**
 * 主入口：处理指定目录下所有 .d.ts 文件
 * @param distDir - dist 输出目录
 * @param options - 可选配置
 */
export function injectEmitsJsDoc(distDir = './dist', options?: InjectEmitsJsDocOptions): void {
    const resolved = path.resolve(distDir)
    if (!fs.existsSync(resolved)) {
        console.warn('[emit-jsdoc] Directory not found:', resolved)
        return
    }

    // 确定 src 目录
    let srcDir: string
    if (options?.srcDir) {
        srcDir = path.resolve(options.srcDir)
    } else {
        // 默认：dist 的同级 src 目录
        srcDir = path.resolve(path.dirname(resolved), 'src')
    }

    if (!fs.existsSync(srcDir)) {
        console.warn('[emit-jsdoc] Source directory not found:', srcDir, '- only .d.ts interface extraction will work')
        srcDir = '' // 空字符串让查找失败，只用策略 1
    }

    const count = processDir(resolved, srcDir)
    if (count === 0) {
        console.log('[emit-jsdoc] No emit JSDoc injection needed.')
    }
}
