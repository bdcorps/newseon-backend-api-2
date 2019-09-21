const factory = {
  a,
  b
};
function a() {
  return 2;
}

function b() {
  return factory.a();
}

module.exports = factory;
