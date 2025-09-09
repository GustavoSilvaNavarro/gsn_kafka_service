type OcppBasicEvent = {
  timestamp: string | Date;
  version: string;
  source: 'EVSE' | 'CentralSystem';
  cbid: string;
  payload: object & { Action?: string; 'Unique ID'?: string };
};

export type OcppMessagesEvent = OcppBasicEvent & {
  acn: string;
  acc: string;
  acg: string;
  acs: string;
};
