import moment from 'moment';

export default function parseShifts(shifts, firstShiftDay) {
  const year = firstShiftDay.get('year');
  const month = firstShiftDay.get('month');
  const shiftRegex = /(\d+)[^\d]*(\d+)[^\d]*(am|pm|AM|PM)[^\d]*(\d+)[^\d]*(am|pm|AM|PM)/g;
  const parsedShifts = [];
  let match = shiftRegex.exec(shifts);
  while (match !== null) {
    const shift = {
      startIdx: match.index,
      text: match[0],
      day: Number(match[1]),
      startHour: Number(match[2]),
      startMeridian: match[3].toLowerCase(),
      stopHour: Number(match[4]),
      stopMeridian: match[5].toLowerCase(),
    };
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
    parsedShifts.push(shift);
    match = shiftRegex.exec(shifts);
  }
  if (parsedShifts.length === 0) {
    const noShifts = { string: 'Could not find any shifts in the expected format.' };
    parsedShifts.push(noShifts);
  }
  return parsedShifts;
}
