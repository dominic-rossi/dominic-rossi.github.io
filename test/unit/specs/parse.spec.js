import moment from 'moment';

import parseShifts from '@/utils/parse';

describe('parse should handle', () => {
  const firstShiftDay = moment('2017-08-01');
  const shiftOutputs = [
    'Monday, August 7th 8am-12pm',
    'Monday, August 14th 8am-12pm',
    'Monday, August 21st 8am-12pm',
    'Monday, August 28th 8am-12pm',
  ];

  it('properly formatted inputs', () => {
    const shiftInputs = [
      'Monday August 7th 8am-12pm',
      'Monday August 14th 8am-12pm',
      'Monday August 21st 8am-12pm',
      'Monday August 28th 8am-12pm',
    ].join('\n');
    const outputs = parseShifts(shiftInputs, firstShiftDay);
    shiftOutputs.forEach((element, index) => {
      expect(element).to.equal(outputs[index].string);
    });
  });

  it('when days or months are wrong or misspelled', () => {
    const shiftInputs = [
      'Man August 7th 8am-12pm',
      'Tuesday August 14th 8am-12pm',
      '21nth 8am-12pm',
      'Friday Juen 28th 8am-12pm',
    ].join('\n');
    const outputs = parseShifts(shiftInputs, firstShiftDay);
    shiftOutputs.forEach((element, index) => {
      expect(element).to.equal(outputs[index].string);
    });
  });

  it('regardless of capitalization', () => {
    const shiftInputs = [
      'Monday August 7th 8AM-12pm',
      'Monday August 14th 8am-12PM',
      'Monday August 21st 8AM-12PM',
      'Monday August 28th 8Am-12Pm',
    ].join('\n');
    const outputs = parseShifts(shiftInputs, firstShiftDay);
    shiftOutputs.forEach((element, index) => {
      expect(element).to.equal(outputs[index].string);
    });
  });

  it('regardless of punctuation', () => {
    const shiftInputs = [
      'Monday August 7th 8a.m.-12p.m.',
      'Monday August 14th 8a.m.-12PM',
      'Monday August 21st 8am-12P.M.',
      'Monday August 28th 8A.m-12P.m',
    ].join('\n');
    const outputs = parseShifts(shiftInputs, firstShiftDay);
    shiftOutputs.forEach((element, index) => {
      expect(element).to.equal(outputs[index].string);
    });
  });
});

describe('parse should handle all possible shift times', () => {
  it('when only stop meridians are given', () => {
    const firstShiftDay = moment('2017-08-01');
    const shiftOutputs = [
      'Monday, August 7th 8am-12pm',
      'Monday, August 14th 12pm-4pm',
      'Monday, August 21st 4pm-8pm',
      'Monday, August 28th 8pm-12am',
      'Monday, August 28th 12am-4am',
    ];
    const shiftInputs = [
      'Monday August 7th 8-12pm',
      'Monday August 14th 12-4pm',
      'Monday August 21st 4-8pm',
      'Monday August 28th 8-12am',
      'Monday Ausust 28th 12-4am',
    ].join('\n');
    const outputs = parseShifts(shiftInputs, firstShiftDay);
    shiftOutputs.forEach((element, index) => {
      expect(element).to.equal(outputs[index].string);
    });
  });

  it('when only start meridians are given', () => {
    const firstShiftDay = moment('2017-08-01');
    const shiftOutputs = [
      'Monday, August 7th 8am-12pm',
      'Monday, August 14th 12pm-4pm',
      'Monday, August 21st 4pm-8pm',
      'Monday, August 28th 8pm-12am',
      'Monday, August 28th 12am-4am',
    ];
    const shiftInputs = [
      'Monday August 7th 8am-12',
      'Monday August 14th 12pm-4',
      'Monday August 21st 4pm-8',
      'Monday August 28th 8pm-12',
      'Monday Ausust 28th 12am-4',
    ].join('\n');
    const outputs = parseShifts(shiftInputs, firstShiftDay);
    shiftOutputs.forEach((element, index) => {
      expect(element).to.equal(outputs[index].string);
    });
  });
});

describe('parse should ignore when', () => {
  it('the 4am - 8am shift is provided', () => {
    const firstShiftDay = moment('2017-08-01');
    const badShifts = [
      'Monday August 7th 4am-8am',
      'Monday August 7th 4am-8',
      'Monday August 7th 4-8am',
      'Monday August 7th 4a.m.-8a.m.',
    ];
    const badShiftMessage = 'Could not find any shifts in the expected format.';
    badShifts.forEach((badShift) => {
      expect(parseShifts(badShift, firstShiftDay)[0].string).to.equal(badShiftMessage);
    });
  });
});
