import * as fs from 'fs';
import * as path from 'path';

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.resolve(__dirname, '../../../logs');
    this.logFile = path.join(this.logDir, 'error.log');
    this.ensureLogFileExists();
  }

  private ensureLogFileExists(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }
  }

  public logError(error: unknown, location: string = 'unknown'): void {
    const timestamp = new Date().toISOString();
    const stackLine = error instanceof Error && error.stack?.split('\n')[1]?.trim();
    const traceInfo = typeof stackLine === 'string' ? stackLine.match(/\((.*):(\d+):\d+\)$/) : null;

    const file = traceInfo?.[1]?.split('/').slice(-1)[0] ?? 'unknown';
    const line = traceInfo?.[2] ?? '?';

    const message = error instanceof Error ? error.message : JSON.stringify(error);
    const logMessage = `[${timestamp}] ${file}::${line} [${location}] ${message}\n`;

    fs.appendFileSync(this.logFile, logMessage, 'utf8');
  }
}

export const logger = new Logger();
