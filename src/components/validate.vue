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
          <tr v-for="idx in wrongTypes">
            <td>{{splitRows[idx][0].format('M/D/YYYY HH:mm:ss')}}</td>
            <td>{{splitRows[idx][1]}}</td>
            <td>{{splitRows[idx][4]}}</td>
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
        <tr v-for="error in errorNames">
          <td>{{splitRows[error.index][0].format('M/D/YYYY HH:mm:ss')}}</td>
          <td><input v-model.lazy="error.name"></input></td>
          <td>{{splitRows[error.index][2]}}</td>
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
          <tr v-for="(rowIdx, dup_num) in duplicate">
            <td>{{splitRows[rowIdx][0].format('M/D/YYYY HH:mm:ss')}}</td>
            <td>{{splitRows[rowIdx][1]}}</td>
            <td>{{splitRows[rowIdx][2]}}</td>
            <td>{{splitRows[rowIdx][11]}}</td>
            <td>
              <button class="btn btn-default" v-on:click="deleteDuplicate(rowIdx)">D</button>
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
        <tr v-for="p in penalizedRequests">
          <td>{{p[2]}}</td>
          <td>{{splitRows[p[0]][1]}}</td>
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
          <th class="custom-th">Delete</th>
        </tr>
        <tr v-for="(row, rowNum) in splitRows" class="shift-table">
          <td>{{row[1]}}</td>
          <td class="shift-td"><textarea v-model="row[9]" class="shift-input" :rows="(row[9].match(/\n/g) || []).length + 1"></textarea></td>
          <td><div v-for="shift in primaryShifts[rowNum]">{{shift.string}}</div></td>
          <td>
            <button class="btn btn-default" v-on:click="deleteRow(rowNum)">D</button>
          </td>
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
          <th class="custom-th">Delete</th>
        </tr>
        <tr v-for="(row, rowNum) in splitRows" class="shift-table">
          <td>{{row[1]}}</td>
          <td class="shift-td"><textarea v-model="row[10]" class="shift-input" :rows="(row[10].match(/\n/g) || []).length + 1"></textarea></td>
          <td><div v-for="shift in alternateShifts[rowNum]">{{shift.string}}</div></td>
          <td>
            <button class="btn btn-default" v-on:click="deleteRow(rowNum)">D</button>
          </td>
        </tr>
      </table>
      <button class="btn btn-default" v-on:click="saveAlternateShifts()">Confirm</button>
    </div>

    <div v-if="validationFinished" class="col-md-8 col-md-offset-2">
      <p class="valid-rows-text">You may copy the text in the box below and re-use it if you need to start over. It contains all of the modifications you made,
      if any, in the previous steps.</p>
      <textarea v-model="validated" class="valid-rows-output"></textarea>
    </div>
  
    <div class="col-md-2 col-md-offset-4 text-left">
      <a v-on:click="back" class="navigation"><i class="fa fa-chevron-left fa-2x"></i></a>
    </div>
    <div class="col-md-2 text-right">
      <a v-show="validationFinished" v-on:click="next" class="navigation"><i class="fa fa-chevron-right fa-2x"></i></a>
    </div>
  </div>
</template>

<script>
import moment from 'moment';

// http://stackoverflow.com/questions/20154368/union-find-implementation-using-python
function indiciesMap(arr) {
  // Return a mapping from a row number to an index number in arr
  const d = {};
  for (let i = 0; i < arr.length; i += 1) {
    for (let j = 0; j < arr[i].length; j += 1) {
      if (arr[i][j] in d) {
        d[arr[i][j]].push(i);
      } else {
        d[arr[i][j]] = [i];
      }
    }
  }
  return d;
}
function disjointIndicies(arr) {
  // Returns a list of disjoint sets of indicies, i.e. clusters
  const d = indiciesMap(arr);
  const sets = [];
  while (Object.keys(d).length > 0) {
    const randomKey = Object.keys(d)[0];
    let que = new Set(d[randomKey]);
    delete d[randomKey];
    const ind = new Set();
    while (que.size > 0) {
      que.forEach((elem) => { ind.add(elem); });
      const set2 = new Set();
      let ind2 = null;
      que.forEach((elem) => {
        arr[elem].forEach((x) => {
          if (Object.prototype.hasOwnProperty.call(d, x)) {
            ind2 = d[x];
          } else {
            return;
          }
          ind2.forEach((y) => {
            set2.add(y);
          });
          delete d[x];
        });
      });

      que = set2;
      const difference = new Set([...que].filter(x => !ind.has(x)));
      que = difference;
    }
    sets.push(ind);
  }
  return sets;
}
function disjointSets(arr) {
  const sets = disjointIndicies(arr);
  const disjoint = [];
  sets.forEach((s) => {
    const cluster = new Set();
    s.forEach((i) => {
    // for (const i of s) {
      arr[i].forEach((x) => {
        cluster.add(x);
      });
    });
    // }
    const clusterArr = Array.from(cluster);
    clusterArr.sort((a, b) => a - b);
    disjoint.push(clusterArr);
  });
  return disjoint;
}
function parseShifts(shifts, firstShiftDay) {
  const year = firstShiftDay.get('year');
  const month = firstShiftDay.get('month');
  const shiftRegex = /(\d+)[^\d]*(\d+)[^\d]*(am|pm|AM|PM)[^\d]*(\d+)[^\d]*(am|pm|AM|PM)/g;
  const parsedShifts = [];
  let match = shiftRegex.exec(shifts);
  while (match !== null) {
  // while ((match = shiftRegex.exec(shifts)) != null) {
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

const Valid = function ValidatedData() {
  this.SubmissionTime = null;
  this.name = null;
  this.email = null;
  this.level = null;
  this.primaryRequests = null;
  this.alternateRequests = null;
  this.comments = null;
  this.primaryString = null;
  this.alternateString = null;
};

export default {
  name: 'validate',
  data() {
    return {
      splitRows: null,
      validRows: [],
      wrongTypes: [],
      errorNames: [],
      duplicates: [],
      penalizedRequests: [],
      primaryShifts: [],
      alternateShifts: [],
      duplicatesUpdated: false,
      checkRequestType: true,
      checkNames: false,
      checkDuplicates: false,
      reorder: false,
      checkPrimaryShifts: false,
      checkAlternateShifts: false,
      validationFinished: false,
      validated: '',
    };
  },
  created() {
    this.splitRows = this.parseRows();
  },
  methods: {
    back() {
      this.$router.go(-1);
    },
    next() {
      this.ensureSaved();
      this.$router.push('/schedule');
    },
    ensureSaved() {
      this.$store.commit('save_valid_rows', this.validRows);
    },
    parseRows() {
      // Find character locations of the submission time in the first column
      const rows = this.$store.state.rows;
      const regex = /\d+\/\d+\/20\d+ \d+:\d+:\d+/g;
      const matches = [];
      let match = regex.exec(rows);
      while (match != null) {
        matches.push(match.index);
        match = regex.exec(rows);
      }
      // Split on the submission time locations
      const splitRows = [];
      let matchIter;
      let start;
      let stop;
      for (matchIter = 1; matchIter < matches.length; matchIter += 1) {
        start = matches[matchIter - 1];
        stop = matches[matchIter];
        splitRows.push(rows.slice(start, stop));
      }
      splitRows.push(rows.slice(stop));
      // Split on the first 12 columns for each row
      let row = null;
      const parsedRows = [];
      for (let i = 0; i < splitRows.length; i += 1) {
        row = splitRows[i].split('\t');
        row = row.slice(0, 12);
        row[0] = moment(row[0], 'M/D/YYYY H:m:s');
        row[9] = row[9].replace(/"/g, '');
        row[10] = row[10].replace(/"/g, '');
        parsedRows.push(row);
      }
      return parsedRows;
    },
    parseName(enteredName) {
      if (enteredName.search(',') > -1) {
        const splitNames = enteredName.toLowerCase().split(',');
        let firstName = splitNames[1].trim();
        firstName = firstName[0].toUpperCase() + splitNames[1].trim().slice(1);
        const lastNames = splitNames[0].trim().split(' ');
        let lastName = '';
        for (let i = 0; i < lastNames.length; i += 1) {
          lastName = `${lastName} ${lastNames[i].trim()[0].toUpperCase()}${lastNames[i].trim().slice(1)}`;
        }
        lastName = lastName.trim();
        const parsedName = {
          firstName,
          lastName,
        };
        return parsedName;
      } else if (enteredName.search(' ') > -1) {
        const splitNames = enteredName.toLowerCase().split(' ');
        const firstName = splitNames[0].trim()[0].toUpperCase() + splitNames[0].trim().slice(1);
        let lastName = '';
        for (let i = 1; i < splitNames.length; i += 1) {
          lastName = `${lastName} ${splitNames[i].trim()[0].toUpperCase()}${splitNames[i].trim().slice(1)}`;
        }
        lastName = lastName.trim();
        const parsedName = {
          firstName,
          lastName,
        };
        return parsedName;
      }
      return null;
    },
    removeWrongTypes() {
      for (let i = this.wrongTypes.length - 1; i >= 0; i -= 1) {
        this.splitRows.splice(this.wrongTypes[i], 1);
      }
      this.wrongTypes = [];
    },
    saveNames() {
      // Due to 2 way data binding, the names are already updated. All that
      // is needed is clearing of the error array.
      for (let i = 0; i < this.errorNames.length; i += 1) {
        this.splitRows[this.errorNames[i].index][1] = this.errorNames[i].name;
      }
      this.errorNames = [];
    },
    deleteDuplicate(idx) {
      this.splitRows.splice(idx, 1);
      this.duplicatesUpdated = true;
    },
    mergeGroup(groupIdx) {
      // Takes the majority of information from the first item in the
      // group and adds the shifts from the others to it
      const firstRowIdx = this.duplicates[groupIdx][0];
      const firstRow = this.splitRows[firstRowIdx];
      let primaries = firstRow[9];
      let alternates = firstRow[10];
      for (let i = 1; i < this.duplicates[groupIdx].length; i += 1) {
        const rowIdx = this.duplicates[groupIdx][i];
        primaries += `\n${this.splitRows[rowIdx][9]}`;
        alternates += `\n${this.splitRows[rowIdx][10]}`;
      }
      for (let i = this.duplicates[groupIdx].length - 1; i > 0; i -= 1) {
        const rowIdx = this.duplicates[groupIdx][i];
        this.splitRows.splice(rowIdx, 1);
      }
      firstRow[9] = primaries;
      firstRow[10] = alternates;
      this.splitRows[firstRowIdx] = firstRow;
      this.duplicatesUpdated = true;
    },
    deleteRow(rowIdx) {
      this.splitRows.splice(rowIdx, 1);
    },
    savePrimaryShifts() {
      this.checkPrimaryShifts = false;
      this.checkAlternateShifts = true;
    },
    saveAlternateShifts() {
      this.checkAlternateShifts = false;
      // save all of this shifts inside the valid object and write the
      // valid object to the vuex store
      // then we can show the next arrow or just auto proceed to the next section
      for (let i = 0; i < this.splitRows.length; i += 1) {
        const validRow = new Valid();
        validRow.SubmissionTime = this.splitRows[i][0];
        validRow.name = this.splitRows[i][1];
        validRow.email = this.splitRows[i][2];
        validRow.level = this.splitRows[i][3];
        validRow.primaryRequests = this.primaryShifts[i];
        validRow.alternateRequests = this.alternateShifts[i];
        validRow.comments = this.splitRows[i][11];
        let primaryString = '';
        if (this.primaryShifts[i][0].day) {
          for (let j = 0; j < this.primaryShifts[i].length; j += 1) {
            primaryString += `${this.primaryShifts[i][j].string}\n`;
          }
        }
        validRow.primaryString = primaryString;
        let alternateString = '';
        if (this.alternateShifts[i][0].day) {
          for (let j = 0; j < this.alternateShifts[i].length; j += 1) {
            alternateString += `${this.alternateShifts[i][j].string}\n`;
          }
        }
        validRow.alternateString = alternateString;
        this.validRows.push(validRow);
      }
      this.exportValidRows();
      this.validationFinished = true;
    },
    exportValidRows() {
      this.validated = '';
      for (let i = 0; i < this.validRows.length; i += 1) {
        let validStr = `${this.validRows[i].SubmissionTime.format('M/D/YYYY HH:mm:ss')}\t`;
        validStr += `${this.validRows[i].name}\t`;
        validStr += `${this.validRows[i].email}\t`;
        validStr += `${this.validRows[i].level}\t`;
        validStr += 'Monthly Shift Requests \t\t\t\t\t';
        if (this.validRows[i].primaryRequests[0].day) {
          for (let j = 0; j < this.validRows[i].primaryRequests.length; j += 1) {
            validStr += this.validRows[i].primaryRequests[j].string;
            if (j < this.validRows[i].primaryRequests.length - 1) {
              validStr += '\n';
            }
          }
        }
        validStr += '\t';
        if (this.validRows[i].alternateRequests[0].day) {
          for (let j = 0; j < this.validRows[i].alternateRequests.length; j += 1) {
            validStr += this.validRows[i].alternateRequests[j].string;
            if (j < this.validRows[i].alternateRequests.length - 1) {
              validStr += '\n';
            }
          }
        }
        validStr += `\t${this.validRows[i].comments}`;
        if (i < this.validRows.length - 1) {
          validStr += '\n';
        }
        this.validated += validStr;
      }
    },
    confirmReorder() {
      for (let i = 0; i < this.penalizedRequests.length; i += 1) {
        const index = this.penalizedRequests[i][0];
        const newSubmissionTime = this.penalizedRequests[i][3];
        this.splitRows[index][0] = newSubmissionTime;
      }
      this.splitRows.sort((a, b) => {
        if (a[0].isBefore(b[0])) {
          return -1;
        } else if (b[0].isBefore(a[0])) {
          return 1;
        }
        return 0;
      });

      this.penalizedRequests = [];
      this.reorder = false;
      this.checkPrimaryShifts = true;
    },
  },
  computed: {
    wrong_shift_types() {
      // stop if we are no longer on this type or if there is something
      // to be fixed
      if (!this.checkRequestType || !!this.wrongTypes.length) {
        return false;
      }
      let requestType;
      for (let i = 0; i < this.splitRows.length; i += 1) {
        requestType = this.splitRows[i][4].trim();
        if (requestType !== 'Monthly Shift Requests') {
          this.wrongTypes.push(i);
        }
      }
      // Pass control to next validation check
      if (!this.wrongTypes.length) {
        this.checkRequestType = false;
        this.checkNames = true;
      }
      return !!this.wrongTypes.length;
    },
    fix_names() {
      // Wait until it is our turn and previous errors have been removed
      if (!this.checkNames || !!this.errorNames.length) {
        return false;
      }
      let name;
      let parsedName;
      for (let i = 0; i < this.splitRows.length; i += 1) {
        name = this.splitRows[i][1].trim();
        parsedName = this.parseName(name);
        if (parsedName === null) {
          const error = {
            name,
            index: i,
          };
          this.errorNames.push(error);
        } else {
          name = `${parsedName.firstName} ${parsedName.lastName}`;
          this.splitRows[i][1] = name;
        }
      }
      if (!this.errorNames.length) {
        this.checkNames = false;
        this.checkDuplicates = true;
        this.duplicatesUpdated = true;
      }

      return !!this.errorNames.length;
    },
    remove_duplicates() {
      // if there is a name or email that is duplicated, consider
      // it a duplicate
      if (!this.checkDuplicates || !this.duplicatesUpdated) {
        return false;
      }
      const names = {};
      const emails = {};
      for (let i = 0; i < this.splitRows.length; i += 1) {
        const name = this.splitRows[i][1].trim();
        const email = this.splitRows[i][2].trim();
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
      const duplicates = [];
      Object.values(names).forEach((nameList) => {
        if (nameList.length > 1) {
          duplicates.push(nameList);
        }
      });
      Object.values(emails).forEach((emailList) => {
        if (emailList.length > 1) {
          duplicates.push(emailList);
        }
      });

      this.duplicates = disjointSets(duplicates);
      if (!this.duplicates.length) {
        this.checkDuplicates = false;
        this.reorder = true;
      }
      this.duplicatesUpdated = false;
      return !!this.duplicates.length;
    },
    reorder_shifts() {
      if (!this.reorder) {
        return false;
      }
      const scheduleOpen = this.$store.state.schedule_open;
      for (let i = 0; i < this.splitRows.length; i += 1) {
        const SubmissionTime = this.splitRows[i][0];
        if (SubmissionTime.isBefore(scheduleOpen)) {
          let overTime;
          const overSeconds = scheduleOpen.diff(SubmissionTime, 'seconds');
          if (overSeconds < 60) {
            overTime = `${overSeconds.toFixed(2)} seconds`;
          } else if (overSeconds >= 60 && overSeconds < 3600) {
            overTime = `${(overSeconds / 60).toFixed(2)} minutes`;
          } else if (overSeconds >= 3600 && overSeconds < 86400) {
            overTime = `${(overSeconds / 3600).toFixed(2)} hours`;
          } else {
            overTime = `${(overSeconds / 86400).toFixed(2)} days`;
          }
          const penalizedTime = moment(scheduleOpen).add(overSeconds, 'seconds');
          const submitted = SubmissionTime.format('M/D/YYYY HH:mm:ss');
          this.penalizedRequests.push([i, overTime, submitted, penalizedTime]);
        }
      }
      if (!this.penalizedRequests.length) {
        this.reorder = false;
        this.checkPrimaryShifts = true;
      }
      return this.penalizedRequests.length;
    },
    fix_primary_shifts() {
      // parse all of the shifts and display them. We don't actually need
      // to save the parsed versions for now, but we probably should after
      // they have confirmed they are all correct.
      if (!this.checkPrimaryShifts) {
        return false;
      }
      const firstDay = this.$store.state.schedule_month;
      for (let i = 0; i < this.splitRows.length; i += 1) {
        const shifts = parseShifts(this.splitRows[i][9], firstDay);
        if (this.primaryShifts.length > i) {
          this.primaryShifts[i] = shifts;
        } else {
          this.primaryShifts.push(shifts);
        }
      }
      return true;
    },
    fix_alternate_shifts() {
      if (!this.checkAlternateShifts) {
        return false;
      }
      const firstDay = this.$store.state.schedule_month;
      for (let i = 0; i < this.splitRows.length; i += 1) {
        const shifts = parseShifts(this.splitRows[i][10], firstDay);
        if (this.alternateShifts.length > i) {
          this.alternateShifts[i] = shifts;
        } else {
          this.alternateShifts.push(shifts);
        }
      }
      return true;
    },
  },
};
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