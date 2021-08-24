export class Updater {
  private interval = 0
  private lastUpdated = 0

  constructor(interval: number, updateAtStart = true) {
    this.interval = interval

    if (!updateAtStart) {
      this.lastUpdated = Date.now()
    }
  }

  public needUpdate(now: number): boolean {
    if (now - this.lastUpdated > this.interval) {
      this.lastUpdated = now
      return true
    }

    return false
  }
}
