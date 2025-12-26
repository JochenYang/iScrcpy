import { join } from "path";
import { writeFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { app } from "electron";

class Logger {
  private logDir: string;
  private logFile: string;
  private initialized: boolean = false;
  private level: string = "info"; // Default log level

  constructor() {
    // Delay initialization until app is ready
    this.logDir = "";
    this.logFile = "";
  }

  getLevel(): string {
    return this.level;
  }

  setLevel(level: string) {
    const validLevels = ["error", "warn", "info", "debug"];
    if (validLevels.includes(level)) {
      this.level = level;
      // Don't log here to avoid infinite loops
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ["error", "warn", "info", "debug"];
    const currentIndex = levels.indexOf(this.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  private ensureInitialized() {
    if (this.initialized) return;

    try {
      // Use userData directory for logs in packaged app
      const basePath = app.isPackaged ? app.getPath("userData") : process.cwd();

      this.logDir = join(basePath, "logs");

      // Ensure log directory exists
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }

      // Log file name uses current date
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      this.logFile = join(this.logDir, `${dateStr}.log`);

      this.initialized = true;

      // Write startup log
      this.info("=".repeat(80));
      this.info(`Application started at ${new Date().toISOString()}`);
      this.info(`Log directory: ${this.logDir}`);
      this.info("=".repeat(80));
    } catch (error) {
      console.error("Failed to initialize logger:", error);
      // Fallback to console only
      this.initialized = true;
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;

    if (data) {
      if (data instanceof Error) {
        logMessage += `\n  Error: ${data.message}\n  Stack: ${data.stack}`;
      } else if (typeof data === "object") {
        logMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
      } else {
        logMessage += `\n  Data: ${data}`;
      }
    }

    return logMessage;
  }

  private writeLog(level: string, message: string, data?: any) {
    // Check if we should log this level
    if (!this.shouldLog(level)) return;

    this.ensureInitialized();
    const logMessage = this.formatMessage(level, message, data);

    // Output to console
    console.log(logMessage);

    // Write to file (only if logFile is set)
    if (this.logFile) {
      try {
        appendFileSync(this.logFile, logMessage + "\n", "utf8");
      } catch (error) {
        console.error("Failed to write log:", error);
      }
    }
  }

  info(message: string, data?: any) {
    this.writeLog("INFO", message, data);
  }

  error(message: string, data?: any) {
    this.writeLog("ERROR", message, data);
  }

  warn(message: string, data?: any) {
    this.writeLog("WARN", message, data);
  }

  debug(message: string, data?: any) {
    this.writeLog("DEBUG", message, data);
  }
}

// 导出单例
export const logger = new Logger();
