import { ENVIRONMENT, LOG_LEVEL } from '@config';
import { type LoggerOptions, pino, stdTimeFunctions } from 'pino';

const pinoConfiguration: LoggerOptions = {
  level: LOG_LEVEL,
  timestamp: stdTimeFunctions.isoTime,
};

if (!['prd', 'stg'].includes(ENVIRONMENT)) {
  pinoConfiguration.transport = { target: 'pino-pretty', options: { colorize: true } };
} else {
  pinoConfiguration.formatters = {
    bindings: () => {
      return { node_version: process.version };
    },
    level: (label) => {
      return { severity: label.toUpperCase() };
    },
  };
}

export const logger = pino(pinoConfiguration);
