import { PrettyDaysHoursMinutesPipe } from './pretty-days-hours-minutes.pipe';

describe('PreetyDaysHoursMinutesPipe', () => {
  it('create an instance', () => {
    const pipe = new PrettyDaysHoursMinutesPipe();
    expect(pipe).toBeTruthy();
  });
});
