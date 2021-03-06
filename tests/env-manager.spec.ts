import Environment from '../src/lib/env-manager';
import fs from 'fs';
import { expect } from 'chai';
import sinon from 'sinon';

describe('env-manager', () => {
  let processBackup: NodeJS.ProcessEnv;

  before(() => {
    processBackup = process.env;
  });

  afterEach(() => {
    sinon.restore();
    process.env = processBackup;
  });

  it('Default upgrade service port is 5008', () => {
    expect(Environment.getUpgradeServicePort()).to.be.equal('5008');
  });

  it('Default upgrade service port can be overridden', () => {
    process.env.UPGRADE_SERVICE_PORT = '6000';
    expect(Environment.getUpgradeServicePort()).to.be.equal('6000');
  });

  it('Can take namespace from env var', () => {
    process.env.CHT_NAMESPACE = 'test-namespace';
    expect(Environment.getNamespace()).to.be.equal('test-namespace');
  });

  it('Can take namespace from config', () => {
    process.env.CHT_NAMESPACE = '';

    const fsStub = sinon.stub(fs, 'readFileSync').returns( JSON.stringify({
      KUBECONFIG_DEFAULT_PATH: '/Users/henok/.kube/config',
      CHT_DEPLOYMENT_NAME: 'test',
      CHT_NAMESPACE: 'test'}));

    expect(Environment.getNamespace()).to.be.equal('test');
    expect(fsStub.calledOnce);
  });

  it('Can take namespace from cluster', () => {
    process.env.CHT_NAMESPACE = '';

    sinon.stub(Environment, 'runningWithinCluster').returns(true);
    sinon.stub(Environment, 'localConfig').returns({
      'KUBECONFIG_DEFAULT_PATH': '',
      'CHT_DEPLOYMENT_NAME': '',
      'CHT_NAMESPACE': ''
    });

    const fake = sinon.stub(fs, 'readFileSync').returns('test-cluster-namespace');

    expect(Environment.getNamespace()).to.be.equal('test-cluster-namespace');
    expect(fake.calledOnce);
    expect(fake.calledWith('/var/run/secrets/kubernetes.io/serviceaccount/namespace'));
  });

  it('Throws error when namespace not found', () => {
    sinon.stub(Environment, 'runningWithinCluster').returns(false);
    process.env.CHT_NAMESPACE = '';

    sinon.stub(fs, 'readFileSync').returns(JSON.stringify({
      KUBECONFIG_DEFAULT_PATH: '/Users/henok/.kube/config',
      CHT_DEPLOYMENT_NAME: '',
      CHT_NAMESPACE: ''
    }));

    expect(Environment.getNamespace).to.throw(Error, 'Namespace could not be determined.');
  });

  it('Throws error when namespace file missing in cluster', () => {
    sinon.stub(Environment, 'runningWithinCluster').returns(true);
    process.env.CHT_NAMESPACE = '';

    sinon.stub(Environment, 'localConfig').returns({
      'KUBECONFIG_DEFAULT_PATH': '',
      'CHT_DEPLOYMENT_NAME': '',
      'CHT_NAMESPACE': ''
    });

    sinon.stub(fs, 'readFileSync').throwsException('File not found!');

    let namespace = undefined;
    let errMessage = undefined;
    
    try {
      namespace = Environment.getNamespace();
    } catch(err) {
      errMessage = err;
    }
    
    expect((errMessage as Error).message).to.contain('Namespace could not be determined.');
    expect(namespace).to.be.undefined;
  });

  it('Determines if running within a cluster', () => {
    const fakeFS = sinon.stub(fs, 'existsSync').returns(true);
    expect(Environment.runningWithinCluster()).to.be.equal(true);
    expect(fakeFS.calledOnce);
    expect(fakeFS.calledWith('/var/run/secrets/kubernetes.io/serviceaccount/token'));
  });

  it('Determines if running within test automation', () => {
    expect(Environment.runningWithinTestAutomation()).to.be.equal(true);
  });

  it('Reads CHT Deployment name from env variable', () => {
    process.env.CHT_DEPLOYMENT_NAME = 'TheDeployment';
    expect(Environment.getDeploymentName()).to.be.equal('TheDeployment');
  });

  it('Takes CHT Deployment name from config', () => {
    process.env.CHT_DEPLOYMENT_NAME = '';
    sinon.stub(Environment, 'localConfig').returns({
      'KUBECONFIG_DEFAULT_PATH': '',
      'CHT_DEPLOYMENT_NAME': 'On-hey-there',
      'CHT_NAMESPACE': ''
    });

    expect(Environment.getDeploymentName()).to.be.equal('On-hey-there');
  });

  it('Throws an error when deployment name not found', () => {
    process.env.CHT_DEPLOYMENT_NAME = '';
    sinon.stub(Environment, 'localConfig').returns({
      'KUBECONFIG_DEFAULT_PATH': '',
      'CHT_DEPLOYMENT_NAME': '',
      'CHT_NAMESPACE': ''
    });

    let deploymentName = undefined;

    expect(() => {
      deploymentName = Environment.getDeploymentName();
    }).to.throw(Error, 'Deployment name could not be determined.');
    
    expect(deploymentName).to.be.undefined;
  });

  it('Throws an error when looking for path when running within cluster', () => {
    sinon.stub(Environment, 'runningWithinCluster').returns(true);
    expect(Environment.getKubeConfigPath).to.throw(Error, 'Runing within cluster. Load config from cluster.');
  });

  it('Correctly returns kubeconfig in test automation', () => {
    sinon.stub(Environment, 'runningWithinCluster').returns(false);
    expect(Environment.getKubeConfigPath()).to.contain('.kube/config');
  });

  it('Correctly obtains kubeconfig from env var', () => {
    sinon.stub(Environment, 'runningWithinCluster').returns(false);

    sinon.stub(Environment, 'runningWithinTestAutomation').returns(false);

    process.env.KUBECONFIG = 'a-test-config-path';

    expect(Environment.getKubeConfigPath()).to.be.equal('a-test-config-path');
  });

  it('Throws error when kubeconfig path not found', () => {
    sinon.stub(Environment, 'runningWithinCluster').returns(false);

    sinon.stub(Environment, 'runningWithinTestAutomation').returns(false);

    process.env.KUBECONFIG = '';

    sinon.stub(Environment, 'localConfig').returns({
      'KUBECONFIG_DEFAULT_PATH': '',
      'CHT_DEPLOYMENT_NAME': '',
      'CHT_NAMESPACE': ''
    });

    expect(Environment.getKubeConfigPath).to.throw(Error,'Could not get kube config path.');
  });

  it('LocalConfig returns null when there is a JSON parsing issue', () => {
    sinon.stub(fs, 'readFileSync').returns('{ Wohoo: wuhha');
    expect(Environment.localConfig()).to.be.null;
  });
});
