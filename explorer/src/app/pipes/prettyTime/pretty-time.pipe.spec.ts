import { PrettyTimePipe } from './pretty-time.pipe';

describe('PrettyTimePipe', () => {
  it('create an instance', () => {
    const pipe = new PrettyTimePipe();
    expect(pipe).toBeTruthy();
  });
});
