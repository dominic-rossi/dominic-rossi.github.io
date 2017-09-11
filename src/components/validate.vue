<template>
  <div class="row">
    <div v-if="checkShiftTypes" class="col-md-6 col-md-offset-3">
      <remove-wrong-types v-on:wrongTypesDone="wrongTypesDone"></remove-wrong-types>
    </div>

    <div v-if="checkNames" class="col-md-6 col-md-offset-3">
      <fix-names v-on:namesDone="namesDone"></fix-names>
    </div>

    <div v-if="checkDuplicates" class="col-md-8 col-md-offset-2">
      <remove-duplicates v-on:duplicatesDone="duplicatesDone"></remove-duplicates>
    </div>

    <div v-if="checkScheduleOrder" class="col-md-6 col-md-offset-3">
      <reorder-requests v-on:reorderDone="reorderDone"></reorder-requests>
    </div>

    <div v-if="checkPrimary" class="col-md-8 col-md-offset-2">
      <fix-primaries v-on:primaryDone="primaryDone"></fix-primaries>
    </div>

    <div v-if="checkAlternate" class="col-md-8 col-md-offset-2">
      <fix-alternates v-on:alternateDone="alternateDone"></fix-alternates>
    </div>

    <div v-if="validationDone" class="col-md-8 col-md-offset-2">
      <show-valid v-on:validDone="next"></show-valid>
    </div>

    <div class="col-md-2 col-md-offset-4 text-left">
      <a v-on:click="back" class="navigation"><i class="fa fa-chevron-left fa-2x"></i></a>
    </div>
    <div class="col-md-2 text-right">
      <a v-show="validationDone" v-on:click="next" class="navigation"><i class="fa fa-chevron-right fa-2x"></i></a>
    </div>

  </div>

</template>

<script>
import moment from 'moment';
import RemoveWrongTypes from '@/components/validate/RemoveWrongTypes';
import FixNames from '@/components/validate/FixNames';
import RemoveDuplicates from '@/components/validate/RemoveDuplicates';
import ReorderRequests from '@/components/validate/ReorderRequests';
import FixPrimaries from '@/components/validate/FixPrimaries';
import FixAlternates from '@/components/validate/FixAlternates';
import ShowValid from '@/components/validate/ShowValid';

export default {
  name: 'validate',
  components: {
    RemoveWrongTypes,
    FixNames,
    RemoveDuplicates,
    ReorderRequests,
    FixPrimaries,
    FixAlternates,
    ShowValid,
  },
  data() {
    return {
      checkShiftTypes: false,
      checkNames: false,
      checkDuplicates: false,
      checkScheduleOrder: false,
      checkPrimary: false,
      checkAlternate: false,
      validationDone: false,
      duplicates: [],
    };
  },
  created() {
    const splitRows = this.parseRows();
    this.$store.commit('update_rows', splitRows);
    this.checkShiftTypes = true;
  },
  methods: {
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
    wrongTypesDone() {
      this.checkShiftTypes = false;
      this.checkNames = true;
    },
    namesDone() {
      this.checkNames = false;
      this.checkDuplicates = true;
    },
    duplicatesDone() {
      this.checkDuplicates = false;
      this.checkScheduleOrder = true;
    },
    reorderDone() {
      this.checkScheduleOrder = false;
      this.checkPrimary = true;
    },
    primaryDone() {
      this.checkPrimary = false;
      this.checkAlternate = true;
    },
    alternateDone() {
      this.checkAlternate = false;
      this.validationDone = true;
    },
    next() {
      this.$router.push('/schedule');
    },
    back() {
      this.$router.go(-1);
    },
  },
};
</script>

<style>
table {
  text-align: center;
}
th {
  text-align: center;
}
.custom-th {
  text-align: center
}
</style>
