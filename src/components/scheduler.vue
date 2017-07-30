<template>
  <div>
    <div class="row">
      <p class="col-md-6 col-md-offset-3">The output of scheduling can be seen below. The calendar output appears at the end of the list. The button below will all you to override the default policy of disallowing two people of the same level to work during the same shift.</p>
    </div>
    <div class="row double-shift-box">
      <div class="col-md-6 col-md-offset-3">
        <input type="checkbox" id="checkbox" v-model="allowDoubleShifting">
        <label for="checkbox">Allow Double Shifting</label>
      </div>
    </div>
    <div class="row double-shift-button" v-if="previousDoubleShiftValueDiffers">
      <div class="col-md-6 col-md-offset-3">
        <button class="btn btn-default" v-on:click="updateSchedule()">Update Schedule</button>
      </div>
    </div>

    <div class="all-results">
      <div v-for="(result, idx) in scheduleResults" class="row result-row">
        <div class="result col-md-6 col-md-offset-3">
          <p class="name-header">{{result.fullName}} <span class="email-header">{{result.emailAddress}}</span></p>
          <ul class="nav nav-tabs" role="tablist">
            <li role="presentation" class="active"><a :href="'#email' + idx" :aria-controls="'email' + idx" role="tab" data-toggle="tab">Email</a></li>
            <li role="presentation"><a :href="'#requested' + idx" :aria-controls="'requested' + idx" role="tab" data-toggle="tab">Requested Shifts</a></li>
            <li role="presentation"><a :href="'#stats' + idx" :aria-controls="'stats' + idx" role="tab" data-toggle="tab">Stats</a></li>
          </ul>
          <div class="tab-content">
            <div role="tabpanel" class="tab-pane fade in active pre-formatted tab" :id="'email' + idx">{{result.email.intro}}<div class="email-shifts">{{result.email.scheduled}}</div>{{result.email.closing}}</div>
            <div role="tabpanel" class="tab-pane fade tab" :id="'requested' + idx">
              <table class="requested-table">
                <tr>
                  <th>Primary Shift Requests</th>
                  <th>Alternate Shift Requests</th>
                </tr>
                <tr class="pre-formatted">
                  <td>{{result.primaryString}}</td>
                  <td>{{result.alternateString}}</td>
                </tr>
              </table>
            </div>
            <div role="tabpanel" class="tab-pane fade tab" :id="'stats' + idx">
              <table class="stats-table">
                <tr>
                  <th></th>
                  <th>Booked</th>
                  <th>Requested</th>
                </tr>
                <tr>
                  <th>Primary Shifts</th>
                  <td>{{result.numPrimariesBooked}}</td>
                  <td>{{result.numPrimariesRequested}}</td>
                </tr>
                <tr>
                  <th>Alternate Shifts</th>
                  <td>{{result.numAlternatesBooked}}</td>
                  <td>{{result.numAlternatesRequested}}</td>
                </tr>
                <tr>
                  <th>Total Booked</th>
                  <td>{{result.numScheduled}}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row result-row">
      <div class="result col-md-6 col-md-offset-3">
        <p class="cal-header name-header">Calendar</p>
        <div class="copy-container">
          <a v-on:click="copyToClipboard()" class="copy-button"><i class="fa fa-clipboard fa-2x" aria-hidden="true"></i></a>
        </div>
        <textarea v-model="calendarString" class="form-control calendar-content" rows=10></textarea>
      </div>
    </div>

    <div class="row">
      <div class="col-md-2 col-md-offset-4 text-left back-button">
        <a v-on:click="back" class="navigation"><i class="fa fa-chevron-left fa-2x"></i></a>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';

const ScheduleResults = function IndividualScheduleResults() {
  this.fullName = null;
  this.numScheduled = 0;
  this.numPrimariesRequested = 0;
  this.numAlternatesRequested = 0;
  this.numPrimariesBooked = 0;
  this.numAlternatesBooked = 0;
  this.scheduledShifts = []; // moment dates, need to be sorted by time
  this.primaryString = null;
  this.alternateString = null;
  this.email = null;
  this.emailAddress = null;
};

function ScheduledShifts(dateInMonth) {
  // get the number of days in the month, multiply by 5*2 and that's how many
  // shift slots we have. The 80% rule applies to only half of that.
  // we want to be able to get all slots in a time range, and also easily
  // set a slot by referencing a single time.

  // want to be able to do shifts[startTime] and see how many slots are full
  // also want to be able to iterate over shifts, starting at startTime:
  // shifts[startTime] could in this case return an index or offset,
  // so we could do shifts.getAllShiftsInRange(start, stop)
  this.daysInMonth = moment(dateInMonth).daysInMonth();
  this.shiftTimes = {};
  this.monthStart = moment(dateInMonth).startOf('month');
  const iDate = moment(this.monthStart);
  this.shiftStarts = [
    moment(iDate).hour(8),
    moment(iDate).hour(12),
    moment(iDate).hour(16),
    moment(iDate).hour(20),
    moment(iDate).hour(0),
  ];
  for (let i = 0; i < this.daysInMonth; i += 1) {
    const shiftDay = moment(iDate);
    this.shiftTimes[shiftDay.toString()] = {
      firstSlots: new Array(this.shiftStarts.length).fill(null),
      secondSlots: new Array(this.shiftStarts.length).fill(null),
    };
    iDate.add(1, 'days');
  }

  // add getters and setters to get a name / set a slot from a datetime
  // add getters and setters to get an array of objects denoting
  //  [ {shiftStart: time, name: name}] given a start and stop range
  this.schedule = function scheduleShiftforName(startTime, name) {
    const shiftDay = moment(startTime).startOf('date');
    const startHour = moment(startTime).date(1);
    const startIdx = this.shiftStarts.findIndex(shiftStart => shiftStart.isSame(startHour));
    // for (let idx = 0; idx < this.shiftStarts.length; idx += 1) {
    //   if (this.shiftStarts[idx].isSame(startHour)) {
    //     const startIdx = idx;
    //     break;
    //   }
    // }
    if (!this.shiftTimes[shiftDay.toString()].firstSlots[startIdx]) {
      this.shiftTimes[shiftDay.toString()].firstSlots[startIdx] = name;
    } else if (!this.shiftTimes[shiftDay.toString()].secondSlots[startIdx]) {
      this.shiftTimes[shiftDay.toString()].secondSlots[startIdx] = name;
    } else {
      // console.log('Error: attempted to schedule', name, 'on',
      // shiftDay.toString(), 'but it is full');
    }
  };
  this.numTaken = function getNumShiftsTaken(startTime) {
    // if both slots are empty, return 0. if 1 is taken return 1, and if
    // both are taken, return 2.
    let taken = 0;
    const shiftDay = moment(startTime).startOf('date');
    const startHour = moment(startTime).date(1);
    const startIdx = this.shiftStarts.findIndex(shiftStart => shiftStart.isSame(startHour));
    // for (let idx = 0; idx < this.shiftStarts.length; ++idx) {
    //   if (this.shiftStarts[idx].isSame(startHour)) {
    //     var startIdx = idx;
    //     break;
    //   }
    // }
    if (this.shiftTimes[shiftDay.toString()].firstSlots[startIdx]) {
      taken += 1;
    }
    if (this.shiftTimes[shiftDay.toString()].secondSlots[startIdx]) {
      taken += 1;
    }
    return taken;
  };
  this.takenInRange = function getShiftsTakenInRange(start, end) {
    let startTime = moment(start);
    let endTime = moment(end);
    if (startTime.isAfter(moment(this.monthStart).endOf('month'))) {
      return null;
    }
    if (endTime.isBefore(this.monthStart)) {
      return null;
    }
    if (endTime.isBefore(startTime)) {
      return null;
    }
    if (startTime.isBefore(this.monthStart)) {
      startTime = moment(this.monthStart).hour(0);
    }
    if (endTime.isAfter(moment(this.monthStart).endOf('month'))) {
      endTime = moment(this.monthStart).date(this.daysInMonth).hour(20);
    }
    // get the number of days, and number of partial days.
    const startHour = startTime.hour();
    // how many shifts to ignore the first day
    let startOffset;
    if (startHour > 4 && startHour <= 8) {
      startOffset = 0;
    } else if (startHour > 8 && startHour <= 12) {
      startOffset = 1;
    } else if (startHour > 12 && startHour <= 16) {
      startOffset = 2;
    } else if (startHour > 16 && startHour <= 20) {
      startOffset = 3;
    } else if (startHour > 20 || startHour === 0) {
      startOffset = 4;
    } else {
      startOffset = 5;
    }

    const endHour = endTime.hour();
    let endOffset; // how many shifts to look at on the last day
    if (endHour >= 4 && endHour < 8) { // all of them
      endOffset = 5;
    } else if (endHour >= 8 && endHour < 12) {
      endOffset = 0;
    } else if (endHour >= 12 && endHour < 16) {
      endOffset = 1;
    } else if (endHour >= 16 && endHour < 20) {
      endOffset = 2;
    } else if (endHour >= 20) {
      endOffset = 3;
    } else if (endHour >= 0 && endHour < 4) {
      endOffset = 4;
    }

    const numDays = endTime.diff(startTime, 'days');
    const taken = [];
    const shiftDay = moment(startTime).startOf('day');
    for (let i = 0; i < numDays; i += 1) {
      const shiftString = shiftDay.toString();
      if (i === 0 && startOffset > 0) {
        // only look at some of the shifts on the first day
        for (let j = startOffset; j < 5; j += 1) {
          if (this.shiftTimes[shiftString].firstSlots[j]) {
            const name = this.shiftTimes[shiftString].firstSlots[j];
            const reserved = { time: shiftString, name };
            taken.push(reserved);
          }
          if (this.shiftTimes[shiftString].secondSlots[j]) {
            const name = this.shiftTimes[shiftString].secondSlots[j];
            const reserved = { time: shiftString, name };
            taken.push(reserved);
          }
        }
      } else {
        for (let j = 0; j < 5; j += 1) {
          if (this.shiftTimes[shiftString].firstSlots[j]) {
            const name = this.shiftTimes[shiftString].firstSlots[j];
            const reserved = { time: shiftString, name };
            taken.push(reserved);
          }
          if (this.shiftTimes[shiftString].secondSlots[j]) {
            const name = this.shiftTimes[shiftString].secondSlots[j];
            const reserved = { time: shiftString, name };
            taken.push(reserved);
          }
        }
      }
      shiftDay.add(1, 'days');
    }

    const shiftString = shiftDay.toString();
    for (let i = 0; i < endOffset; i += 1) {
      if (this.shiftTimes[shiftString].firstSlots[i]) {
        const name = this.shiftTimes[shiftString].firstSlots[i];
        const reserved = { time: shiftString, name };
        taken.push(reserved);
      }
      if (this.shiftTimes[shiftString].secondSlots[i]) {
        const name = this.shiftTimes[shiftString].secondSlots[i];
        const reserved = { time: shiftString, name };
        taken.push(reserved);
      }
    }
    return taken;
  };
  this.nameInSlot = function getNameInTimeSlot(startTime) {
    const shiftDay = moment(startTime).startOf('date');
    const startHour = moment(startTime).date(1);
    const startIdx = this.shiftStarts.findIndex(shiftStart => shiftStart.isSame(startHour));
    // for (let idx = 0; idx < this.shiftStarts.length; idx += 1) {
    //   if (this.shiftStarts[idx].isSame(startHour)) {
    //     var startIdx = idx;
    //     break;
    //   }
    // }
    return this.shiftTimes[shiftDay.toString()].firstSlots[startIdx];
  };
  this.percentTakenInWeek = function getPecentShiftsTakenInWeek(startTime) {
    let weekStart = moment(startTime).day(0).startOf('date');
    if (weekStart.isBefore(this.monthStart)) {
      weekStart = moment(this.monthStart);
    }
    let weekEnd = moment(weekStart).day(7);
    if (weekEnd.isAfter(moment(this.monthStart).endOf('month'))) {
      weekEnd = moment(this.monthStart).date(this.daysInMonth).hour(0);
    }
    const daysInWeek = weekEnd.date() - weekStart.date();
    const shiftsInWeek = 5 * daysInWeek;
    let numShiftsTaken = 0;
    for (let i = 0; i < daysInWeek; i += 1) {
      const dateStr = weekStart.toString();
      for (let j = 0; j < this.shiftStarts.length; j += 1) {
        if (this.shiftTimes[dateStr].firstSlots[j]) {
          numShiftsTaken += 1;
        }
      }
      weekStart.add(1, 'days');
    }
    // console.log('Week is ', 100*numShiftsTaken/shiftsInWeek, '% full');
    return numShiftsTaken / shiftsInWeek;
  };
}

function MonthPrinter(dateInMonth) {
  this.shiftStartHours = [8, 12, 16, 20, 0];
  this.month = moment(dateInMonth).startOf('month');
  this.daysInMonth = moment(dateInMonth).endOf('month').date();
  this.firstDayColumn = moment(this.month).day();

  this.numOverflowDays = (function getNumOverflowDays(firstDayColumn, daysInMonth) {
    const numOverflowDays = (firstDayColumn + daysInMonth) - 35;
    return Math.max(numOverflowDays, 0);
  }(this.firstDayColumn, this.daysInMonth));

  this.calendar = (function createCalendar(month, daysInMonth, shiftStartHours) {
    const schedule = {};
    for (let i = 1; i < daysInMonth + 1; i += 1) {
      const shiftDay = moment(month).date(i);
      for (let j = 0; j < shiftStartHours.length; j += 1) {
        shiftDay.hour(shiftStartHours[j]);
        schedule[shiftDay.toString()] = ['~', ''];
      }
    }
    return schedule;
  }(this.month, this.daysInMonth, this.shiftStartHours));

  this.fillCalendar = function populateCalendarWithSchedule(schedule, nameToLevel) {
    // fill in calendar using schedule
    for (let i = 1; i < this.daysInMonth + 1; i += 1) {
      const shiftDay = moment(this.month).date(i);
      for (let j = 0; j < schedule.shiftStarts.length; j += 1) {
        const shiftStart = moment(shiftDay).hour(this.shiftStartHours[j]);
        const firstSlot = schedule.shiftTimes[shiftDay.toString()].firstSlots[j];
        const secondSlot = schedule.shiftTimes[shiftDay.toString()].secondSlots[j];
        if (firstSlot) {
          const formattedName = nameToLevel[firstSlot] === 2 ? firstSlot : `(${firstSlot})`;
          this.calendar[shiftStart.toString()][0] = formattedName;
        }
        if (secondSlot) {
          const formattedName = nameToLevel[secondSlot] === 2 ? secondSlot : `(${secondSlot})`;
          this.calendar[shiftStart.toString()][1] = formattedName;
        }
      }
    }
  };

  this.indexToShiftValue = function convertIndexToScheduledName(row, column) {
    // Converts the provided row column index to a datetime, and then uses
    // this to get the appropriate value from the calendar
    if (row % 11 === 0) {
      throw new Error(`Row${row}corresponds to a date, not a time slot`);
    }
    const reducedRow = (row - 1) % 11; // [0-9]
    const shiftIdx = Math.floor(reducedRow / 2); // [0-4]
    const shiftStart = this.shiftStartHours[shiftIdx];
    const weekNum = Math.floor(row / 11); // [0-4]
    const daysInFirstRow = 7 - this.firstDayColumn;
    let day;

    if (weekNum === 0) {
      if (column < this.numOverflowDays) {
        day = (this.daysInMonth - this.numOverflowDays) + column + 1;
      } else if (column < this.firstDayColumn) { // can have blank days before the 1st
        return '';
      } else {
        day = (column - this.firstDayColumn) + 1;
      }
    } else {
      day = ((weekNum * 7) + (column + 1) + daysInFirstRow) - 7;
      // There may be blank days at the end of the calendar
      if (day > this.daysInMonth) {
        return '';
      }
    }
    const shiftTime = moment(this.month).date(day).hour(shiftStart);
    const shiftNum = reducedRow % 2;
    return this.calendar[shiftTime.toString()][shiftNum];
  };

  this.indexToDate = function convertIndexToShiftTime(row, column) {
    // Returns the date corresponding to the provided row and column

    // This will either be the overflow days or days in the first week
    if (row === 0) {
      if (column < this.numOverflowDays) {
        return ((this.daysInMonth - this.numOverflowDays) + column + 1);
      } else if (column < this.firstDayColumn) {
        return '';
      }
      return ((column - this.firstDayColumn) + 1).toString();
    }
    // either a date or a blank square at the end of the month
    const weekNum = Math.floor(row / 11); // [1, 4]
    const secondWeekFirstDay = (7 - this.firstDayColumn) + 1;
    const day = ((weekNum * 7) + column + secondWeekFirstDay) - 7;
    if (day > this.daysInMonth) {
      return '';
    }
    return day.toString();
  };

  this.getCalendarString = function getFullCalendarAsString() {
    let calendarString = '';
    for (let i = 0; i < 55; i += 1) {
      for (let j = 0; j < 7; j += 1) {
        if (i % 11 === 0) {
          // this is a date row
          const date = this.indexToDate(i, j);
          calendarString += `${date}\t`;
        } else {
          // this is either a blank square or a schedule square
          const scheduledValue = this.indexToShiftValue(i, j);
          calendarString += `${scheduledValue}\t`;
        }
      }
      calendarString += '\n';
    }
    return calendarString;
  };
}

function EmailCreator(dayInMonth, optional) {
  // special keys: {name} - The intern's name
  // {month} - The month
  this.month = moment(dayInMonth).startOf('month');
  this.intro = 'Hi {name},\n\n';
  if (optional === undefined) {
    this.optional = '';
  } else {
    this.optional = optional;
  }
  this.body = 'I have confirmed your {month} monthly shift ' +
    'requests for the following dates:\n\n';
  this.closing = '\nPlease check the calendar to ensure accuracy.\n\nBest,\n\n';

  this.sampleShifts = [
    moment(this.month).date(3).hour(8),
    moment(this.month).date(10).hour(12),
    moment(this.month).date(17).hour(16),
    moment(this.month).date(24).hour(20),
    moment(this.month).date(31).hour(0),
  ];

  this.toShiftString = function getShiftAsReadableString(shift) {
    // Return a shift as a string formatted as:
    // Weekday, Month Day StartHour(am|pm)-StopHour(am|pm)
    const hour = shift.hour();
    const meridian1 = hour < 12 ? 'am' : 'pm';
    let stopHour = (hour + 4) % 24;
    const meridian2 = stopHour < 12 ? 'am' : 'pm';
    stopHour = stopHour === 0 || stopHour === 12 ? 12 : stopHour % 12;
    const shiftString = `${shift.format('dddd, MMMM Do h') + meridian1}-${stopHour}${meridian2}`;
    return shiftString;
  };

  this.replacePlaceholders = function replacePlaceholdersInEmail(message, name) {
    let newMessage = message.replace(/{name}/g, name);
    newMessage = newMessage.replace(/{month}/g, this.month.format('MMMM'));
    return newMessage;
  };

  this.buildEmail = function buildEmailFromParts(shifts, name) {
    let intro = this.intro + this.optional + this.body;
    intro = this.replacePlaceholders(intro, name);
    let scheduled = '';
    for (let i = 0; i < shifts.length; i += 1) {
      const str = this.toShiftString(shifts[i]);
      scheduled += `${str}\n`;
    }
    return {
      intro,
      scheduled,
      closing: this.closing,
    };
  };

  this.getSample = function getSampleEmail() {
    return this.buildEmail(this.sampleShifts, 'Test Name');
  };

  this.getAllEmails = function buildAllEmails(scheduled) {
    // Given an array of ScheduledShifts, fill in the email field in each
    // entry
    const allEmails = [];
    for (let i = 0; i < scheduled.length; i += 1) {
      const message = this.buildEmail(scheduled[i].scheduledShifts, scheduled[i].fullName);
      allEmails.push(message);
    }
    return allEmails;
  };
}

export default {
  name: 'schedule',
  data() {
    return {
      scheduler: null,
      calendar: null,
      allowDoubleShifting: false,
      previousDoubleShiftValue: false,
      scheduleResults: [],
      nameToLevel: {},
      calendarString: null,
    };
  },
  created() {
    this.scheduleAll();
  },
  computed: {
    previousDoubleShiftValueDiffers() {
      return this.allowDoubleShifting !== this.previousDoubleShiftValue;
    },
  },
  methods: {
    back() {
      this.$router.go(-1);
    },
    scheduleAll() {
      const requests = this.$store.state.valid_rows;
      const requestMonth = this.$store.state.schedule_month;
      if (this.scheduler === null) {
        this.scheduler = new ScheduledShifts(requestMonth);
        this.calendar = new MonthPrinter(requestMonth);
        for (let i = 0; i < requests.length; i += 1) {
          const results = this.scheduleIndividual(requests[i]);
          this.scheduleResults.push(results);
        }
      } else {
        for (let i = 0; i < requests.length; i += 1) {
          const previousResults = this.scheduleResults[i];
          const updatedResults = this.rescheduleIndividual(requests[i], previousResults);
          this.scheduleResults[i] = updatedResults;
        }
      }
      this.calendar.fillCalendar(this.scheduler, this.nameToLevel);
      this.calendarString = this.calendar.getCalendarString();
      this.emailCreator = new EmailCreator(requestMonth);
      const allEmails = this.emailCreator.getAllEmails(this.scheduleResults);
      this.scheduleResults.forEach((res, index) => {
        const result = res;
        result.email = allEmails[index];
      });
    },
    scheduleIndividual(entry) {
      const results = new ScheduleResults();
      const fullName = entry.name;
      const level = entry.level === 'Level I = High School Interns' ? 1 : 2;

      this.nameToLevel[fullName] = level;
      results.numPrimariesRequested = entry.primaryRequests.length;
      results.numAlternatesRequested = entry.alternateRequests.length;
      results.primaryString = entry.primaryString;
      results.alternateString = entry.alternateString;
      results.fullName = fullName;
      results.emailAddress = entry.email;

      for (let i = 0; i < entry.primaryRequests.length; i += 1) {
        const shiftTime = entry.primaryRequests[i];
        if (this.canSchedule(shiftTime, fullName, level, true)) {
          this.schedule(shiftTime, fullName);
          results.numScheduled += 1;
          results.numPrimariesBooked += 1;
          results.scheduledShifts.push(shiftTime.startTime);
        }
      }
      for (let i = 0; i < entry.alternateRequests.length; i += 1) {
        if (results.numScheduled === results.numPrimariesRequested) {
          break;
        }
        const shiftTime = entry.alternateRequests[i];
        if (this.canSchedule(shiftTime, fullName, level, false)) {
          this.schedule(shiftTime, fullName);
          results.numScheduled += 1;
          results.numAlternatesBooked += 1;
          results.scheduledShifts.push(shiftTime.startTime);
        }
      }
      results.scheduledShifts.sort((a, b) => {
        if (a.isBefore(b)) {
          return -1;
        } else if (b.isBefore(a)) {
          return 1;
        }
        return 0;
      });
      // console.log('Scheduled', results.numPrimariesBooked,
      // 'primaries and', results.numAlternatesBooked, 'alternates for', fullName);
      return results;
    },
    canSchedule(shiftTime, name, internLevel, isPrimary) {
      const shiftStart = shiftTime.startTime;
      if (!shiftStart) {
        return false;
      }
      // for alternate requests, prevent working in the same week
      if (!isPrimary && this.personWorkingDuringWeek(shiftStart, name)) {
        return false;
      }
      const alreadyScheduled = this.scheduler.numTaken(shiftStart);
      if (alreadyScheduled === 0) {
        return true;
      } else if (alreadyScheduled === 1) {
        if (this.scheduledLevelDiffers(shiftStart, internLevel) ||
            this.weekIsFullEnough(shiftStart) ||
            this.allowDoubleShifting) {
          return true;
        }
        return false;
      }
      return false;
    },
    personWorkingDuringWeek(shiftStart, name) {
      const monthStart = moment(shiftStart).startOf('month');
      let startSunday = moment(shiftStart).startOf('week');
      const nextSunday = moment(startSunday).add(7, 'days');
      if (startSunday.isBefore(monthStart)) {
        startSunday = monthStart;
      }
      const names = this.peopleWorkingInRange(startSunday, nextSunday);
      for (let i = 0; i < names.length; i += 1) {
        if (name === names[i]) {
          return true;
        }
      }
      return false;
    },
    peopleWorkingInRange(startTime, stopTime) {
      // Returns an array of names currently scheduled between the provided
      // start and stop times.
      const scheduled = this.scheduler.takenInRange(startTime, stopTime);
      const people = [];
      for (let i = 0; i < scheduled.length; i += 1) {
        const person = scheduled[i].name;
        people.push(person);
      }
      return people;
    },
    schedule(shift, fullName) {
      const shiftStart = shift.startTime;
      this.scheduler.schedule(shiftStart, fullName);
      // console.log('Scheduled', fullName, 'at', shiftStart.toString());
    },
    scheduledLevelDiffers(shiftStart, internLevel) {
      // Returns true if the the provided internLevel and the person working
      // during the provided shift time are of different levels.
      const name = this.scheduler.nameInSlot(shiftStart);
      if (this.nameToLevel[name] !== internLevel) {
        return true;
      }
      return false;
    },
    weekIsFullEnough(shiftStart) {
      // Returns true if 80% or greater of the "first" slots in a week are
      // taken. Each slot can sometimes have up to 2 people working, and this
      // only considers those first slots.
      if (this.scheduler.percentTakenInWeek(shiftStart) >= 0.8) {
        return true;
      }
      return false;
    },
    rescheduleIndividual(entry, prevRes) {
      const previousResults = prevRes;
      const numToBook = previousResults.numPrimariesRequested - previousResults.numScheduled;
      if (numToBook <= 0) {
        return previousResults;
      }
      const fullName = previousResults.fullName;
      const level = this.nameToLevel[fullName];
      // entry.primaryRequests.forEach()
      for (let i = 0; i < entry.primaryRequests.length; i += 1) {
        const shiftTime = entry.primaryRequests[i];
        if (!this.alreadyScheduled(shiftTime, previousResults)) {
          if (previousResults.numScheduled === previousResults.numPrimariesRequested) {
            break;
          }
          if (this.canSchedule(shiftTime, fullName, level, true)) {
            this.schedule(shiftTime, fullName);
            previousResults.numScheduled += 1;
            previousResults.numPrimariesBooked += 1;
            previousResults.scheduledShifts.push(shiftTime.startTime);
          }
        }
      }
      for (let i = 0; i < entry.alternateRequests.length; i += 1) {
        const shiftTime = entry.alternateRequests[i];
        if (!this.alreadyScheduled(shiftTime, previousResults)) {
          if (previousResults.numScheduled === previousResults.numPrimariesRequested) {
            break;
          }

          if (this.canSchedule(shiftTime, fullName, level, false)) {
            this.schedule(shiftTime, fullName);
            previousResults.numScheduled += 1;
            previousResults.numAlternatesBooked += 1;
            previousResults.scheduledShifts.push(shiftTime.startTime);
          }
        }
      }
      previousResults.scheduledShifts.sort((a, b) => {
        if (a.isBefore(b)) {
          return -1;
        } else if (b.isBefore(a)) {
          return 1;
        }
        return 0;
      });
      return previousResults;
    },
    alreadyScheduled(shiftTime, previousResults) {
      const shiftString = shiftTime.startTime.toString();
      let alreadyScheduled = false;
      for (let j = 0; j < previousResults.numScheduled; j += 1) {
        const scheduledString = previousResults.scheduledShifts[j].toString();
        if (scheduledString === shiftString) {
          alreadyScheduled = true;
          break;
        }
      }
      return alreadyScheduled;
    },
    updateSchedule() {
      // Used to update the schedule in light of policy changes. Toggling the
      // policy is the same as starting from scratch, rather than constantly
      // appending.
      if (!this.allowDoubleShifting) {
        this.scheduler = null;
        this.scheduleResults = [];
        this.nameToLevel = {};
      }
      this.scheduleAll();
      this.previousDoubleShiftValue = this.allowDoubleShifting;
    },
    copyToClipboard() {
      document.querySelector('.calendar-content').select();
      document.execCommand('copy');
      document.getSelection().removeAllRanges();
    },
  },
};
</script>

<style>
.pre-formatted {
  white-space: pre-wrap;
  text-align: left;
  vertical-align: top;
}
.result {
  border: 1px solid rgba(128, 128, 128, 0.34);
  padding: 10px 10px 10px 10px;
  text-align: left;
}
.result-row {
  margin-bottom: 15px;
}
.tab {
  padding: 10px 0px 0px 0px;
}
.email-shifts {
  font-weight: bold
}
.name-header {
  font-size: 16px;
  font-weight: bold;
  color: #999;
}
.stats-table {
  border-spacing: 21px 7px;
  border-collapse: separate;
}
.requested-table {
  border-spacing: 21px 7px;
  border-collapse: separate;
}
.email-header {
  float: right;
}
.double-shift-button {
  margin-bottom: 10px;
}
.double-shift-box {
  margin-bottom: 5px;
}
.calender {
  white-space: pre-wrap;
}
.cal-header {
  float: left;
  display: inline-block;
}
.copy-container {
  margin-bottom: 50px;
}
.copy-button {
  float: right;
  display: inline-block;
}
a.copy-button:hover {
  color: inherit;
}
a.copy-button {
  color: #999;
}
.back-button {
  margin-bottom: 100px;
}
</style>