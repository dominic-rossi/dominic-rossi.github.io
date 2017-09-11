<template>
  <div>
    <p class="valid-rows-text">You may copy the text in the box below and re-use it if you need to start over. It contains all of the modifications you made,
      if any, in the previous steps.</p>
    <textarea v-model="validCopy" class="valid-rows-output"></textarea>
  </div>

</template>

<script>
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
  name: 'ShowValid',
  data() {
    return {
      entries: null,
      validRows: [],
      validCopy: null,
      primaryShifts: null,
      alternateShifts: null,
    };
  },
  created() {
    this.entries = this.$store.state.valid_rows;
    this.primaryShifts = this.$store.state.primaryShifts;
    this.alternateShifts = this.$store.state.alternateShifts;
    this.createValidRows();
    this.$store.commit('update_rows', this.validRows);
    this.exportValidRows();
  },
  methods: {
    createValidRows() {
      for (let i = 0; i < this.entries.length; i += 1) {
        const validRow = new Valid();
        validRow.SubmissionTime = this.entries[i][0];
        validRow.name = this.entries[i][1];
        validRow.email = this.entries[i][2];
        validRow.level = this.entries[i][3];
        validRow.primaryRequests = this.primaryShifts[i];
        validRow.alternateRequests = this.alternateShifts[i];
        validRow.comments = this.entries[i][11];
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
    },
    exportValidRows() {
      this.validCopy = '';
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
        this.validCopy += validStr;
      }
    },
  },

};
</script>

<style>
.valid-rows-output {
  height: 175px;
  width: 425px;
  margin: 0px 0px 17px;
}
.valid-rows-text {
  margin: 0px 150px 20px;
}
</style>
