function a() {
  b();
}

function b() {}

module.exports = {
  a: a,
  b: b
};
