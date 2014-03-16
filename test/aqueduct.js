describe('aqueduct', function() {
  var aqueudct = window.aqueduct;

  it('should be defined', function () {
    expect(aqueduct).to.be.defined;
  });

  describe('#run', function () {
    it('should instantiate a Runner', function () {
      var runner = aqueduct.run(function* () {});
      expect(runner).to.be.an.instanceOf(aqueduct.Runner);
    });
  });

  describe('#create', function () {
    it('should instantiate a Conduit', function () {
      var conduit = aqueduct.create();
      expect(conduit).to.be.an.instanceOf(aqueduct.Conduit);
    });
  });
});
