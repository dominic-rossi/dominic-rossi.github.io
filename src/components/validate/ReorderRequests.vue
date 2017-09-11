<template>
  <div>
    <p>The following shifts will be penalized due to early submission:</p>
    <table class="table table-condensed">
      <tr>
        <th class="custom-th">Submission Time</th>
        <th class="custom-th">Name</th>
        <th class="custom-th">Submission Penalty</th>
      </tr>
      <tr v-for="p in penalizedRequests">
        <td>{{p[2]}}</td>
        <td>{{entries[p[0]][1]}}</td>
        <td>{{p[1]}}</td>
      </tr>
    </table>
    <button class="btn btn-default" v-on:click="confirmReorder()">Confirm</button>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'ReorderRequests',
  data() {
    return {
      penalizedRequests: [],
      entries: null,
    };
  },
  created() {
    this.entries = this.$store.state.valid_rows;
    this.checkForSubmissionPenalties();
  },
  methods: {
    checkForSubmissionPenalties() {
      const scheduleOpen = this.$store.state.schedule_open;
      for (let i = 0; i < this.entries.length; i += 1) {
        const SubmissionTime = this.entries[i][0];
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
        this.$emit('reorderDone');
      }
    },
    confirmReorder() {
      for (let i = 0; i < this.penalizedRequests.length; i += 1) {
        const index = this.penalizedRequests[i][0];
        const newSubmissionTime = this.penalizedRequests[i][3];
        this.entries[index][0] = newSubmissionTime;
      }
      this.entries.sort((a, b) => {
        if (a[0].isBefore(b[0])) {
          return -1;
        } else if (b[0].isBefore(a[0])) {
          return 1;
        }
        return 0;
      });
      this.penalizedRequests = [];
      this.$store.commit('update_rows', this.entries);
      this.$emit('reorderDone');
    },
  },
};
</script>

<style>
  
</style>
