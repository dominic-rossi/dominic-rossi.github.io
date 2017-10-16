import moment from 'moment';
import Vue from 'vue';
import Input from '@/components/input';

describe('Input should be composed of', () => {
  const Constructor = Vue.extend(Input);
  const vm = new Constructor().$mount();
  describe('an input denoting the start of the first shift', () => {
    it('that is initalized one month ahead of the current month', () => {
      const thisMonth = moment().month();
      Vue.nextTick(() => {
        const scheduleDay = vm.$el.querySelector('#scheduleMonth').value;
        const scheduleMonth = moment(scheduleDay, 'YYYY-MM-DD').month();
        expect(scheduleMonth.to.equal(1 + thisMonth));
      });
    });
  });
  describe('an input denoting the start of the scheduling periond', () => {
    it('that is initialized to the start of the current month at 18:00', () => {
      const thisMonthStart = moment().startOf('month').hour(18);
      Vue.nextTick(() => {
        const scheduleStart = vm.$el.querySelector('#scheduleStart').value;
        const scheduleOpen = moment(scheduleStart, 'YYYY-MM-DDTHH:mm');
        expect(thisMonthStart.isSame(scheduleOpen).to.be.true);
      });
    });
  });
});
