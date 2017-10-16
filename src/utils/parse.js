import moment from 'moment';

function validShiftTime(shift) {
  // Returns a boolean if the shift provided is for a valid time.
  if (shift.startHour === 8 && shift.startMeridian === 'am' &&
      shift.stopHour === 12 && shift.stopMeridian === 'pm') {
    return true;
  } else if (shift.startHour === 12 && shift.startMeridian === 'pm' &&
             shift.stopHour === 4 && shift.stopMeridian === 'pm') {
    return true;
  } else if (shift.startHour === 4 && shift.startMeridian === 'pm' &&
             shift.stopHour === 8 && shift.stopMeridian === 'pm') {
    return true;
  } else if (shift.startHour === 8 && shift.startMeridian === 'pm' &&
             shift.stopHour === 12 && shift.stopMeridian === 'am') {
    return true;
  } else if (shift.startHour === 12 && shift.startMeridian === 'am' &&
             shift.stopHour === 4 && shift.stopMeridian === 'am') {
    return true;
  }
  return false;
}

function findShift(shifts) {
  let remainingShifts = shifts;
  // TODO: support 24 hour time
  // Given a long string, find and remove a shift
  const filters = [
    // Extracts Monday August (7)th (8)(am)-(12)(pm)
    /(\d+)[\D]+(\d+)[\D]*(am|pm)[\D]+(\d+)[\D]*(am|pm)/,
    // Extracts Monday August (7)th (8)am-(12)(pm)
    /(\d+)[\D]+(\d+)[^\d\w]+(\d+)[\s]*(am|pm|a|p)/,
    // Extracts Monday August (7)th (8)(am)-(12)
    /(\d+)[\D]+(\d+)[\s]*(am|pm|a|p)[^\d\w]+(\d+)/,
  ];
  // shifts are one of: 8am-12pm, 12pm-4pm, 4pm-8pm, 8pm-12am 12am-4am
  // start times can be any of 8, 12, 4, 16, 20, 0
  // stop times can be any of 12, 4, 16, 8, 20, 0
  const parsedShifts = [];
  const done = false;
  while (!done) {
    if (filters[0].exec(remainingShifts)) {
      // console.log('got a match with filter 1');
      const match = filters[0].exec(remainingShifts);
      // parse what you can
      const shift = {
        startIdx: match.index,
        text: match[0],
        day: Number(match[1]),
        startHour: Number(match[2]),
        startMeridian: match[3],
        stopHour: Number(match[4]),
        stopMeridian: match[5],
      };
      if (validShiftTime(shift)) {
        parsedShifts.push(shift);
      }
      const stopIdx = shift.startIdx + match[0].length;
      // console.log('Stripping out: ', remainingShifts.slice(shift.startIdx, stopIdx));
      remainingShifts = remainingShifts.slice(0, shift.startIdx) + remainingShifts.slice(stopIdx);
      // console.log('Remaining shifts are: ', remainingShifts);
    } else if (filters[1].exec(remainingShifts)) {
      // console.log('got a match with filter 2');
      const match = filters[1].exec(remainingShifts);
      const shift = {
        startIdx: match.index,
        text: match[0],
        day: Number(match[1]),
        startHour: Number(match[2]),
        stopHour: Number(match[3]),
        stopMeridian: match[4],
      };
      // Infer startMeridian from stopHour and stopMeridian
      if (shift.stopHour === 4) {
        if (shift.stopMeridian === 'pm') {
          shift.startMeridian = 'pm';
        } else {
          shift.startMeridian = 'am';
        }
      } else if (shift.stopHour === 8) {
        if (shift.stopMeridian === 'pm') {
          shift.startMeridian = 'pm';
        } else {
          shift.startMeridian = 'am';
        }
      } else if (shift.stopHour === 12) {
        if (shift.stopMeridian === 'pm') {
          shift.startMeridian = 'am';
        } else {
          shift.startMeridian = 'pm';
        }
      }
      if (validShiftTime(shift)) {
        parsedShifts.push(shift);
      }
      const stopIdx = shift.startIdx + match[0].length;
      // console.log('Stripping out: ', remainingShifts.slice(shift.startIdx, stopIdx));
      remainingShifts = remainingShifts.slice(0, shift.startIdx) + remainingShifts.slice(stopIdx);
      // console.log('Remaining shifts are: ', remainingShifts);
    } else if (filters[2].exec(remainingShifts)) {
      // console.log('got a match with filter 3');
      const match = filters[2].exec(remainingShifts);
      const shift = {
        startIdx: match.index,
        text: match[0],
        day: Number(match[1]),
        startHour: Number(match[2]),
        startMeridian: match[3],
        stopHour: Number(match[4]),
      };
      // Infer stopMeridian from startHour and startMeridian
      if (shift.startHour === 4) {
        if (shift.startMeridian === 'pm') {
          shift.stopMeridian = 'pm';
        } else {
          shift.stopMeridian = 'am';
        }
      } else if (shift.startHour === 8) {
        if (shift.startMeridian === 'pm') {
          shift.stopMeridian = 'am';
        } else {
          shift.stopMeridian = 'pm';
        }
      } else if (shift.startHour === 12) {
        if (shift.startMeridian === 'pm') {
          shift.stopMeridian = 'pm';
        } else {
          shift.stopMeridian = 'am';
        }
      }
      if (validShiftTime(shift)) {
        parsedShifts.push(shift);
      }
      const stopIdx = shift.startIdx + match[0].length;
      // console.log('Stripping out: ', remainingShifts.slice(shift.startIdx, stopIdx));
      remainingShifts = remainingShifts.slice(0, shift.startIdx) + remainingShifts.slice(stopIdx);
      // console.log('Remaining shifts are: ', remainingShifts);
    } else {
      break;
    }
  }
  return parsedShifts;
}

export default function parseShifts(shifts, firstShiftDay) {
  const year = firstShiftDay.get('year');
  const month = firstShiftDay.get('month');
  // Remove non ascii characters
  let shiftsLower = shifts.replace(/[^\x00-\x7F]/g, '');
  shiftsLower = shiftsLower.toLowerCase();
  // Remove multiple spaces
  shiftsLower = shiftsLower.replace(/[\s]{2,}/g, ' ');
  // Remove periods
  shiftsLower = shiftsLower.replace(/[.]/g, '');
  const parsedShifts = findShift(shiftsLower);
  parsedShifts.forEach((originalShift) => {
    const shift = originalShift;
    if ((shift.startMeridian === 'am' && shift.startHour !== 12) ||
            (shift.startMeridian === 'pm' && shift.startHour === 12)) {
      shift.startTime = moment([year, month, shift.day, shift.startHour]);
    } else if (shift.startMeridian === 'am' && shift.startHour === 12) {
      shift.startTime = moment([year, month, shift.day, 0]);
    } else {
      shift.startTime = moment([year, month, shift.day, shift.startHour + 12]);
    }
    if ((shift.stopMeridian === 'am' && shift.stopHour !== 12) ||
            (shift.stopMeridian === 'pm' && shift.stopHour === 12)) {
      shift.stopTime = moment([year, month, shift.day, shift.stopHour]);
    } else if (shift.stopMeridian === 'am' && shift.stopHour === 12) {
      shift.stopTime = moment([year, month, shift.day, 0]);
    } else {
      shift.stopTime = moment([year, month, shift.day, shift.stopHour + 12]);
    }
    shift.string = `${shift.startTime.format('dddd, MMMM Do ha')}-${shift.stopTime.format('ha')}`;
  });
  if (parsedShifts.length === 0) {
    const noShifts = { string: 'Could not find any shifts in the expected format.' };
    parsedShifts.push(noShifts);
  }
  return parsedShifts;
}
