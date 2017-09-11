<template>
  <div>
    <p>We found some non Monthly Shift Requests. Would you like to remove them? </p>
    <table class="table table-condensed">
      <tr>
        <th class="custom-th">Submission Time</th>
        <th class="custom-th">Name</th>
        <th class="custom-th">Shift Type</th>
      </tr>
      <tr v-for="idx in wrongTypes">
        <td>{{entries[idx][0].format('M/D/YYYY HH:mm:ss')}}</td>
        <td>{{entries[idx][1]}}</td>
        <td>{{entries[idx][4]}}</td>
      </tr>
    </table>
    <button class="btn btn-default remove-wrong-types" v-on:click="removeWrongTypes()">Remove all</button>
  </div>
</template>

<script>
export default {
  name: 'RemoveWrongTypes',
  data() {
    return {
      wrongTypes: [],
      entries: null,
    };
  },
  created() {
    this.entries = this.$store.state.valid_rows;
    this.checkForWrongTypes();
  },
  methods: {
    checkForWrongTypes() {
      for (let i = 0; i < this.entries.length; i += 1) {
        const requestType = this.entries[i][4].trim();
        if (requestType !== 'Monthly Shift Requests') {
          this.wrongTypes.push(i);
        }
      }
      if (!this.wrongTypes.length) {
        this.$emit('wrongTypesDone');
      }
    },
    removeWrongTypes() {
      for (let i = this.wrongTypes.length - 1; i >= 0; i -= 1) {
        this.entries.splice(this.wrongTypes[i], 1);
      }
      this.wrongTypes = [];
      this.$store.commit('update_rows', this.entries);
      this.checkForWrongTypes();
    },
  },
};
</script>

<style>
.remove-wrong-types {
  margin: 7px 0px 18px;
}
</style>
