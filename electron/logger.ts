import { join } from "path";
import { writeFileSync, existsSync, mkdirSync, appendFileSync } from "fs";

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    // 日志目录在项目根目录的 logs 文件夹
    this.logDir = join(process.cwd(), "logs");

    // 确保日志目录存在
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    // 日志文件名使用当前日期
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    this.logFile = join(this.logDir, `${dateStr}.log`);

    // 写入启动日志
    this.info("=".repeat(80));
    this.info(`Application started at ${new Date().toISOString()}`);
    this.info("=".repeat(80));
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
    const logMessage = this.formatMessage(level, message, data);

    // 输出到控制台
    console.log(logMessage);

    // 写入文件
    try {
      appendFileSync(this.logFile, logMessage + "\n", "utf8");
    } catch (error) {
      console.error("Failed to write log:", error);
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
