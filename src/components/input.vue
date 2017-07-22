<template>
  <div class="row">
    <div class="col-xs-12 col-sm-8 col-centered">
      <form v-on:submit.prevent="next">
        <h3>Schedule Inputs</h3>
        <div class="row input-row">
          <div class="col-xs-6">
            <label for="inputArea" class="paste-rows">Input data:</label>
          </div>
          <div class="col-xs-6">
            <textarea v-model.lazy="rows" class="input-box" id="inputArea" placeholder="Paste relevant rows from the Responses sheet here." required></textarea>
          </div>
        </div>

        <div class="row input-row">
          <div class="col-xs-6">
            <label for="scheduleStart">Schedule open time:</label>
          </div>
          <div class="col-xs-6">
            <input id="scheduleStart" class="input-box" type="datetime-local" v-model.lazy="schedule_open" required>
          </div>
        </div>

        <div class="row input-row">
          <div class="col-xs-6">
            <label for="scheduleMonth">Date of the first shift:</label>
          </div>
          <div class="col-xs-6">
            <input id="scheduleMonth" class="input-box" type="date" v-model.lazy="schedule_month" required>
          </div>
        </div>

        <div class="row">
          <div class="col-xs-6">
              <a v-on:click="back" class="navigation"><i class="fa fa-chevron-left fa-2x"></i></a>
          </div>
          <div class="col-xs-6">
            <button type="submit" class="navigation"><i class="fa fa-chevron-right fa-2x"></i></button>
          </div>
        </div>
      </form>

    </div>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'input',
  data() {
    return {
    };
  },
  methods: {
    back() {
      this.$router.go(-1);
    },
    next() {
      this.ensureSaved();
      this.$router.push('/validate');
    },
    ensureSaved() {
      // These fields might not necessarily be edited before leaving the
      // page so we save them here.
      if (!this.$store.state.schedule_open) {
        this.schedule_open = this.schedule_open;
      }
      if (!this.$store.state.schedule_month) {
        this.schedule_month = this.schedule_month;
      }
    },
  },
  computed: {
    rows: {
      get() {
        return this.$store.state.rows;
      },
      set(value) {
        this.$store.commit('save_rows', value);
      },
    },
    schedule_open: {
      get() {
        const savedValue = this.$store.state.schedule_open;
        if (savedValue) {
          return savedValue.format().slice(0, 16);
        }
        const start = moment().set({ date: 1, hour: 18, minute: 0 }).format();
        return start.slice(0, 16);
      },
      set(value) {
        const scheduleOpen = moment(value);
        if (!scheduleOpen.isValid()) {
          return;
        }
        this.$store.commit('save_schedule_open', scheduleOpen);
      },
    },
    schedule_month: {
      get() {
        const savedValue = this.$store.state.schedule_month;
        if (savedValue) {
          return savedValue.format().slice(0, 10);
        }
        const now = moment();
        const month = moment().set({ month: now.get('month') + 1, date: 1 }).format();
        return month.slice(0, 10);
      },
      set(value) {
        const scheduleMonth = moment(value);
        this.$store.commit('save_schedule_month', scheduleMonth);
      },
    },

  },
};
</script>
<style>
.navigation {
  background-color: transparent;
  border: none;
  color: #42b983;
}

.navigation :hover {
  color: #23527c;
}
.input-row {
    margin-bottom: 15px;
}
.input-box {
  width: 200px;
}
.paste-rows {
  margin-top: 16px;
}
.col-centered {
    float: none;
    margin-right: auto;
    margin-left: auto;
}
</style>