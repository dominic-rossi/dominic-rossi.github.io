<template>
  <div>
    <div class="row">
      <p class="col-md-6 col-md-offset-3">The output of scheduling can be seen below. The calendar output appears at the end of the list. The button below will all you to override the default policy of disallowing two people of the same level to work during the same shift.</p>
    </div>
    <div class="row double-shift-box">
      <div class="col-md-6 col-md-offset-3">
        <input type="checkbox" id="checkbox" v-model="allow_double_shifting">
        <label for="checkbox">Allow Double Shifting</label>
      </div>
    </div>
    <div class="row double-shift-button" v-if="previous_double_shift_value_differs">
      <div class="col-md-6 col-md-offset-3">
        <button class="btn btn-default" v-on:click="updateSchedule()">Update Schedule</button>
      </div>
    </div>

    <div class="all-results">
      <div v-for="(result, idx) in schedule_results" class="row result-row">
        <div class="result col-md-6 col-md-offset-3">
          <p class="name-header">{{result.full_name}} <span class="email-header">{{result.email_address}}</span></p>
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
                  <td>{{result.primary_string}}</td>
                  <td>{{result.alternate_string}}</td>
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
                  <td>{{result.num_primaries_booked}}</td>
                  <td>{{result.num_primaries_requested}}</td>
                </tr>
                <tr>
                  <th>Alternate Shifts</th>
                  <td>{{result.num_alternates_booked}}</td>
                  <td>{{result.num_alternates_requested}}</td>
                </tr>
                <tr>
                  <th>Total Booked</th>
                  <td>{{result.num_scheduled}}</td>
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
        <textarea v-model="calendar_string" class="form-control calendar-content" rows=10></textarea>
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
import moment from 'moment'

var ScheduleResults = function() {
  this.full_name = null;
  this.num_scheduled = 0;
  this.num_primaries_requested = 0;
  this.num_alternates_requested = 0;
  this.num_primaries_booked = 0;
  this.num_alternates_booked = 0;
  this.scheduled_shifts = []; // moment dates, need to be sorted by time
  this.primary_string = null;
  this.alternate_string = null;
  this.email = null;
  this.email_address = null;
};

function ScheduledShifts(date_in_month) {
  // get the number of days in the month, multiply by 5*2 and that's how many
  // shift slots we have. The 80% rule applies to only half of that.
  // we want to be able to get all slots in a time range, and also easily
  // set a slot by referencing a single time.

  // want to be able to do shifts[start_time] and see how many slots are full
  // also want to be able to iterate over shifts, starting at start_time:
  // shifts[start_time] could in this case return an index or offset, 
  // so we could do shifts.getAllShiftsInRange(start, stop)
  this.days_in_month = moment(date_in_month).daysInMonth();
  this.shift_times = {};
  this.month_start = moment(date_in_month).startOf('month');
  let i_date = moment(this.month_start);
  this.shift_starts = [
    moment(i_date).hour(8),
    moment(i_date).hour(12),
    moment(i_date).hour(16),
    moment(i_date).hour(20),
    moment(i_date).hour(0)
  ];
  this.shift_ends = [
    moment(i_date).hour(12),
    moment(i_date).hour(16),
    moment(i_date).hour(20),
    moment(i_date).hour(0),
    moment(i_date).hour(4)
  ];
  for (let i = 0; i < this.days_in_month; ++i) {
    let shift_day = moment(i_date);
    this.shift_times[shift_day.toString()] = {
      'first_slots': new Array(this.shift_starts.length).fill(null),
      'second_slots': new Array(this.shift_starts.length).fill(null),
    }
    i_date.add(1, 'days');
  }

  // add getters and setters to get a name / set a slot from a datetime
  // add getters and setters to get an array of objects denoting 
  //  [ {shift_start: time, name: name}] given a start and stop range
  this.schedule = function(start_time, name) {
    let shift_day = moment(start_time).startOf('date');
    let start_hour = moment(start_time).date(1);
    for (let idx = 0; idx < this.shift_starts.length; ++idx) {
      if (this.shift_starts[idx].isSame(start_hour)) {
        var start_hour_idx = idx;
        break;
      }
    }
    if (!this.shift_times[shift_day.toString()].first_slots[start_hour_idx]) {
      this.shift_times[shift_day.toString()].first_slots[start_hour_idx] = name;
    }
    else if (!this.shift_times[shift_day.toString()].second_slots[start_hour_idx]) {
      this.shift_times[shift_day.toString()].second_slots[start_hour_idx] = name;
    } else {
      console.log('Error: attempted to schedule', name, 'on', shift_day.toString(), 'but it is full');
    }
  }
  this.num_taken = function(start_time) {
    // if both slots are empty, return 0. if 1 is taken return 1, and if
    // both are taken, return 2.
    let taken = 0;
    let shift_day = moment(start_time).startOf('date');
    let start_hour = moment(start_time).date(1);
    for (let idx = 0; idx < this.shift_starts.length; ++idx) {
      if (this.shift_starts[idx].isSame(start_hour)) {
        var start_hour_idx = idx;
        break;
      }
    }
    if (this.shift_times[shift_day.toString()].first_slots[start_hour_idx]) {
      taken += 1;
    }
    if (this.shift_times[shift_day.toString()].second_slots[start_hour_idx]) {
      taken += 1;
    }
    return taken
  }
  this.taken_in_range = function(start_time, end_time) {
    if (start_time.isAfter(moment(this.month_start).endOf('month'))) {
      return null;
    }
    if (end_time.isBefore(this.month_start)) {
      return null;
    }
    if (end_time.isBefore(start_time)) {
      return null;
    }
    if (start_time.isBefore(this.month_start)) {
      start_time = moment(this.month_start).hour(0);
    }
    if (end_time.isAfter(moment(this.month_start).endOf('month'))) {
      end_time = moment(this.month_start).date(this.days_in_month).hour(20);
    }
    // get the number of days, and number of partial days.
    let start_hour = start_time.hour();
    // how many shifts to ignore the first day
    let start_offset;
    if (start_hour > 4 && start_hour <= 8) {
      start_offset = 0;
    } else if (start_hour > 8 && start_hour <= 12) {
      start_offset = 1;
    } else if (start_hour > 12 && start_hour <= 16) {
      start_offset = 2;
    } else if (start_hour > 16 && start_hour <= 20) {
      start_offset = 3;
    } else if (start_hour > 20 || start_hour === 0) {
      start_offset = 4;
    } else {
    	start_offset = 5;
    }

    let end_hour = end_time.hour();
    let end_offset; // how many shifts to look at on the last day
    if (end_hour >= 4 && end_hour < 8) { // all of them
      end_offset = 5;
    } else if (end_hour >= 8 && end_hour < 12) {
    	end_offset = 0;
    } else if (end_hour >= 12 && end_hour < 16) {
      end_offset = 1;
    } else if (end_hour >= 16 && end_hour < 20) {
      end_offset = 2;
    } else if (end_hour >= 20) {
      end_offset = 3;
    } else if (end_hour >= 0 && end_hour < 4) {
      end_offset = 4;
    }
    
    let num_days = end_time.diff(start_time, 'days');
    let taken = [];
    let shift_day = moment(start_time).startOf('day');
    let shifts_analyzed = 0;
    for (let i = 0; i < num_days; ++i) {
      let shift_string = shift_day.toString();
      if (i === 0 && start_offset > 0) {
        // only look at some of the shifts on the first day
        for (let j = start_offset; j < 5; ++j) {
          if (this.shift_times[shift_string].first_slots[j]) {
            let name = this.shift_times[shift_string].first_slots[j];
            let reserved = {'time': shift_string, 'name': name};
            taken.push(reserved);
          }
          if (this.shift_times[shift_string].second_slots[j]) {
            let name = this.shift_times[shift_string].second_slots[j];
            let reserved = {'time': shift_string, 'name': name};
            taken.push(reserved);
          }
          shifts_analyzed += 2;
        }
      }
      else {
        for (let j = 0; j < 5; ++j) {
          if (this.shift_times[shift_string].first_slots[j]) {
            let name = this.shift_times[shift_string].first_slots[j];
            let reserved = {'time': shift_string, 'name': name};
            taken.push(reserved);
          }
          if (this.shift_times[shift_string].second_slots[j]) {
            let name = this.shift_times[shift_string].second_slots[j];
            let reserved = {'time': shift_string, 'name': name};
            taken.push(reserved);
          }
          shifts_analyzed += 2;
        }
      }
      shift_day.add(1, 'days');
    }

    let shift_string = shift_day.toString();
    for (let i = 0; i < end_offset; ++i) {
      if (this.shift_times[shift_string].first_slots[i]) {
        let name = this.shift_times[shift_string].first_slots[i];
        let reserved = {'time': shift_string, 'name': name};
        taken.push(reserved);
      }
      if (this.shift_times[shift_string].second_slots[i]) {
        let name = this.shift_times[shift_string].second_slots[i];
        let reserved = {'time': shift_string, 'name': name};
        taken.push(reserved);
      }
      shifts_analyzed += 2;
    }
    return taken;
  }
  this.name_in_slot = function(start_time) {
    let shift_day = moment(start_time).startOf('date');
    let start_hour = moment(start_time).date(1);
    for (let idx = 0; idx < this.shift_starts.length; ++ idx) {
      if (this.shift_starts[idx].isSame(start_hour)) {
        var start_hour_idx = idx;
        break;
      }
    }
    return this.shift_times[shift_day.toString()].first_slots[start_hour_idx];
  }
  this.percent_taken_in_week = function(start_time) {
    let week_start = moment(start_time).day(0).startOf('date');
    if (week_start.isBefore(this.month_start)) {
      week_start = moment(this.month_start);
    }
    let week_end = moment(week_start).day(7);
    if (week_end.isAfter(moment(this.month_start).endOf('month'))) {
      week_end = moment(this.month_start).date(this.days_in_month).hour(0);
    }
    let days_in_week = week_end.date() - week_start.date();
    let shifts_in_week = 5 * days_in_week;
    let num_shifts_taken = 0;
    for (let i = 0; i < days_in_week; ++i) {
      let date_str = week_start.toString();
      for (let j = 0; j < this.shift_starts.length; ++j) {
        if (this.shift_times[date_str].first_slots[j]) {
          num_shifts_taken += 1;
        }
      }
      week_start.add(1, 'days');
    }
    // console.log('Week is ', 100*num_shifts_taken/shifts_in_week, '% full');
    return num_shifts_taken/shifts_in_week;
  }

}

function MonthPrinter(date_in_month) {
  this.shift_start_hours = [8, 12, 16, 20, 0];
  this.month = moment(date_in_month).startOf('month');
  this.days_in_month = moment(date_in_month).endOf('month').date();
  this.first_day_column = moment(this.month).day();

  this.num_overflow_days = (function (first_day_column, days_in_month) {
    let num_overflow_days = first_day_column + days_in_month - 35;
    return Math.max(num_overflow_days, 0);
  })(this.first_day_column, this.days_in_month);

  this.calendar = (function (month, days_in_month, shift_start_hours) {
    let schedule = {};
    for (let i = 1; i < days_in_month + 1; ++i) {
      let shift_day = moment(month).date(i);
      for(let j = 0; j < shift_start_hours.length; ++j) {
        shift_day.hour(shift_start_hours[j]);
        schedule[shift_day.toString()] = ['~', ''];
      }
    }
    return schedule;
  })(this.month, this.days_in_month, this.shift_start_hours);

  this.fillCalendar = function(schedule, name_to_level) {
    // fill in calendar using schedule
    for (let i = 1; i < this.days_in_month + 1; ++i) {
      let shift_day = moment(this.month).date(i);
      for (let j = 0; j < schedule.shift_starts.length; ++ j) {
        let shift_start = moment(shift_day).hour(this.shift_start_hours[j]);
        let first_slot = schedule.shift_times[shift_day.toString()].first_slots[j];
        let second_slot = schedule.shift_times[shift_day.toString()].second_slots[j];
        if (first_slot) {
          let formatted_name = name_to_level[first_slot] === 2 ? first_slot : '(' + first_slot + ')';
          this.calendar[shift_start.toString()][0] = formatted_name;
        }
        if (second_slot) {
          let formatted_name = name_to_level[second_slot] === 2 ? second_slot : '(' + second_slot + ')';
          this.calendar[shift_start.toString()][1] = formatted_name;
        }
      }
    }
  }

  this.indexToShiftValue = function(row, column) {
    // Converts the provided row column index to a datetime, and then uses
    // this to get the appropriate value from the calendar
    if (row % 11 === 0) {
      throw 'Row' + row + 'corresponds to a date, not a time slot';
    }
    let reduced_row = (row - 1) % 11; //[0-9]
    let shift_idx = Math.floor(reduced_row / 2); // [0-4]
    let shift_start = this.shift_start_hours[shift_idx];
    let week_number = Math.floor(row / 11); // [0-4]
    let days_in_first_row = 7 - this.first_day_column;
    let day;

    if (week_number === 0) {
      if (column < this.num_overflow_days) {
        day = this.days_in_month - this.num_overflow_days + column + 1;
      } else if (column < this.first_day_column) { // can have blank days before the 1st
        return '';
      } else {
        day = column - this.first_day_column + 1;
      }
    } else {
      day = (week_number * 7) + (column + 1) - 7 + days_in_first_row;
      // There may be blank days at the end of the calendar
      if (day > this.days_in_month) {
        return '';
      }
    }
    let shift_time = moment(this.month).date(day).hour(shift_start);
    let shift_number = reduced_row % 2;
    return this.calendar[shift_time.toString()][shift_number];
  }

  this.indexToDate = function (row, column) {
    // Returns the date corresponding to the provided row and column

    // This will either be the overflow days or days in the first week
    if (row === 0) {
      if (column < this.num_overflow_days) {
        return this.days_in_month - this.num_overflow_days + column + 1;
      } else if (column < this.first_day_column) {
        return '';
      } else {
        return (column - this.first_day_column + 1).toString();
      }
    }
    // either a date or a blank square at the end of the month
    let week_number = Math.floor(row / 11); // [1, 4]
    let second_week_first_day = 7 - this.first_day_column + 1;
    let day = week_number * 7 + column + second_week_first_day - 7;
    if (day > this.days_in_month) {
      return '';
    }
    return day.toString();
  }

  this.getCalendarString = function() {
    let calendar_string = '';
    for (let i = 0; i < 55; ++i) {
      for (let j = 0; j < 7; ++j) {
        if (i % 11 === 0) {
          // this is a date row
          let date = this.indexToDate(i, j);
          calendar_string += date + '\t';
        } else {
          // this is either a blank square or a schedule square
          let scheduled_value = this.indexToShiftValue(i, j);
          calendar_string += scheduled_value + '\t';
        }
      }
      calendar_string += '\n';
    }
    return calendar_string;
  }

}

function EmailCreator(day_in_month, optional) {
  // special keys: {name} - The intern's name
  // {month} - The month
  this.month = moment(day_in_month).startOf('month');
  this.intro = 'Hi {name},\n\n';
  if (optional == undefined) {
    this.optional = ''; 
  } else {
    this.optional = optional;
  }
  this.body = 'I have confirmed your {month} monthly shift ' +
    'requests for the following dates:\n\n';
  this.closing = '\nPlease check the calendar to ensure accuracy.\n\nBest,\n\n';

  this.sample_shifts = [
    moment(this.month).date(3).hour(8),
    moment(this.month).date(10).hour(12),
    moment(this.month).date(17).hour(16),
    moment(this.month).date(24).hour(20),
    moment(this.month).date(31).hour(0)
  ];

  this.toShiftString = function(shift) {
    // Return a shift as a string formatted as:
    // Weekday, Month Day StartHour(am|pm)-StopHour(am|pm)
    let hour = shift.hour();
    let meridian1 = hour < 12 ? 'am' : 'pm';
    let stop_hour = (hour + 4) % 24;
    let meridian2 = stop_hour < 12 ? 'am' : 'pm';
    stop_hour = stop_hour === 0  || stop_hour === 12 ? 12 : stop_hour % 12;
    let shift_string = shift.format('dddd, MMMM Do h') + meridian1 + '-' + stop_hour + meridian2;
    return shift_string;
  };

  this.replacePlaceholders = function(message, name) {
    let new_message = message.replace(/{name}/g, name);
    new_message = new_message.replace(/{month}/g, this.month.format('MMMM'));
    return new_message;
  }

  this.buildEmail = function(shifts, name) {
    let intro = this.intro + this.optional + this.body;
    intro = this.replacePlaceholders(intro, name);
    let scheduled = '';
    for (let i = 0; i < shifts.length; ++ i) {
      let str = this.toShiftString(shifts[i]);
      scheduled += str +'\n';
    }
    return {
      intro: intro,
      scheduled: scheduled,
      closing: this.closing
    };
  }

  this.getSample = function() {
    return this.buildEmail(this.sample_shifts, 'Test Name');
  }

  this.getAllEmails = function(scheduled) {
    // Given an array of ScheduledShifts, fill in the email field in each
    // entry
    for (let i = 0; i < scheduled.length; ++i) {
      let message = this.buildEmail(scheduled[i].scheduled_shifts, scheduled[i].full_name);
      scheduled[i].email = message;
    }
    return scheduled;
  }


}

export default {
  name: 'schedule',
  data () {
    return {
      scheduler: null,
      calendar: null,
      allow_double_shifting: false,
      previous_double_shift_value: false,
      schedule_results: [],
      name_to_level: {},
      calendar_string: null
    }
  },
  created: function () {
    this.scheduleAll()
  },
  computed: {
    previous_double_shift_value_differs: function() {
      return this.allow_double_shifting !== this.previous_double_shift_value;
    }
  },
  methods : {
    back () {
      this.$router.go(-1);
    },
    scheduleAll() {
      let requests = this.$store.state['valid_rows'];
      let request_month = this.$store.state['schedule_month'];
      if (this.scheduler === null) {
        this.scheduler = new ScheduledShifts(request_month);
        this.calendar = new MonthPrinter(request_month);
        for (let i = 0; i < requests.length; ++i) {
          let results = this.scheduleIndividual(requests[i]);
          this.schedule_results.push(results);
        }
      } else {
        for (let i = 0; i < requests.length; ++i) {
          let previous_results = this.schedule_results[i];
          let updated_results = this.rescheduleIndividual(requests[i], previous_results);
          this.schedule_results[i] = updated_results;
        }
      }
      this.calendar.fillCalendar(this.scheduler, this.name_to_level);
      this.calendar_string = this.calendar.getCalendarString();
      this.email_creator = new EmailCreator(request_month);
      this.schedule_results = this.email_creator.getAllEmails(this.schedule_results);
    },
    scheduleIndividual(entry) {
      let results = new ScheduleResults();
      let full_name = entry.name;
      let level = entry.level === 'Level I = High School Interns' ? 1 : 2;
      let all_requests = entry.primary_requests + entry.alternate_requests;

      this.name_to_level[full_name] = level;
      results.num_primaries_requested = entry.primary_requests.length;
      results.num_alternates_requested = entry.alternate_requests.length;
      results.primary_string = entry.primary_string;
      results.alternate_string = entry.alternate_string;
      results.full_name = full_name;
      results.email_address = entry.email;

      for (let i = 0; i < entry.primary_requests.length; ++i) {
        let shift_time = entry.primary_requests[i];
        if (this.canSchedule(shift_time, full_name, level, true)) {
          this.schedule(shift_time, full_name);
          results.num_scheduled += 1;
          results.num_primaries_booked += 1;
          results.scheduled_shifts.push(shift_time.start_time);
        }
      }
      for (let i = 0; i < entry.alternate_requests.length; ++i) {
        if (results.num_scheduled === results.num_primaries_requested) {
          break;
        }
        let shift_time = entry.alternate_requests[i];
        if (this.canSchedule(shift_time, full_name, level, false)) {
          this.schedule(shift_time, full_name);
          results.num_scheduled += 1;
          results.num_alternates_booked += 1;
          results.scheduled_shifts.push(shift_time.start_time);
        }
      }
      results.scheduled_shifts.sort(function(a, b) {
        if (a.isBefore(b)) {
          return -1;
        } else if (b.isBefore(a)) {
          return 1;
        }
        return 0;
      });
      // console.log('Scheduled', results.num_primaries_booked, 'primaries and', results.num_alternates_booked, 'alternates for', full_name);
      return results;
    },
    canSchedule(shift_time, name, intern_level, is_primary) {
      let shift_start = shift_time.start_time;
      // for alternate requests, prevent working in the same week
      if (!is_primary && this.personWorkingDuringWeek(shift_start, name)) {
          return false;
      }
      let already_scheduled = this.scheduler.num_taken(shift_start);
      if (already_scheduled === 0) {
        return true;
      } else if (already_scheduled === 1) {
        if (this.scheduledLevelDiffers(shift_start, intern_level) || 
            this.weekIsFullEnough(shift_start) || 
            this.allow_double_shifting) {
          return true;
        }
        return false;
      } else {
        return false;
      }
    },
    personWorkingDuringWeek(shift_start, name) {
      let month_start = moment(shift_start).startOf('month');
      let start_sunday = moment(shift_start).startOf('week');
      let next_sunday = moment(start_sunday).add(7, 'days');
      if (start_sunday.isBefore(month_start)) {
        start_sunday = month_start;
      }
      let names = this.peopleWorkingInRange(start_sunday, next_sunday);
      for (let i = 0; i < names.length; ++i) {
        if (name == names[i]) {
          return true;
        }
      }
      return false;
    },
    peopleWorkingInRange(start_time, stop_time) {
      // Returns an array of names currently scheduled between the provided
      // start and stop times.
      let scheduled = this.scheduler.taken_in_range(start_time, stop_time);
      let people = [];
      for (let i = 0; i < scheduled.length; ++i) {
        let person = scheduled[i]['name'];
        people.push(person);
      }
      return people;
    },
    schedule(shift, full_name) {
      let shift_start = shift.start_time;
      this.scheduler.schedule(shift_start, full_name);
      // console.log('Scheduled', full_name, 'at', shift_start.toString());
    },
    scheduledLevelDiffers(shift_start, intern_level) {
      // Returns true if the the provided intern_level and the person working 
      // during the provided shift time are of different levels.
      let name = this.scheduler.name_in_slot(shift_start);
      if (this.name_to_level[name] !== intern_level) {
        return true;
      }
      return false;
    },
    weekIsFullEnough(shift_start) {
      // Returns true if 80% or greater of the "first" slots in a week are 
      // taken. Each slot can sometimes have up to 2 people working, and this
      // only considers those first slots.
      if (this.scheduler.percent_taken_in_week(shift_start) >= 0.8) {
        return true;
      }
      return false;
    },
    rescheduleIndividual(entry, previous_results) {
      let num_to_book = previous_results.num_primaries_requested - previous_results.num_scheduled;
      if (num_to_book <= 0) {
        return previous_results;
      }
      let full_name = previous_results.full_name;
      let level = this.name_to_level[full_name];
      for (let i = 0; i < entry.primary_requests.length; ++i) {
        let shift_time = entry.primary_requests[i];
        if (this.alreadyScheduled(shift_time, previous_results)) {
          continue;
        }
        if (previous_results.num_scheduled === previous_results.num_primaries_requested) {
          break;
        }
        if (this.canSchedule(shift_time, full_name, level, true)) {
          this.schedule(shift_time, full_name);
          previous_results.num_scheduled += 1;
          previous_results.num_primaries_booked += 1;
          previous_results.scheduled_shifts.push(shift_time.start_time);
        }
      }
      for (let i = 0; i < entry.alternate_requests.length; ++i) {
        let shift_time = entry.alternate_requests[i];
        if (this.alreadyScheduled(shift_time, previous_results)) {
          continue;
        }
        if (previous_results.num_scheduled === previous_results.num_primaries_requested) {
          break;
        }

        if (this.canSchedule(shift_time, full_name, level, false)) {
          this.schedule(shift_time, full_name);
          previous_results.num_scheduled += 1;
          previous_results.num_alternates_booked += 1;
          previous_results.scheduled_shifts.push(shift_time.start_time);
        }
      }
      previous_results.scheduled_shifts.sort(function(a, b) {
        if (a.isBefore(b)) {
          return -1;
        } else if (b.isBefore(a)) {
          return 1;
        }
        return 0;
      });
      return previous_results;
    },
    alreadyScheduled(shift_time, previous_results) {
      let shift_string = shift_time.start_time.toString();
      let already_scheduled = false;
      for (let j = 0; j < previous_results.num_scheduled; ++ j) {
        let scheduled_string = previous_results.scheduled_shifts[j].toString();
        if (scheduled_string === shift_string) {
            already_scheduled = true;
            break
        }
      }
      return already_scheduled;
    },
    updateSchedule() {
      // Used to update the schedule in light of policy changes. Toggling the
      // policy is the same as starting from scratch, rather than constantly
      // appending.
      if (!this.allow_double_shifting) {
        this.scheduler = null;
        this.schedule_results = [];
        this.name_to_level=  {};
      }
      this.scheduleAll();
      this.previous_double_shift_value = this.allow_double_shifting;
    },
    copyToClipboard() {
      document.querySelector('.calendar-content').select();
      document.execCommand('copy');
      document.getSelection().removeAllRanges();
    }
  }
}
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