export class TaskPool {
    private taskQueue: Array<() => Promise<any>> = []
    private runningCount = 0
    private maxConcurrency: number
    private onAllCompleted?: () => void

    private totalTasks = 0
    private finishedTasks = 0

    constructor(maxConcurrency: number = 3) {
        if (maxConcurrency < 1) throw new Error('maxConcurrency must be > 0')
        this.maxConcurrency = maxConcurrency
    }

    add<T>(task: () => Promise<T>): Promise<T> {
        this.totalTasks++

        return new Promise((resolve, reject) => {
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

            task().finally(() => {
                this.runningCount--
                this.runNext()
                this.checkAllCompleted()
            })
        }
    }

    private checkAllCompleted() {
        if (this.finishedTasks === this.totalTasks) {
            this.onAllCompleted?.()
        }
    }

    setOnAllCompleted(cb: () => void) {
        this.onAllCompleted = cb
        this.checkAllCompleted()
    }
}
