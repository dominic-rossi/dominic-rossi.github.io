<template>
  <div class="row">
    <div v-if="wrong_shift_types" class="col-md-6 col-md-offset-3">
        <p>We found some non Monthly Shift Requests. Would you like to remove them? </p>
        <table class="table table-condensed">
          <tr>
            <th class="custom-th">Submission Time</th>
            <th class="custom-th">Name</th>
            <th class="custom-th">Shift Type</th>
          </tr>
          <tr v-for="idx in wrong_types">
            <td>{{split_rows[idx][0].format('M/D/YYYY HH:mm:ss')}}</td>
            <td>{{split_rows[idx][1]}}</td>
            <td>{{split_rows[idx][4]}}</td>
          </tr>
        </table>
        <button class="btn btn-default remove-wrong-types" v-on:click="removeWrongTypes()">Remove all</button>
    </div>

    <div v-if="fix_names" class="col-md-6 col-md-offset-3">
      <p>Please ensure the following names are in the format "Lastname, Firstname".</p>
      <table class="table table-condensed">
        <tr>
          <th class="custom-th">Submission Time</th>
          <th class="custom-th">Name</th>
          <th class="custom-th">Email</th>
        </tr>
        <tr v-for="error in error_names">
          <td>{{split_rows[error.index][0].format('M/D/YYYY HH:mm:ss')}}</td>
          <td><input v-model.lazy="error.name"></input></td>
          <td>{{split_rows[error.index][2]}}</td>
        </tr>
      </table>
      <button class="btn btn-default" v-on:click="saveNames()">Save</button>
    </div>

    <div v-if="remove_duplicates" class="col-md-8 col-md-offset-2">
      <p>Some duplicate entries have been found.</p>
      <table class="table table-condensed table-no-border">
        <tr>
          <th class="custom-th">Submission Time</th>
          <th class="custom-th">Name</th>
          <th class="custom-th">Email</th>
          <th class="notes-col custom-th">Notes</th>
          <th class="custom-th">Delete</th>
          <th class="custom-th">Merge</th>
        </tr>
        <tbody v-for="(duplicate, index) in duplicates">
          <tr v-for="(row_ix, dup_num) in duplicate">
            <td>{{split_rows[row_ix][0].format('M/D/YYYY HH:mm:ss')}}</td>
            <td>{{split_rows[row_ix][1]}}</td>
            <td>{{split_rows[row_ix][2]}}</td>
            <td>{{split_rows[row_ix][11]}}</td>
            <td>
              <button class="btn btn-default" v-on:click="deleteDuplicate(row_ix)">D</button>
            </td>
            <td v-if="dup_num === 0" :rowspan="duplicate.length" class="dup-num">
              <button class="btn btn-default" v-on:click="mergeGroup(index)">M</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="reorder_shifts" class="col-md-6 col-md-offset-3">
      <p>The following shifts will be penalized due to early submission:</p>
      <table class="table table-condensed">
        <tr>
          <th class="custom-th">Submission Time</th>
          <th class="custom-th">Name</th>
          <th class="custom-th">Submission Penalty</th>
        </tr>
        <tr v-for="p in penalized_requests">
          <td>{{p[2]}}</td>
          <td>{{split_rows[p[0]][1]}}</td>
          <td>{{p[1]}}</td>
        </tr>
      </table>
      <button class="btn btn-default" v-on:click="confirmReorder()">Confirm</button>
    </div>

    <div v-if="fix_primary_shifts" class="col-md-8 col-md-offset-2">
      <p class="fix-shifts-text">Ensure that each of the shifts listed on the left matches the parsed one on the right.</p>
      <table class="table table-condensed">
        <tr class="shift-table">
          <th class="custom-th">Name</th>
          <th class="custom-th">Entered Shifts</th>
          <th class="custom-th">Normalized Shifts</th>
        </tr>
        <tr v-for="(row, row_num) in split_rows" class="shift-table">
          <td>{{row[1]}}</td>
          <td class="shift-td"><textarea v-model="row[9]" class="shift-input" :rows="(row[9].match(/\n/g) || []).length + 1"></textarea></td>
          <td><div v-for="shift in primary_shifts[row_num]">{{shift.string}}</div></td>
        </tr>
      </table>
      <button class="btn btn-default" v-on:click="savePrimaryShifts()">Confirm</button>
    </div>

    <div v-if="fix_alternate_shifts" class="col-md-8 col-md-offset-2">
      <p class="fix-shifts-text">Ensure that each of the shifts listed on the left matches the parsed one on the right.</p>
      <table class="table table-condensed">
        <tr class="shift-table">
          <th class="custom-th">Name</th>
          <th class="custom-th">Entered Shifts</th>
          <th class="custom-th">Normalized Shifts</th>
        </tr>
        <tr v-for="(row, row_num) in split_rows" class="shift-table">
          <td>{{row[1]}}</td>
          <td class="shift-td"><textarea v-model="row[10]" class="shift-input" :rows="(row[10].match(/\n/g) || []).length + 1"></textarea></td>
          <td><div v-for="shift in alternate_shifts[row_num]">{{shift.string}}</div></td>
        </tr>
      </table>
      <button class="btn btn-default" v-on:click="saveAlternateShifts()">Confirm</button>
    </div>

    <div v-if="validation_finished" class="col-md-8 col-md-offset-2">
      <p class="valid-rows-text">You may copy the text in the box below and re-use it if you need to start over. It contains all of the modifications you made,
      if any, in the previous steps.</p>
      <textarea v-model="validated" class="valid-rows-output"></textarea>
    </div>
  
    <div class="col-md-2 col-md-offset-4 text-left">
      <a v-on:click="back" class="navigation"><i class="fa fa-chevron-left fa-2x"></i></a>
    </div>
    <div class="col-md-2 text-right">
      <a v-show="validation_finished" v-on:click="next" class="navigation"><i class="fa fa-chevron-right fa-2x"></i></a>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

// TODO: add sorting by submission penalty. The user should be notified that
// the penalty has been applied and what if any effect they would like the 
// penalty to have.

// http://stackoverflow.com/questions/20154368/union-find-implementation-using-python
function indiciesMap(arr) {
  // Return a mapping from a row number to an index number in arr
  var d = {};
  for (var i=0; i < arr.length; ++i) {
    for (var j=0; j < arr[i].length; ++j) {
      if (arr[i][j] in d) {
        d[arr[i][j]].push(i)
      } else {
        d[arr[i][j]] = [i]
      }
    }
  }
  return d
};
function disjointIndicies(arr) {
  // Returns a list of disjoint sets of indicies, i.e. clusters
  var d = indiciesMap(arr);
  var sets = [];
  while (Object.keys(d).length > 0) {
    var random_key = Object.keys(d)[0];
    var que = new Set(d[random_key]);
    delete d[random_key];
    var ind = new Set();
    while (que.size > 0) {
      for (var elem of que) {
        ind.add(elem);
      }
      var set2 = new Set();
      for (let elem of que) {
        arr[elem].forEach(function(x) {
          if (d.hasOwnProperty(x)) {
            var ind2 = d[x];
          } else {
            return;
          }
          ind2.forEach(function (y) {
            set2.add(y);
          });
          delete d[x];
        });
      }
      que = set2
      var difference = new Set([...que].filter(x => !ind.has(x)));
      que = difference;
    }
    sets.push(ind);
  }
  return sets;
};
function disjointSets(arr) {
  var sets = disjointIndicies(arr);
  var disjoint_sets = [];
  sets.forEach(function (s) {
    var cluster = new Set();
    for (let i of s) {
      arr[i].forEach(function (x) {
        cluster.add(x);
      });
    }
    let cluster_arr = Array.from(cluster)
    cluster_arr.sort(function (a, b) {
      return a - b;
    });
    disjoint_sets.push(cluster_arr);
  });
  return disjoint_sets;
};
function parseShifts(shifts, first_shift_day) {
    var year = first_shift_day.get('year');
    var month = first_shift_day.get('month');
    var shift_regex = /(\d+)[^\d]*(\d+)[^\d]*(am|pm|AM|PM)[^\d]*(\d+)[^\d]*(am|pm|AM|PM)/g;
    var parsed_shifts = [];
    var match;
    while ((match = shift_regex.exec(shifts)) != null)
    {
        var shift = {
            start_index: match.index,
            text: match[0],
            day: Number(match[1]),
            start_hour: Number(match[2]),
            start_meridian: match[3].toLowerCase(),
            stop_hour: Number(match[4]),
            stop_meridian: match[5].toLowerCase(),
        };
        if ((shift.start_meridian === 'am' && shift.start_hour !== 12) || 
            (shift.start_meridian === 'pm' && shift.start_hour === 12)) {
            shift.start_time = moment([year, month, shift.day, shift.start_hour]);
        } else if (shift.start_meridian === 'am' && shift.start_hour === 12) {
            shift.start_time = moment([year, month, shift.day, 0]);
        } else {
            shift.start_time = moment([year, month, shift.day, shift.start_hour+12])           
        }
        if ((shift.stop_meridian === 'am' && shift.stop_hour !== 12) ||
            (shift.stop_meridian === 'pm' && shift.stop_hour === 12)) {
            shift.stop_time = moment([year, month, shift.day, shift.stop_hour]);
        } else if (shift.stop_meridian === 'am' && shift.stop_hour === 12) {
            shift.stop_time = moment([year, month, shift.day, 0]);
        } else {
            shift.stop_time = moment([year, month, shift.day, shift.stop_hour+12]);
        }
        shift['string'] = shift.start_time.format('dddd, MMMM Do ha') + '-' + shift.stop_time.format('ha');
        parsed_shifts.push(shift);
    }
    if (parsed_shifts.length === 0) {
        var no_shifts = {'string': 'Could not find any shifts in the expected format.'};
        parsed_shifts.push(no_shifts);
    }
    return parsed_shifts;
}

var Valid = function () {
  this.submission_time = null;
  this.name = null;
  this.email = null;
  this.level = null;
  this.primary_requests = null;
  this.alternate_requests = null;
  this.comments = null;
  this.primary_string = null;
  this.alternate_string = null;
};

export default {
  name: 'validate',
  data () {
    return {
      split_rows: null,
      valid_rows: [],
      wrong_types: [],
      error_names: [],
      duplicates: [],
      penalized_requests: [],
      primary_shifts: [],
      alternate_shifts: [],
      duplicates_updated: false,
      check_request_type: true,
      check_names: false,
      check_duplicates: false,
      reorder: false,
      check_primary_shifts: false,
      check_alternate_shifts: false,
      validation_finished: false,
      validated: ''
    }
  },
  created : function() {
    this.split_rows = this.splitRows();
  },
  methods : {
    back () {
      this.$router.go(-1);
    },
    next () {
      this.ensureSaved();
      this.$router.push('/schedule');
    },
    ensureSaved () {
      this.$store.commit('save_valid_rows', this.valid_rows);
    },
    splitRows () {
      // Find character locations of the submission time in the first column
      var rows = this.$store.state['rows'];
      var regex =  /\d+\/\d+\/20\d+ \d+:\d+:\d+/g;
      var matches = [];
      var match = regex.exec(rows);
      while (match != null)
      {
        matches.push(match.index);
        match = regex.exec(rows);
      }
      // Split on the submission time locations
      var split_rows = [];
      var match_iter;
      var start;
      var stop;
      for (match_iter = 1 ; match_iter < matches.length; match_iter++)
      {
        start = matches[match_iter-1];
        stop = matches[match_iter];
        split_rows.push(rows.slice(start, stop));
      }
      split_rows.push(rows.slice(stop));
      // Split on the first 12 columns for each row
      var row = null;
      var parsed_rows = [];
      for (var i = 0; i < split_rows.length; i++)
      {
        row = split_rows[i].split('\t');
        row = row.slice(0, 12);
        row[0] = moment(row[0], 'M/D/YYYY H:m:s')
        row[9] = row[9].replace(/"/g, '');
        row[10] = row[10].replace(/"/g, '');
        parsed_rows.push(row);
      }
      return parsed_rows;
    },
    parseName (entered_name) {
      entered_name
      if (entered_name.search(',') > -1) {
        var split_names = entered_name.toLowerCase().split(',')
        var first_name = split_names[1].trim()
        first_name = first_name[0].toUpperCase() + split_names[1].trim().slice(1)
        var last_names = split_names[0].trim().split(' ')
        var last_name = '';
        for (var i = 0; i < last_names.length; ++ i) {
          last_name = last_name + ' ' + last_names[i].trim()[0].toUpperCase() + last_names[i].trim().slice(1)
        }
        last_name = last_name.trim()
        var parsed_name = {
          'first_name': first_name,
          'last_name': last_name
        };
        return parsed_name;
        } else if (entered_name.search(' ') > -1) {
          var split_names = entered_name.toLowerCase().split(' ')
          var first_name = split_names[0].trim()[0].toUpperCase() + split_names[0].trim().slice(1)
          var last_name = '';
          for (var i = 1; i < split_names.length; ++ i) {
            last_name = last_name + ' ' + split_names[i].trim()[0].toUpperCase() + split_names[i].trim().slice(1)
          }
          last_name = last_name.trim()
          var parsed_name = {
            'first_name': first_name,
            'last_name': last_name
          }
          return parsed_name
        } else {
          return null;
        }
    },
    removeWrongTypes () {
      var remove_idx;
      for (var i = this.wrong_types.length - 1; i >=0; --i) {
        this.split_rows.splice(this.wrong_types[i], 1);
      }
      this.wrong_types  = [];
    },
    saveNames () {
      // Due to 2 way data binding, the names are already updated. All that
      // is needed is clearing of the error array.
      for (var i=0; i < this.error_names.length; ++i) {
        this.split_rows[this.error_names[i].index][1] = this.error_names[i].name;
      }
      this.error_names = [];
    },
    deleteDuplicate (idx) {
      this.split_rows.splice(idx, 1);
      this.duplicates_updated = true;
    },
    mergeGroup (group_idx) {
      // Takes the majority of information from the first item in the
      // group and adds the shifts from the others to it
      var first_row_idx = this.duplicates[group_idx][0];
      var first_row = this.split_rows[first_row_idx];
      var primaries = first_row[9];
      var alternates = first_row[10];
      for (var i = 1; i < this.duplicates[group_idx].length; ++i) {
        var row_idx = this.duplicates[group_idx][i];
        primaries += "\n" + this.split_rows[row_idx][9];
        alternates += "\n" + this.split_rows[row_idx][10];
      }
      for (var i = this.duplicates[group_idx].length-1; i > 0; --i) {
        var row_idx = this.duplicates[group_idx][i];
        this.split_rows.splice(row_idx, 1);
      }
      first_row[9] = primaries;
      first_row[10] = alternates;
      this.split_rows[first_row_idx] = first_row;
      this.duplicates_updated = true;
    },
    savePrimaryShifts () {
      this.check_primary_shifts = false;
      this.check_alternate_shifts = true;
    },
    saveAlternateShifts () {
      this.check_alternate_shifts = false;
      // save all of this shifts inside the valid object and write the
      // valid object to the vuex store
      // then we can show the next arrow or just auto proceed to the next section
      for (var i = 0; i < this.split_rows.length; ++i) {
        var valid_row = new Valid();
        valid_row.submission_time = this.split_rows[i][0];
        valid_row.name = this.split_rows[i][1];
        valid_row.email = this.split_rows[i][2];
        valid_row.level = this.split_rows[i][3];
        valid_row.primary_requests = this.primary_shifts[i];
        valid_row.alternate_requests = this.alternate_shifts[i];
        valid_row.comments = this.split_rows[i][11];
        let primary_string = '';
        for (let j = 0; j < this.primary_shifts[i].length; ++j) {
          primary_string += this.primary_shifts[i][j].string + '\n';
        }
        valid_row.primary_string = primary_string;
        let alternate_string = '';
        for (let j = 0; j < this.alternate_shifts[i].length; ++ j) {
          alternate_string += this.alternate_shifts[i][j].string + '\n';
        }
        valid_row.alternate_string = alternate_string;
        this.valid_rows.push(valid_row);
      }
      this.exportValidRows()
      this.validation_finished = true;
    },
    exportValidRows() {
      this.validated = '';
      for (var i = 0; i < this.valid_rows.length; ++i) {
        var valid_str = this.valid_rows[i].submission_time.format('M/D/YYYY HH:mm:ss') + '\t';
        valid_str += this.valid_rows[i].name + '\t';
        valid_str += this.valid_rows[i].email + '\t';
        valid_str += this.valid_rows[i].level + '\t';
        valid_str += 'Monthly Shift Requests \t\t\t\t\t';
        for (var j = 0; j < this.valid_rows[i].primary_requests.length; ++j) {
          valid_str += this.valid_rows[i].primary_requests[j].string;
          if (j < this.valid_rows[i].primary_requests.length - 1) {
            valid_str += '\n';
          }
        }
        valid_str += '\t';
        for (var j = 0; j < this.valid_rows[i].alternate_requests.length; ++j) {
          valid_str += this.valid_rows[i].alternate_requests[j].string;
          if (j < this.valid_rows[i].alternate_requests.length - 1) {
            valid_str += '\n';
          }
        }
        valid_str += '\t' + this.valid_rows[i].comments;
        if (i < this.valid_rows.length - 1) {
          valid_str += '\n';
        }
        this.validated += valid_str;
      }
    },
    confirmReorder() {
      for (let i = 0; i < this.penalized_requests.length; ++i) {
        let index = this.penalized_requests[i][0];
        let new_submission_time = this.penalized_requests[i][3];
        this.split_rows[index][0] = new_submission_time;
      }
      this.split_rows.sort(function(a, b) {
        if (a[0].isBefore(b[0])) {
          return -1;
        } else if (b[0].isBefore(a[0])) {
          return 1;
        }
        return 0;
      });

      this.penalized_requests = [];
      this.reorder = false;
      this.check_primary_shifts = true;

    }
  },
  computed: {
    wrong_shift_types: function() {
      // stop if we are no longer on this type or if there is something
      // to be fixed
      if (!this.check_request_type || !!this.wrong_types.length) {
        return false;
      }
      var request_type;
      for (var i=0; i < this.split_rows.length; ++i) {
          request_type = this.split_rows[i][4].trim();
          if (request_type !== 'Monthly Shift Requests') {
            this.wrong_types.push(i);
          }
      }
      // Pass control to next validation check
      if (!this.wrong_types.length) {
        this.check_request_type = false;
        this.check_names = true;
      }
      return !!this.wrong_types.length;
    },
    fix_names: function() {
      // Wait until it is our turn and previous errors have been removed
      if (!this.check_names || !!this.error_names.length) {
        return false;
      }
      var name;
      var parsed_name;
      for (var i=0; i < this.split_rows.length; ++i)
      {
        name = this.split_rows[i][1].trim();
        parsed_name = this.parseName(name);
        if (parsed_name === null) {
          var error = {
            name: name,
            index: i
          };
          this.error_names.push(error);
        } else {
          let name = parsed_name.first_name + ' ' + parsed_name.last_name;
          this.split_rows[i][1] = name;
        }
      }
      if (!this.error_names.length) {
        this.check_names = false;
        this.check_duplicates = true;
        this.duplicates_updated = true;
      }

      return !!this.error_names.length;
    },
    remove_duplicates: function() {
      //if there is a name or email that is duplicated, consider
      // it a duplicate
      if (!this.check_duplicates || !this.duplicates_updated) {
        return false;
      }
      var names = {};
      var emails = {};
      for (var i=0; i < this.split_rows.length; ++i) {
        var name = this.split_rows[i][1].trim();
        var email = this.split_rows[i][2].trim();
        if (name in names) {
          names[name].push(i);
        } else {
          names[name] = [i];
        }
        if (email in emails) {
          emails[email].push(i);
        } else {
          emails[email] = [i];
        }
      }
      // If either name or email has a duplicate in any place, add it to
      // the duplicates array
      var duplicates = [];
      for (name in names) {
        if (!names.hasOwnProperty(name)) {
          continue;
        }
        if (names[name].length > 1) {
          duplicates.push(names[name]);
        }
      }
      for (email in emails) {
        if (!emails.hasOwnProperty(email)) {
          continue;
        }
        if (emails[email].length > 1) {
          duplicates.push(emails[email]);
        }
      }
      this.duplicates = disjointSets(duplicates)
      if (!this.duplicates.length) {
        this.check_duplicates = false;
        this.reorder = true;
      }
      this.duplicates_updated = false;
      return !!this.duplicates.length;
    },
    reorder_shifts: function() {
      if (!this.reorder) {
        return false;
      }
      let schedule_open = this.$store.state['schedule_open'];
      for (var i=0; i < this.split_rows.length; ++i) {
        let submission_time = this.split_rows[i][0];
        if (submission_time.isBefore(schedule_open)) {
          let over_time;
          let over_seconds = schedule_open.diff(submission_time, 'seconds');
          if (over_seconds < 60) {
            over_time = over_seconds.toFixed(2) + ' seconds';
          } else if (over_seconds >= 60 && over_seconds < 3600) {
            over_time = (over_seconds/60).toFixed(2) + ' minutes';
          } else if (over_seconds >= 3600 && over_seconds < 86400) {
            over_time = (over_seconds/3600).toFixed(2) + ' hours';
          } else {
            over_time = (over_seconds/86400).toFixed(2) + ' days';
          }
          let penalized_time = moment(schedule_open).add(over_seconds, 'seconds');
          let submitted = submission_time.format('M/D/YYYY HH:mm:ss');
          this.penalized_requests.push([i, over_time, submitted, penalized_time]);
        }
      }
      if (!this.penalized_requests.length) {
        this.reorder = false;
        this.check_primary_shifts = true;
      }
      return this.penalized_requests.length;
    },
    fix_primary_shifts: function() {
      // parse all of the shifts and display them. We don't actually need
      // to save the parsed versions for now, but we probably should after
      // they have confirmed they are all correct.
      if (!this.check_primary_shifts) {
        return false;
      }
      var first_day = this.$store.state.schedule_month;
      for (var i = 0; i < this.split_rows.length; ++i) {
          var shifts = parseShifts(this.split_rows[i][9], first_day);
          if (this.primary_shifts.length > i) {
            this.primary_shifts[i] = shifts;
          } else {
            this.primary_shifts.push(shifts);
          }
      }
      return true;
    },
    fix_alternate_shifts: function() {
      if (!this.check_alternate_shifts) {
        return false;
      }
      var first_day = this.$store.state.schedule_month;
      for (var i = 0; i < this.split_rows.length; ++i) {
          var shifts = parseShifts(this.split_rows[i][10], first_day);
          if (this.alternate_shifts.length > i) {
            this.alternate_shifts[i] = shifts;
          } else {
            this.alternate_shifts.push(shifts);
          }
      }
      return true
    }
  }
}
</script>

<style>
ul {
  list-style-type: disc;
}

table {
  text-align: center;
}

th {
  text-align: center;
}

li {
  display: block;
  margin: 0 10px;
}
table>tbody>tr>td.dup-num {
  vertical-align: middle;
}
.table-no-border>thead>tr>th, 
.table-no-border>tbody>tr>th, 
.table-no-border>tfoot>tr>th, 
.table-no-border>thead>tr>td, 
.table-no-border>tbody>tr>td, 
.table-no-border>tfoot>tr>td {
  border-top: none; 
}
.table-no-border>tr>th {
  border-bottom: 2px solid grey;
}
.notes-col {
  min-width: 100px;
}
.shift-table {
  border-bottom: 1px solid grey;
}
.shift-input {
  width: 300px;
}
.shift-td {
  padding-top: 10px;
}
.valid-rows-output {
  height: 175px;
  width: 425px;
  margin: 0px 0px 17px;
}
.valid-rows-text {
  margin: 0px 150px 20px;
}
.remove-wrong-types {
  margin: 7px 0px 18px;
}
.navigation {
  background-color: transparent;
  border: none;
  color: #42b983;
}
.navigation :hover {
  color: #23527c;
}
.custom-th {
  text-align: center
}
</style>