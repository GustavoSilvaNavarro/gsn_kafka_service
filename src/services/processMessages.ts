import { prisma } from '@adapters/db';
import type { OcppMessagesEvent } from '@interfaces';

export const isARequiredFieldMissing = (data: OcppMessagesEvent): boolean => {
  const { acn, acc, acg, acs, source, timestamp, payload } = data;
  return !acn || !acc || !acg || !acs || !source || !timestamp || !payload;
};

export const insertNewMsg = async (event: OcppMessagesEvent, subject: string) => {
  if (isARequiredFieldMissing(event)) return;
  const { acn, acc, acg, acs, source, timestamp, payload, cbid } = event;

  const newEvent = {
    acnId: acn,
    accId: acc,
    acgId: acg,
    acsId: acs,
    pfid: `${acn}-${acc}-${acg}-${acs}`,
    siteId: `${acn}-${acc}`,
    action: payload?.Action ?? 'Response',
    cbid,
    uniqueId: payload['Unique ID'] ?? null,
    subject,
    source,
    timestamp: new Date(timestamp),
    payload,
  };

  const newDbMsg = await prisma.messages.create({ data: { ...newEvent } });
  return newDbMsg;
};
