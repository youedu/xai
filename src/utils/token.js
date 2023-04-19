export default {
  get() {
    return window.localStorage.getItem('TOKEN');
  },
  save(token) {
    window.localStorage.setItem('TOKEN', token);
  },
};
