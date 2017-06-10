/**
 * @name            MakeHuman
 * @copyright       MakeHuman Team 2001-2016
 * @license         [AGPL3]{@link http://www.makehuman.org/license.php}
 * @author          wassname
 * @description
 * Classes and functions to hold and manipulate morphTargets
 */

// TODO I want to bypass threejs morphtarget sinxe it only support 8target. ThenI canjust update the vertices

import _ from 'lodash'
import * as THREE from 'three'
import targetList from 'makehuman-data/src/json/targets/target-list.json'
import targetCategories from 'makehuman-data/src/json/targets/target-category-data.json'
import {
    invertByMany
} from '../helpers/helpers'

/**
 * A morphTarget for THREE.Geometry. It represents a target to interpolate the
 * base mesh to. It stores a value which is applied by applied to
 * morphTargetInfluences using target.updateValue.
 *
 * See
 * - morphTargets under http://threejs.org/docs/#Reference/Core/Geometry
 * - targets.py and alg3d in makehuman
 *
 * Each is referenced under mesh.geometry.morphTargets
 */
export class Target {

    /**
     * Build a target
     * @param  {Object} config[]
     *
     * @param  {[type]} data   [description]
     * @return {[type]}        [description]
     */
    constructor(config) {
        this.name = config.path
            // this.parent = null; // prob just a tmp var from mh file warlking
        this.path = config.path
        this.group = config.group

        // meta categories which each key part belongs to
        this.categories = config.categories
        this.variables = config.variables
        this.macroVariables = config.macroVariables
            // translation vectors for modified vertices
        // this.dVertices = {}
            // full set of vertices of this morphTarget
        // this.vertices = []
    }

    /** The variables that apply to this target component. **/
    getVariables() {
        // filter out null values then grab the keys of the remaining properties
        return _.keys(_.pickBy(this.categories, _.isTrue))
    }


    /** put this targets current value into the threejs mesh's influence array **/
    set value(val) {
        const i = this.parent.human.morphTargetDictionary[this.name]
        this.parent.human.morphTargetInfluences[i] = val
    }

    /** Get target's value from where threejs stores it **/
    get value() {
        const i = this.parent.human.morphTargetDictionary[this.name]
        return this.parent.human.morphTargetInfluences[i]
    }
}


/**
 * Contains meta data about all available targets
 */
export class TargetMetaData {
    /**
     * [constructor description]
     * @param  {[type]} targetList       [description]
     * @param  {[type]} targetCategories [description]
     * @return {[type]}                  [description]
     */
    constructor() {
        const self = this
            // this.groups = _.invertBy(targetList.targets); // Target components, ordered per group
        this.targetCategories = targetCategories
        this.categoryTargets = _.invertBy(targetCategories)
        this.categories = _.uniq(_.keys(targetCategories))

        // TODO move these to a metadata obj in a property or else prefix with md
        this.targetIndex = _.map(_.keys(targetList.targets), path => self.pathToGroupAndCategories(path))
        this.targetImages = targetList.images // Images list
        this.targetsByTag = invertByMany(targetList.targets)
        this.targetsUrls = _.keys(targetList.targets) // List of target files
        this.targetsByPath = _.groupBy(this.targetIndex, i => i.path)
        this.targetGroups = _(this.targetsUrls)
            .map(path => new Target(self.pathToGroupAndCategories(path)))
            .groupBy(gc => gc.group)
            .value()
    }

    /**
     * extract the path for a mprh target to categories and groups
     * @param  {string} path  e.g. 'data/targets/macrodetails/height/female-old-averagemuscle-averageweight-minheight.target'
     * @return {[type]}      {key:"macrodetails,height",data:{'weight': 'averageweight',..}
     */
    pathToGroupAndCategories(origPath) {
        // TODO refactor: data, key/groupName => categories, groups
        // lowercase
        origPath = origPath.toLowerCase()

        // remove everything up to the target folder if it's there
        const shortPath = origPath.replace(/^.+targets\//, '')

        // remove ext
        const path = shortPath.replace(/\.target$/g, '')

        // break it by slash, underscore, comma, or dash
        // this makes the tags which make up categories and group
        const subgroups = path.replace(/[/_,]/g, '-').split('-')


        // meta categories which each key part belongs to
        const categories = {}
            // ad null vals
        Object.keys(this.categoryTargets).map(categ => (categories[categ] = null))

        // find which subgroups fit into macro categories
        const macroGroup = _.filter(subgroups, group => targetCategories[group])
        macroGroup.forEach((group) => {
            const category = targetCategories[group]
            categories[category] = group
        })

        // now remove macro subgroups
        _.pull(subgroups, ...macroGroup)

        return {
            group: subgroups.join('-'),
            categories,
            variables: _.values(_.pickBy(categories, _.isTrue)).sort(),
            macroVariables: _.keys(_.pickBy(categories, _.isTrue)).sort(),
            path: origPath,
            shortPath
        }
    }

    /**
     * Get targets that belong to the same group, and their factors
     * @param  {String} path - target path e.g. data/targets/nose/nose-nostrils-angle-up.target'
     * @return {Array}      [path,[factor1,factor2]],[path2,[factor1,factor2]]
     * e.g. ['data/targets/nose/nose-nostrils-angle-up.target',['nose-nostrils-angle-up']]]
     * see makehuman/gui/humanmodifier.py for more
     */
    findTargets(path) {
        if (path === null) {
            return []
        }

        let targetsList

        try {
            targetsList = this.getTargetsByGroup(path) || []
        } catch (exc) {
            // TODO check for keyerror or whatever this will return
            console.debug('missing target %s', path)
            targetsList = []
        }

        const result = []
        for (let i = 0; i < targetsList.length; i += 1) {
            const target = targetsList[i]
            const factordependencies = _.concat(target.variables, [target.group])
            result.push([target.path, factordependencies])
        }
        return result
    }

    /**
     * get targets by groups e.g. "armslegs,r,upperarms,fat"
     * @param  {String} group Comma seperated string of keys e.g. "armslegs,r,upperarms,fat"
     * @return {Array}       List of target objects
     */
    getTargetsByGroup(group) {
        if (!group) return []
        group = this.pathToGroupAndCategories(group).group
        return this.targetGroups[group]
    }

}

export class Targets extends TargetMetaData {
    constructor(human) {
        super()
        this.human = human

        this.lastBake = new Date().getTime()

        // targets are stored here
        this.children = {}

        this.loading = false

        // for loading
        this.manager = new THREE.LoadingManager()
        this.bufferLoader = new THREE.XHRLoader(this.manager)
        this.bufferLoader.setResponseType('arraybuffer')
    }

    /**
     * load all from a single file describing sparse data
     * @param  {String} url  - url to bin file containing Int16 array
     *                       nb_targets*nb_vertices*3 in length
     * @return {Promise}     promise of an array of targets
     */
    load(dataUrl = 'data/targets/targets.bin') {
        const self = this
        this.loading = true

        const targets = []

        this.referenceVertices = this.human.mesh.geometry.vertices.map(v => v.clone())

        const paths = this.targetIndex.map(t => t.path)
        paths.sort()
        this.human.morphTargetDictionary = paths.reduce((a, p, i) => { a[p] = i; return a }, {})
        this.targetIndex.map(t => t.path).map((path) => {
            const config = self.pathToGroupAndCategories(path)
            const target = new Target(config)
            targets.push(target)
            target.parent = self
            self.children[target.name] = target
            return target
        })

        self.human.morphTargetInfluences = new Float32Array(paths.length)

        return new Promise((resolve, reject) => self.bufferLoader.load(dataUrl, resolve, undefined, reject))
        .then((data) => {
            self.targetData = new Int16Array(data)
            const loadedTargets = self.human.targets.targetData.length / 3 / self.human.mesh.geometry.vertices.length
            console.assert(
                self.targetData.length % (3 * self.human.mesh.geometry.vertices.length) === 0,
                'targets should be a multiple of nb_vertices*3'
            )
            console.assert(
                loadedTargets === Object.keys(self.children).length,
                "length of target data doesn't match nb_targets*nb_vertices*3"
            )
            console.debug(
                'loaded targets',
                loadedTargets
            )
            self.loading = false
            return self.targetData
        })
        .catch((err) => {
            self.loading = false
            throw (err)
        })
    }


    /**
     * Updated vertices from applied targets. Should be called on render since it
     * will only run if it's needed and more than a second has passed
     */
    applyTargets() {
        // skip if it hasn't been rendered
        if (!this.human ||
            !this.human.mesh ||
            !this.human.mesh.geometry ||
            !this.human.mesh.geometry._bufferGeometry ||
            !this.targetData
        ) return false

        // skip if less than a second since last
        if ((new Date().getTime() - this.lastBake) < this.human.minUpdateInterval) return false

        // check if it'schanged
        if (_.isEqual(this.lastmorphTargetInfluences, this.human.morphTargetInfluences)) return false

        // let [m,n] =  this.targetData.size
        const m = this.human.geometry.vertices.length * 3
        const n = this.human.morphTargetInfluences.length
        const dVert = new Float32Array(m)

        // What is targetData? It's all the makehuman targets, (ordered alphebetically by target path)
        // put in an nb_targets X nb_vertices*3 array as Int16 then flattened written as bytes to a file.
        //  We then load it as a binary buffer and load it into a javascript Int16 array.
        // Now we can calculate new vertices by doing a dotproduct of
        //     $morphTargetInfluences \cdot targetData *1e-3 $
        // with shapes
        //     $(nb_targets) \cdot (nb_target,nb_vertices*3) *1e-3 $
        // where 1e-3 is the scaling factor to convert from Int16
        // The upside is that the amount of data doesn't crash the browser like
        // json, msgpack etc do. It's also relativly fast and bypasses threejs
        // limit on the number of morphtargets you can have.

        console.assert(this.targetData.length === m * n, `target data should be nb_targets*nb_vertices*3: ${m * n}`)
        console.assert(_.sum(this.targetData.slice(3 * m, 4 * m)) === 2952)

        // do the dot product over a flat targetData
        for (let j = 0; j < n; j += 1) {
            for (let i = 0; i < m; i += 1) {
                if (this.human.morphTargetInfluences[j] !== 0 && this.targetData[i + j * m] !== 0) {
                    dVert[i] += this.targetData[i + j * m] * this.human.morphTargetInfluences[j]
                }
            }
        }

        // update the vertices
        const vertices = this.referenceVertices.map(v => v.clone())
        for (let i = 0; i < vertices.length; i += 1) {
            vertices[i].add({ x: dVert[i * 3] * 1e-3, y: dVert[i * 3 + 1] * 1e-3, z: dVert[i * 3 + 2] * 1e-3 })
        }
        this.human.geometry.vertices = vertices

        // this.human.mesh.geometry.verticesNeedUpdate = true;
        this.human.mesh.geometry.elementsNeedUpdate = true
        this.lastmorphTargetInfluences = this.human.morphTargetInfluences.slice(0)
        this.lastBake = new Date().getTime()

        return true
    }
}

export const targetMetaData = new TargetMetaData()
export default Targets
