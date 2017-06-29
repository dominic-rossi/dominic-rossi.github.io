<template>
    <div>
        <div class="row">
            <h3>Schedule Inputs</h3>
        </div>
        <form v-on:submit.prevent="next">
          <div class="row">
            <div class="col-md-4 col-md-offset-4">

              <div class="row input-row">
                <div class="col-md-6 text-left">
                  <label for="inputArea" style="margin-top: 29px">Input data:</label>
                </div>
                <div class="col-md-6 text-left" style="width: 228px;">
                  <textarea v-model.lazy="rows" id="inputArea" placeholder="Paste relevant rows from the Responses sheet here." required></textarea>
                </div>
              </div>

              <div class="row input-row">
                <div class="col-md-6 text-left">
                  <label for="scheduleStart">Schedule open time:</label>
                </div>
                <div class="col-md-6 text-left">
                  <input id="scheduleStart" type="datetime-local" v-model.lazy="schedule_open" required>
                </div>
              </div>

              <div class="row input-row">
                <div class="col-md-6 text-left">
                  <label for="scheduleMonth">Date of the first shift:</label>
                </div>
                <div class="col-md-6 text-left">
                  <input id="scheduleMonth" type="date" v-model.lazy="schedule_month" required>
                </div>
              </div>

              <div class="row text-left" style="margin-top: 20px;">
                  <div class="col-md-6 col-md-offset-2">
                      <a v-on:click="back" class="navigation"><i class="fa fa-chevron-left fa-2x"></i></a>
                  </div>
                  <div class="col-md-4">
                    <button type="submit" class="navigation"><i class="fa fa-chevron-right fa-2x"></i></button>
                  </div>
              </div>
            </div>
          </div>
        </form>
    </div>
</template>
<script>
import moment from 'moment'

export default {
  name: 'input',
  data () {
    return {
    }
  },
  methods : {
    back () {
        this.$router.go(-1)
    },
    next () {
        this.ensureSaved()
        this.$router.push('/validate')
    },
    ensureSaved () {
        // These fields might not necessarily be edited before leaving the
        // page so we save them here.
        if (!this.$store.state.schedule_open) {
            this.schedule_open = this.schedule_open;
        }
        if (!this.$store.state.schedule_month) {
            this.schedule_month = this.schedule_month;
        }
    }
  },
  computed: {
      rows: {
          get () {
            return this.$store.state['rows']
          },
          set (value) {
            this.$store.commit('save_rows', value)
          }
      },
      schedule_open: {
          get () {
              var saved_value = this.$store.state.schedule_open;
              if (saved_value) {
                  return saved_value.format().slice(0, 16)
              } else {
                  var start = moment().set({'date': 1, 'hour': 18, 'minute': 0}).format()
                  return start.slice(0,16)
              }
          },
          set (value) {
              var schedule_open = moment(value)
              if (!schedule_open.isValid()) {
                  return
              }
              this.$store.commit('save_schedule_open', schedule_open)
          }
      },
      schedule_month: {
          get () {
            var saved_value = this.$store.state.schedule_month
            if (saved_value) {
              return saved_value.format().slice(0, 10)
            } else {
              var now = moment();
              var month = moment().set({'month': now.get('month')+1, 'date': 1}).format()
              return month.slice(0,10)
            }
          },
          set (value) {
            var schedule_month = moment(value);
            this.$store.commit('save_schedule_month', schedule_month)
          }
      },

  }
}
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
</style>