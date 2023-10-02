import { util } from 'jointjs/src/core.mjs';

export class DependencyService {

    constructor() {
        this.dependencies = {}; // { [key: string]: { callback: (dependency, value, path) => void, dependency: { path: string, name: string })[] }
    }

    subscribe(dependencies, callback) {
        dependencies.forEach(dep => {
            const depPath = dep.path;
            if (!this.dependencies[depPath])
                this.dependencies[depPath] = [];
            this.dependencies[depPath].push({
                callback: callback,
                dependency: dep
            });
        });
    }

    changed(path) {
        // = called when attribute at path `path` is changed
        // we need to find dependencies which care about this change (= subscribers):
        const allDependencyPaths = Object.getOwnPropertyNames(this.dependencies);
        const subscriberPaths = allDependencyPaths.filter(depPath => this.isSubPathOrSuperPath(depPath, path));
        subscriberPaths.forEach(depPath => {
            this.dependencies[depPath].forEach(dep => {
                dep.callback(dep.dependency, path);
            })
        })
    }

    clear() {
        this.dependencies = {};
    }

    isSubPathOrSuperPath(depPath, path) {
        const depParts = depPath.split('/');
        const pathParts = path.split('/');
        if (depParts.length > pathParts.length) {
            // if `depPath` is more complex than `path`, check that all parts of `path` are contained within `depPath` (= `depPath` is super-path of `path)
            return !pathParts.some((part, i) => !util.isEqual(part, depParts[i]));
        } else {
            // if `depPath` is less complex than `path` or if both are equally complex, check that all parts of `depPath` are contained within `path` (= `depPath` is sub-path of `path`)
            return !depParts.some((part, i) => !util.isEqual(part, pathParts[i]));
        }

    }
}
