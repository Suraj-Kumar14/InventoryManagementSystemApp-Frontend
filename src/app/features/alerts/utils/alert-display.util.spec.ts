import {
  canAcknowledgeAlert,
  canDismissAlert,
  getAlertDetailMessage,
  getAlertDisplayMessage,
  truncateAlertMessage,
} from './alert-display.util';

describe('alert-display util', () => {
  it('prefers userMessage when present', () => {
    expect(getAlertDisplayMessage({ userMessage: 'Friendly', message: 'Technical' })).toBe('Friendly');
    expect(getAlertDisplayMessage({ userMessage: '', message: 'Fallback' })).toBe('Fallback');
  });

  it('truncates long messages cleanly', () => {
    const message = 'A'.repeat(200);
    const result = truncateAlertMessage(message, 20);

    expect(result.length).toBe(20);
    expect(result.endsWith('...')).toBe(true);
  });

  it('truncates long detail messages using the clean display message', () => {
    const result = getAlertDetailMessage({
      userMessage: 'B'.repeat(500),
      message: 'technical fallback',
    });

    expect(result.length).toBe(320);
    expect(result.endsWith('...')).toBe(true);
  });

  it('maps acknowledge and dismiss visibility from alert state', () => {
    expect(canAcknowledgeAlert({ status: 'READ', isAcknowledged: false, isDismissed: false })).toBe(true);
    expect(canAcknowledgeAlert({ status: 'ACKNOWLEDGED', isAcknowledged: true, isDismissed: false })).toBe(false);
    expect(canAcknowledgeAlert({ status: 'DISMISSED', isAcknowledged: false, isDismissed: true })).toBe(false);

    expect(canDismissAlert({ status: 'READ', isDismissed: false })).toBe(true);
    expect(canDismissAlert({ status: 'DISMISSED', isDismissed: true })).toBe(false);
  });
});
