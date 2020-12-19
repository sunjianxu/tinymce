import { before } from '@ephox/bedrock-client';

const skip = (): boolean => navigator.userAgent.indexOf('PhantomJS') > -1;

const bddSetup = () => {
  if (skip()) {
    before(function () {
      this.skip();
    });
  }
};

export {
  skip,
  bddSetup
};
