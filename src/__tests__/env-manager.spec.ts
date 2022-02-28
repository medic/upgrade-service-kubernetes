import Environment from '../lib/env-manager';
import fs from 'fs';

describe('env-manager', () => {
    it('Default upgrade service port is 5008', () => {
        expect(Environment.getUpgradeServicePort()).toBe('5008');
    });

    it('Default upgrade service port can be overridden', () => {
        process.env.UPGRADE_SERVICE_PORT = '6000';
        expect(Environment.getUpgradeServicePort()).toBe('6000');
    });

    it('Can take namespace from env var', () => {
        process.env.CHT_NAMESPACE = 'test-namespace';
        expect(Environment.getNamespace()).toBe('test-namespace');
    });

    it('Can take namespace from config', () => {
        process.env.CHT_NAMESPACE = '';

        const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((): string => {
            const content = {
                KUBECONFIG_DEFAULT_PATH: '/Users/henok/.kube/config',
                CHT_DEPLOYMENT_NAME: 'test',
                CHT_NAMESPACE: 'test'
            };
            return JSON.stringify(content);
        });

        expect(Environment.getNamespace()).toBe('test');
    });

    it('Throws error when namespace not found', () => {
        const spyRunningWithinCluster = jest.spyOn(Environment, 'runningWithinCluster').mockImplementation(() => {
            return false;
        });
        process.env.CHT_NAMESPACE = '';

        const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((): string => {
            const content = {
                KUBECONFIG_DEFAULT_PATH: '/Users/henok/.kube/config',
                CHT_DEPLOYMENT_NAME: '',
                CHT_NAMESPACE: ''
            };
            return JSON.stringify(content);
        });

        let errMsg = undefined;
        try {
            Environment.getNamespace();
        } catch (err) {
            errMsg = err;
        }

        expect(errMsg).toBeDefined();
    });

    it('Determines if running within a cluster', () => {
        const spy = jest.spyOn(fs, 'existsSync').mockImplementation((thePath): boolean => (true));
        expect(Environment.runningWithinCluster()).toBe(true);
    });

    it('Determines if running within test automation', () => {
        expect(Environment.runningWithinTestAutomation()).toBe(true);
    });

    it('Reads CHT Deployment name from env variable', () => {
        process.env.CHT_DEPLOYMENT_NAME = 'TheDeployment';
        expect(Environment.getDeploymentName()).toBe('TheDeployment');
    });

});
