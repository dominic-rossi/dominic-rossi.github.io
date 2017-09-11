<template>
  <div>
    <p>Please ensure the following names are in the format "Lastname, Firstname".</p>
    <table class="table table-condensed">
      <tr>
        <th class="custom-th">Submission Time</th>
        <th class="custom-th">Name</th>
        <th class="custom-th">Email</th>
      </tr>
      <tr v-for="error in errorNames">
        <td>{{entries[error.index][0].format('M/D/YYYY HH:mm:ss')}}</td>
        <td><input v-model.lazy="error.name"></input></td>
        <td>{{entries[error.index][2]}}</td>
      </tr>
    </table>
    <button class="btn btn-default" v-on:click="saveNames()">Save</button>
  </div>
</template>

<script>
export default {
  name: 'FixNames',
  data() {
    return {
      errorNames: [],
      entries: null,
      startCheck: false,
    };
  },
  created() {
    this.entries = this.$store.state.valid_rows;
    // this.startCheck = true;
    this.checkForNameErrors();
  },
  methods: {
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
    saveNames() {
      for (let i = 0; i < this.errorNames.length; i += 1) {
        this.entries[this.errorNames[i].index][1] = this.errorNames[i].name;
      }
      this.errorNames = [];
      this.checkForNameErrors();
    },
    checkForNameErrors() {
      for (let i = 0; i < this.entries.length; i += 1) {
        let name = this.entries[i][1].trim();
        const parsedName = this.parseName(name);
        if (parsedName === null) {
          const error = {
            name,
            index: i,
          };
          this.errorNames.push(error);
        } else {
          name = `${parsedName.firstName} ${parsedName.lastName}`;
          this.entries[i][1] = name;
        }
      }
      if (!this.errorNames.length) {
        this.$store.commit('update_rows', this.entries);
        this.$emit('namesDone');
      }
    },
  },
};
</script>

<style>
  
</style>
