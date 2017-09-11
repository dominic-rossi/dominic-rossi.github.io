<template>
  <div v-if="updateShiftView">
    <p class="fix-shifts-text">Ensure that each of the shifts listed on the left matches the parsed one on the right.</p>
    <table class="table table-condensed">
      <tr class="shift-table">
        <th class="custom-th">Name</th>
        <th class="custom-th">Entered Shifts</th>
        <th class="custom-th">Normalized Shifts</th>
        <th class="custom-th">Delete</th>
      </tr>
      <tr v-for="(row, rowNum) in entries" class="shift-table">
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
  
</template>

<script>
import parseShifts from '@/utils/parse';

export default {
  name: 'FixPrimaries',
  data() {
    return {
      entries: null,
      primaryShifts: [],
      startParsing: false,
    };
  },
  created() {
    this.entries = this.$store.state.valid_rows;
    this.startParsing = true;
  },
  methods: {
    savePrimaryShifts() {
      this.$store.commit('save_primary', this.primaryShifts);
      this.$emit('primaryDone');
    },
  },
  computed: {
    updateShiftView() {
      if (!this.startParsing) {
        return false;
      }
      const firstDay = this.$store.state.schedule_month;
      for (let i = 0; i < this.entries.length; i += 1) {
        const shifts = parseShifts(this.entries[i][9], firstDay);
        if (this.primaryShifts.length > i) {
          this.primaryShifts[i] = shifts;
        } else {
          this.primaryShifts.push(shifts);
        }
      }
      return true;
    },
  },
};
</script>

<style>
.shift-table {
  border-bottom: 1px solid grey;
}
.shift-input {
  width: 300px;
}
.shift-td {
  padding-top: 10px;
}
</style>
