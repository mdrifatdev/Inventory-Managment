/**
 * Logger utility | Centralized logging with levels
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDev = __DEV__;

  private formatMessage(level: LogLevel, msg: string): string {
    const timestamp = new Date().toISOString();
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛',
    }[level];
    return `[${timestamp}] ${emoji} ${level.toUpperCase()}: ${msg}`;
  }

  info(msg: string, data?: any) {
    console.log(this.formatMessage('info', msg), data);
  }

  warn(msg: string, data?: any) {
    console.warn(this.formatMessage('warn', msg), data);
  }

  error(msg: string, err?: any) {
    console.error(this.formatMessage('error', msg), err);
  }

  debug(msg: string, data?: any) {
    if (this.isDev) {
      console.log(this.formatMessage('debug', msg), data);
    }
  }
}

export const logger = new Logger();
