<template>
  <div v-if="duplicatesPresent">
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
          <td>{{entries[rowIdx][0].format('M/D/YYYY HH:mm:ss')}}</td>
          <td>{{entries[rowIdx][1]}}</td>
          <td>{{entries[rowIdx][2]}}</td>
          <td>{{entries[rowIdx][11]}}</td>
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
</template>

<script>
export default {
  name: 'RemoveDuplicates',
  data() {
    return {
      duplicates: null,
      duplicatesPresent: false,
      entries: null,
    };
  },
  created() {
    this.entries = this.$store.state.valid_rows;
    this.checkForDuplicates();
  },
  methods: {
    checkForDuplicates() {
      const names = {};
      const emails = {};
      for (let i = 0; i < this.entries.length; i += 1) {
        const name = this.entries[i][1].trim();
        const email = this.entries[i][2].trim();
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
      this.duplicates = this.disjointSets(duplicates);
      this.duplicatesPresent = !!this.duplicates.length;
      if (!this.duplicatesPresent) {
        this.$emit('duplicatesDone');
      }
    },
    // http://stackoverflow.com/questions/20154368/union-find-implementation-using-python
    indiciesMap(arr) {
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
    },
    disjointIndicies(arr) {
      // Returns a list of disjoint sets of indicies, i.e. clusters
      const d = this.indiciesMap(arr);
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
    },
    disjointSets(arr) {
      const sets = this.disjointIndicies(arr);
      const disjoint = [];
      sets.forEach((s) => {
        const cluster = new Set();
        s.forEach((i) => {
          arr[i].forEach((x) => {
            cluster.add(x);
          });
        });
        const clusterArr = Array.from(cluster);
        clusterArr.sort((a, b) => a - b);
        disjoint.push(clusterArr);
      });
      return disjoint;
    },
    deleteDuplicate(idx) {
      this.entries.splice(idx, 1);
      this.$store.commit('update_rows', this.entries);
      this.checkForDuplicates();
    },
    mergeGroup(groupIdx) {
      // Takes the majority of information from the first item in the
      // group and adds the shifts from the others to it
      const firstRowIdx = this.duplicates[groupIdx][0];
      const firstRow = this.entries[firstRowIdx];
      let primaries = firstRow[9];
      let alternates = firstRow[10];
      for (let i = 1; i < this.duplicates[groupIdx].length; i += 1) {
        const rowIdx = this.duplicates[groupIdx][i];
        primaries += `\n${this.entries[rowIdx][9]}`;
        alternates += `\n${this.entries[rowIdx][10]}`;
      }
      for (let i = this.duplicates[groupIdx].length - 1; i > 0; i -= 1) {
        const rowIdx = this.duplicates[groupIdx][i];
        this.entries.splice(rowIdx, 1);
      }
      firstRow[9] = primaries;
      firstRow[10] = alternates;
      this.entries[firstRowIdx] = firstRow;
      this.$store.commit('update_rows', this.entries);
      this.checkForDuplicates();
    },
  },
};
</script>

<style>
table>tbody>tr>td.dup-num {
  vertical-align: middle;
}
.notes-col {
  min-width: 100px;
}
</style>
