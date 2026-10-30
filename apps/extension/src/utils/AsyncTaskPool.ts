/**
 * 并发任务池。
 *
 * 语义：
 * - `add()` 立即入队，返回的 Promise 在任务成功/失败时 resolve/reject；
 * - 任务抛错不会中断队列，其余任务继续执行（是否需要「短路」由调用方决定）；
 * - `onAllCompleted` 在「所有已入队任务都结束」时触发一次。
 *
 * 注意：`add()` 返回的 Promise 若被忽略，失败时会成为 unhandled rejection，
 * 调用方应显式 `.catch()`。
 */
export class TaskPool {
    private taskQueue: Array<() => Promise<void>> = []
    private runningCount = 0
    private maxConcurrency: number
    private onAllCompleted?: () => void

    private totalTasks = 0
    private finishedTasks = 0
    /** 避免 onAllCompleted 在同一批次内重复触发 */
    private notified = false

    constructor(maxConcurrency: number = 3) {
        if (maxConcurrency < 1) throw new Error('maxConcurrency must be > 0')
        this.maxConcurrency = maxConcurrency
    }

    add<T>(task: () => Promise<T>): Promise<T> {
        this.totalTasks++
        this.notified = false

        return new Promise<T>((resolve, reject) => {
            this.taskQueue.push(async () => {
                try {
                    const result = await task()
                    resolve(result)
                } catch (err) {
                    reject(err)
                } finally {
                    this.finishedTasks++
                }
            })

            this.runNext()
        })
    }

    private runNext() {
        while (this.runningCount < this.maxConcurrency && this.taskQueue.length > 0) {
            const task = this.taskQueue.shift()!
            this.runningCount++

            // 包装后的 task 内部已 catch，这个 Promise 不会 reject
            void task().finally(() => {
                this.runningCount--
                this.runNext()
                this.checkAllCompleted()
            })
        }
    }

    private checkAllCompleted() {
        if (this.notified) return
        if (this.totalTasks === 0 || this.finishedTasks < this.totalTasks) return
        this.notified = true
        this.onAllCompleted?.()
    }

    setOnAllCompleted(cb: () => void) {
        this.onAllCompleted = cb
        this.checkAllCompleted()
    }
}
