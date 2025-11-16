import {
  MIReportPayload,
  MIReportResult,
  UpgradeReportPayload,
  UpgradeReportResult,
} from '../types';

const postJson = async <T>(url: string, payload: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request to ${url} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const createMIReport = (payload: MIReportPayload) =>
  postJson<MIReportResult>('/api/reports/mi', payload);

export const createUpgradeReport = (payload: UpgradeReportPayload) =>
  postJson<UpgradeReportResult>('/api/reports/upgrade', payload);
