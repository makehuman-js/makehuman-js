/**
 * @name            MakeHuman
 * @copyright       MakeHuman Team 2001-2016
 * @license         [AGPL3]{@link http://www.makehuman.org/license.php}
 * @author          wassname
 * @description
 *
 * Provides classes for modifiers read from makehuman
 *
 * These modifiers are the parameters you slide, and they interact to product
 * a matrix of changes to the targets.
 */

import _ from 'lodash'
import d3Random from 'd3-random'

import {
    targetMetaData
} from './targets'
import modelingModifiers from 'makehuman-data/src/json/modifiers/modeling_modifiers.json'
import measurementModifiers from 'makehuman-data/src/json/modifiers/measurement_modifiers.json'

/**
 * The most basic modifier. All modifiers should inherit from this, directly or
 * indirectly
 *
 * A modifier manages a set of targets applied with a certain weight that
 * influence the human model.
 */
export class Modifier {
    constructor(groupName, name) {
        this.groupName = groupName
        this.name = name
        this.fullName = `${this.groupName}/${this.name}`

        this.targets = []
        this.description = ""
        this.human = null
        this.defaultValue = 0
        this.min = 0
        this.max = 1

        this.showMacroStats = false

        // Macro variable controlled by this modifier
        this.macroVariable = null
            // Macro variables on which the targets controlled by this modifier depend
        this.macroDependencies = []

        this._symmModifier = null
        this._symmSide = 0

        this.targetMetaData = targetMetaData
    }

    resetValue() {
        const oldVal = this.getValue()
        this.setValue(this.defaultValue)
        return oldVal
    }

    /** Propagate modifier update to dependent modifiers**/
    propagateUpdate(realtime = false) {
        let f
        if (realtime) {
            f = ['macrodetails', 'macrodetails-universal']
        } else {
            f = null
        }

        const modifiersAffectedBy = this.parent.getModifiersAffectedBy(this, f)
            .map((dependentModifierGroup) => {
                // Only updating one modifier in a group should suffice to update the
                // targets affected by the entire group.
                const m = this.parent.getModifiersByGroup(dependentModifierGroup)[0]
                if (realtime) {
                    return m.updateValue(m.getValue(), true)
                } else {
                    return m.setValue(m.getValue(), true)
                }
            })

        return modifiersAffectedBy
    }

    clampValue(value) {
        return _.clamp(value, this.min, this.max)
    }

    /** Subclasses must override this **/
    getFactors(value) {
        throw new Error("NotImplemented")
    }

    /**
     * Gets modifier value from sum of own or given targets
     * @param  {Array} targets=this.targets - The targets to get values from
     * @return {Number}                     - sum of values from targets
     */
    getValue(targets = this.targets) {
        let sum = 0
        for (let i = 0; i < targets.length; i++) {
            const path = targets[i][0]
            const target = this.parent.human.targets.children[path]
            if (!target) {
                // console.error('Target not found for modifier', path, this.name)
                throw new Error(`Target not found for modifier ${path} ${this.name}`)
            } else {
                sum += target.value
            }
        }

        // var targets = _.map(this.targets, target => this.parent.human.targets.children[target[0]])
        // return _.sum(_.map(targets,target=>target.value));
        return sum
    }

    /**
     * Update the values of this modifers targets
     * @param  {Number} value            new value
     * @param  {Boolean} skipUpdate=false Flag to prevent infinite recursion
     */
    updateValue(value, skipUpdate = false) {
        // Update detail state
        if (value !== undefined) {
            this.setValue(value, true)
        }

        // values are directly put into influences matrix now
        // Apply changes
        // for (var i = 0; i < this.targets.length; i++) {
        //     // find the actual target attached to human
        //     let targetName = this.targets[i][0]
        //     let target = this.parent.human.targets.children[targetName]
        //     if (!target) console.warn('Tried to apply modifier but target is not loaded', this.name, targetName)
        //         // have target apply itself to human.mesh
        //     target.value=value
        // }


        if (skipUpdate) {
                // Used for dependency updates (avoid dependency loops && double updates to human)
            return value
        }

        // Update dependent modifiers
        return this.propagateUpdate(true) // realtime=true
    }


    /**
     * The side this modifier takes in a symmetric pair of two modifiers.
     * Returns 'l' for left, 'r' for right.
     * Returns null if symmetry does not apply to this modifier.
     **/
    getSymmetrySide(path = this.name.split('-')) {
        if ('l' in path) {
            return 'l'
        } else if ('r' in path) {
            return 'r'
        } else {
            return null
        }
    }

    getSymmModifier(path = this.name.split('-')) {
        return _.map(path, (p) => {
            if (p === 'r') return 'l'
            else if (p === 'l') return 'r'
            else return p
        }).join('-')
    }

    /**
    Get name of the modifier which is symmetric to this one or null if there is none
    **/
    getSymmetricOpposite() {
        if (this._symmModifier) {
            return `${this.groupName}/${this._symmModifier}`
        } else {
            return null
        }
    }

    /**
     * Retrieve the other modifiers of the same type on the human.
     * @return {Array} Array of modifiers with the same class
     */
    getSimilar() {
        // return [m for m in this.parent.getModifiersByType(this.type) if m != self]
        return this.parent.getModifiersByType(this.constructor).filter(m => m !== this)
    }

    isMacro() {
        return this.macroVariable !== null
    }

    get leftLabel() {
        return this.left ? this.left.split('-').slice(-1)[0] : ''
    }
    get rightLabel() {
        return this.right ? this.right.split('-').slice(-1)[0] : ''
    }
    get midLabel() {
        return this.mid ? this.mid.split('-').slice(-1)[0] : ''
    }
    get image() {
        return `data/targets/${this.fullName.replace('/', '/images/').replace('|', '-').toLowerCase()}.png`
    }
}


// class SimpleModifier // Simple modifier constructed from a path to a target file.


/**
 * Modifier that uses the targets module for managing its targets.
 * Abstract baseclass
 */
export class ManagedTargetModifier extends Modifier {

    /**
     * Gets weight for this modifiers targets.
     * @param  {Number} value=1                  The weights sum to this tptal
     * @param  {Array} targets=this.targets      Targets to get weights for
     * @param  {Object} factors=this.getFactors() Name,values for factors and weights
     * @param  {Number} total=1                  The weights sum to this total
     * @return {Object}                          Target paths along with their weights
     *                                              e.g. {data/targets/head/head-age-less.target: -0}
     */
    getTargetWeights(value = 1, targets = this.targets, factors = this.getFactors(value), total = 1) {
        let facVals
        const result = {}

        for (let i = 0; i < targets.length; i++) {
            const tpath = targets[i][0]
            const tfactors = targets[i][1]

            // look up target factors in our factor values
            facVals = _.map(tfactors, factor => factors[factor] !== undefined ? factors[factor] : 1.0)

            // debug check for unfound factors
            const notFound = _.map(tfactors, factor => factors[factor] === undefined ? factor : null).filter(_.isString)
            if (notFound.length > 0) {
                console.warn('Names not found in factors', {
                    notFound,
                    modifiersName: this.name,
                    factors
                })
            }


            // debug check for NaN, undefined, null
            if (_.filter(facVals, n => !_.isFinite(n)).length) { console.debug('Some factor values are not finite numbers', facVals, this.name) }
                // console.debug('factor values',facVals,this.name)

            // so now we multiply the target weight by all modifying factors
            // armlength-old-tall = 1 * 0.10 old * 0.60 tall = 0.6
            result[tpath] = total * _.reduce(facVals, (accum, val) => accum * val, 1)
        }
        return result
    }

    /**
     * Find the groups each child target belongs to
     * @param  {String} path e.g. "data/targets/macrodetails/universal-female-young-maxmuscle-averageweight.target"
     * @return {Array}      e.g. ["age", "gender", "muscle", "weight"]
     */
    findMacroDependencies(path) {
        const result = []
        // get child targets
        const targetPaths = targetMetaData.getTargetsByGroup(path) || []
        for (let i = 0; i < targetPaths.length; i++) {
            const cats = targetPaths[i].macroVariables
            if (cats) result.push(...cats)
        }
        return _.uniq(result)
    }

    /**
     * Set value of this modifier
     * @param {Number} value
     * @param {Boolean} skipDependencies - A flag to avoid infinite recursion
     */
    setValue(value, skipDependencies = false) {
        if (!Number.isFinite(value)) throw new Error(`value is not finite ${value}`)
        value = this.clampValue(value)
        // const factors = this.getFactors(value)
        const tWeights = this.getTargetWeights(value)
        for (const tpath in tWeights) {
            if (tWeights.hasOwnProperty(tpath)) {
                const tWeight = tWeights[tpath]
                const target = this.parent.human.targets.children[tpath]
                if (target === undefined) {
                    if (!this.parent.human.targets.loading) {
                        console.warn('Target not found in', _.keys(this.parent.human.targets.children).length, ' loaded targets. Target=', tpath, '. Modifier=', this.name)
                    }
                } else {
                    target.value = tWeight
                }
            }
        }
        // console.debug('Set target values',this.name,_.keys(tWeights).length,tWeights)

        if (skipDependencies) {
            return
        }

        // Update dependent modifiers
        this.propagateUpdate(false)
    }

    getValue() {
        // here the right overrides the left
        const right = super.getValue(this.r_targets)
        if (right) { return right } else {
            return -1 * super.getValue(this.l_targets)
        }
    }

    /**
     * Returns weights for each factor e.g {'old':0.8,'young':0.2,child:0}
     */
    getFactors(value) {
        const categoryNames = Object.keys(targetMetaData.targetCategories)
        // return _.map(categoryNames, name => [name, this.parent.human.factors[name + 'Val']]); // returns nested arrays
        return _.transform(categoryNames, (res, name) => res[name] = this.parent.human.factors[`${name}Val`], {})
    }
}


export class UniversalModifier extends ManagedTargetModifier {
    /**
     * Simple target-based modifier that controls 1, 2 or 3 targets, managed by
     * the targets module.
     * @param  {String} groupName  e.g. head
     * @param  {String} targetName e.g. head-age
     * @param  {String} leftExt    Howtarget relates to modifier
     *                             e.g. less|shorter|narrower|skinnier
     * @param  {String} rightExt   e.g. more|taller|wider|fatter
     * @param  {String} centerExt  e.g. normal
     * @return {undefined}
     */
    constructor(groupName, target, leftExt, rightExt, centerExt) {
        let name,
            targetName
        targetName = `${groupName}-${target}`

        let left = leftExt ? `${targetName}-${leftExt}` : null
        let right = rightExt ? `${targetName}-${rightExt}` : null
        let center = centerExt ? `${targetName}-${centerExt}` : null

        // it either has 3, 2, or 1 targets. Include each target in the name
        if (left && right && center) {
            targetName = `${targetName}-${leftExt}|${centerExt}|${rightExt}`
            name = `${target}-${leftExt}|${centerExt}|${rightExt}`
        } else if (leftExt && rightExt) {
            targetName = `${targetName}-${leftExt}|${rightExt}`
            name = `${target}-${leftExt}|${rightExt}`
        } else {
            right = targetName
            name = target
        }

        super(groupName, name)
        // can't use this before super so we assign to this after
        this.left = left
        this.right = right
        this.center = center
        this.targetName = targetName

        // console.debug("UniversalModifier(%s, %s, %s, %s)  :  %s", this.groupName, targetName, leftExt, rightExt, this.fullName)
        this.l_targets = this.targetMetaData.findTargets(this.left)
        this.r_targets = this.targetMetaData.findTargets(this.right)
        this.c_targets = this.targetMetaData.findTargets(this.center)

        this.macroDependencies = _.concat(
            this.findMacroDependencies(this.left),
            this.findMacroDependencies(this.right),
            this.findMacroDependencies(this.center)
        )

        this.targets = _.concat(this.l_targets, this.r_targets, this.c_targets)


        this.min = this.left ? -1 : 0
    }

    /**
     * For a managedTargetModifier we assign the value to the left or right target
     * @param  {Number} value =1 - Number to set modifiers to
     * @return {Object}          - Value for each target and human factor
     *                             e.g. {'african': 0.33333333333333326, // factor
                                        'armslegs-r-lowerarm-fat': 1, // target
                                        'armslegs-r-lowerarm-skinny': -0.0,...}
     */
    getFactors(value = 1) {
        const factors = super.getFactors(value)

        if (this.left !== null) {
            factors[this.left] = -Math.min(value, 0)
        }
        if (this.center !== null) { factors[this.center] = 1.0 - Math.abs(value) }
        factors[this.right] = Math.max(0, value)

        return factors
    }
}

/**
 * Modifiers that control many other modifiers instead of controlling target weights directly
 */
export class MacroModifier extends ManagedTargetModifier {
    constructor(groupName, name) {
        super(groupName, name)
        this.defaultValue = 0.5

        // console.debug("MacroModifier(%s, %s)  :  %s", this.groupName, this.name, this.fullName)

        this.setter = `set${this.name}`
        this.getter = `get${this.name}`

        this.targets = this.targetMetaData.findTargets(this.groupName)

        // console.debug('macro modifier %s.%s(%s): %s', base, name, variable, this.targets)

        this.macroDependencies = this.findMacroDependencies(this.groupName)

        this.macroVariable = this._getMacroVariable(this.name)

        // Macro modifier is not dependent on variable it controls itself
        if (this.macroVariable) {
            _.pull(this.macroDependencies, this.macroVariable)
        }
    }

    /** The macro variable modified by this modifier. **/
    _getMacroVariable(name = this.name) {
        if (name) {
            const variable = name.toLowerCase()
            if (this.targetMetaData.categoryTargets[variable]) {
                return variable
            } else if (this.targetMetaData.targetCategories[variable]) {
                // necessary for caucasian, asian, african
                return this.targetMetaData.targetCategories[variable]
            }
        } else {
            return null
        }
    }

    getValue() {
        return this.parent.human.factors[this.getter]()
    }

    setValue(value, skipDependencies = false) {
        value = this.clampValue(value)
        this.parent.human.factors[this.setter](value, false)
        super.setValue(value, skipDependencies)
    }

    getFactors(value) {
        const factors = super.getFactors(value)
        factors[this.groupName] = 1.0
        return factors
    }

    // buildLists() {
    //     return;
    // }
}

/**
 * Specialisation of macro modifier to manage three closely connected modifiers
 * whose total sum of values has to sum to 1.
 */
export class EthnicModifier extends MacroModifier {
    constructor(groupName, variable) {
        super(groupName, variable)
        this.defaultValue = 1.0 / 3
    }

    /**
     * Resetting one ethnic modifier restores all ethnic modifiers to their
     * default position.
     */
    resetValue() {
        const _tmp = this.parent.blockEthnicUpdates
        this.parent.blockEthnicUpdates = true

        const oldVals = {}
        oldVals[this.fullName] = this.getValue()
        this.setValue(this.defaultValue)
        this.getSimilar().forEach((modifier) => {
            oldVals[modifier.fullName] = modifier.getValue()
            modifier.setValue(modifier.defaultValue)
        })

        this.parent.blockEthnicUpdates = _tmp
        return this.getValue()
    }
}


/**
 * Container class for modifiers
 */
export class Modifiers {
    constructor(human) {
        this.human = human

        // container
        this.children = {}

        // flags
        this.blockEthnicUpdates = false // When set to True, changes to race are not normalized automatically
        // this.symmetryModeEnabled = false;


        // data
        this.modelingModifiers = Array.concat([], measurementModifiers, modelingModifiers)

        // metadata
        this.modifier_varMapping = {} // Maps macro variable to the modifier group that modifies it
        this.dependencyMapping = {} // Maps a macro variable to all the modifiers that depend on it

        // init
        this.loadModifiers().map(m => this.addModifier(m))
    }

    /**
     * Load modifiers from a modifier definition file.
     */
    loadModifiers(modelingModifiersData) {
        modelingModifiersData = this.modelingModifiers || modelingModifiers
            // console.debug("Loading modifiers from json")
        const modifiers = []
        const lookup = {}
        let modifier
        let ModifierClass
        modelingModifiersData.forEach((modifierGroup) => {
            const groupName = modifierGroup.group
            modifierGroup.modifiers.forEach((mDef) => {
                // Construct modifier
                if ("modifierType" in mDef) {
                    if (mDef.modifierType === "EthnicModifier") {
                        ModifierClass = EthnicModifier
                    } else {
                        throw new Error(`Uknown modifier type ${mDef.modifierType}`)
                    }
                } else if ('macrovar' in mDef) {
                    ModifierClass = MacroModifier
                } else {
                    ModifierClass = UniversalModifier
                }

                if ('macrovar' in mDef) {
                    modifier = new ModifierClass(groupName, mDef.macrovar)
                } else {
                    modifier = new ModifierClass(groupName, mDef.target, mDef.min, mDef.max, mDef.mid)
                }

                if ("defaultValue" in mDef) { modifier.defaultValue = mDef.defaultValue }

                modifiers.push(modifier)
                lookup[modifier.fullName] = modifier
            })
        })

        // console.debug('Loaded %s modifiers', modifiers.length)
        return modifiers
    }


    /**
    Modifiers of a class type.
    **/
    getModifiersByType(classType) {
        // TODO just build this once on init. Perhaps move to modifiers class
        return _.filter(this.children, m => m instanceof classType)
    }

    /** Get all modifiers for this human belonging to the same modifier group **/
    getModifiersByGroup(groupName) {
        // TODO just build this once on init. Perhaps move to modifiers class
        return _(this.children).values().filter(m => m.groupName === groupName).value()
    }

    /**
     * Update the targets for this human
     *  determined by the macromodifier target combinations
     */
    updateMacroModifiers() {
        for (let i = 0; i < this.children.length; i++) {
            const modifier = this.children[i]
            if (modifier.isMacro()) {
                modifier.setValue(modifier.getValue())
            }
        }
    }

    /** Attach a new modifier to this human. **/
    addModifier(modifier) {
        if (this.children[modifier.fullName] !== undefined) {
            console.error("Modifier with name %s is already attached to human.", modifier.fullName)
            return
        }

        // this._modifier_type_cache = {};
        this.children[modifier.fullName] = modifier

        // add to group
        // if (!this.modifier_groups[modifier.groupName])
        //     this.modifier_groups[modifier.groupName] = [];
        //
        // this.modifier_groups[modifier.groupName].push(modifier)

        // Update dependency mapping
        if (modifier.macroVariable && modifier.macroVariable !== 'None') {
            if (modifier.macroVariable in this.modifier_varMapping &&
                this.modifier_varMapping[modifier.macroVariable] !== modifier.groupName) {
                console.error(
                    "Error, multiple modifier groups setting var %s (%s && %s)",
                    modifier.macroVariable, modifier.groupName, this.modifier_varMapping[modifier.macroVariable]
                )
            } else {
                this.modifier_varMapping[modifier.macroVariable] = modifier.groupName

                // Update any new backwards references that might be influenced by this change (to make it independent of order of adding modifiers)
                const toRemove = [] // Modifiers to remove again from backwards map because they belong to the same group as the modifier controlling the var
                let dep = modifier.macroVariable
                const affectedModifierGroups = this.dependencyMapping[dep] || []
                for (let i = 0; i < affectedModifierGroups.length; i++) {
                    const affectedModifierGroup = affectedModifierGroups[i]
                    if (affectedModifierGroup === modifier.groupName) {
                        toRemove.push(affectedModifierGroup)
                        // console.debug('REMOVED from backwards map again %s', affectedModifierGroup)
                    }
                }

                if (toRemove.length > 0) {
                    if (toRemove.length === this.dependencyMapping[dep].length) {
                        delete this.dependencyMapping[dep]
                    } else {
                        this.dependencyMapping[dep] = this.dependencyMapping[dep].filter(groupName => !toRemove.includes(groupName))
                    }
                }

                for (let k = 0; k < modifier.macroDependencies.length; k++) {
                    dep = modifier.macroDependencies[k]
                    const groupName = this.modifier_varMapping[dep]
                    if (groupName && groupName === modifier.groupName) {
                        // Do not include dependencies within the same modifier group
                        // (this step might be omitted if the mapping is still incomplete (dependency is not yet mapped to a group), && can later be fixed by removing the entry again from the reverse mapping)
                        continue
                    }

                    if (!this.dependencyMapping[dep]) {
                        this.dependencyMapping[dep] = []
                    }
                    if (!this.dependencyMapping[dep].includes(modifier.groupName)) {
                        this.dependencyMapping[dep].push(modifier.groupName)
                    }
                    if (modifier.isMacro()){
                        this.updateMacroModifiers()
                    }
                }
            }
        }

        this.children[modifier.fullName] = modifier
            // modifier.human = this.human;
        modifier.parent = this
        // return this.children
    }

    /**
     *  Retrieve all modifiers that should be updated if the specified modifier
     *  is updated. (forward dependency mapping)
     */
    getModifierDependencies(modifier, filter) {
        const result = []

        if (modifier.macroDependencies.length > 0) {
            for (let l = 0; l < modifier.macroDependencies.length; l++) {
                const variable = modifier.macroDependencies[l]
                if (!this.modifier_varMapping[variable]) {
                    console.error("Modifier dependency map: Error variable %s not mapped", variable)
                    continue
                }

                const depMGroup = this.modifier_varMapping[variable]
                if (depMGroup !== modifier.groupName) {
                    if (filter && filter.length) {
                        if (filter.includes(depMGroup)) {
                            result.push(depMGroup)
                        } else {
                            continue
                        }
                    } else {
                        result.push(depMGroup)
                    }
                }
            }
        }
        return _.uniq(result)
    }

    /**
     *    Reverse dependency search. Returns all modifier groups to update that
     *    are affected by the change in the specified modifier. (reverse
     *    dependency mapping)
     */
    getModifiersAffectedBy(modifier, filter) {
        const result = this.dependencyMapping[modifier.macroVariable] || []
        if (filter === undefined || filter === null) {
            return result
        } else {
            return _.filter(result, e => filter.includes(e))
        }
    }

    /**
     *  A random value bounded between max and min by reflecting out of bounds
     *  values. This means that a normal dist around 0, with a min of zero gives
     *  half a normal dist
     * @param  {Number} minValue
     * @param  {Number} maxValue
     * @param  {Number} middleValue
     * @param  {Number} sigmaFactor = 0.2 - std deviation as a fraction of max and min
     * @param  {Number} rounding    - Decmals to keeps
     * @return {Number}             - random number
     */
    _getRandomValue(minValue, maxValue, middleValue, sigmaFactor = 0.2, rounding) {
        // TODO this may be better if we used d3Random.exponential for modifiers that go from 0 to 1 with a default at 0
        //
        const rangeWidth = Math.abs(maxValue - minValue)
        const sigma = sigmaFactor * rangeWidth
        let randomVal = d3Random.randomNormal(middleValue, sigma)()

        // below we enforce max and min by reflecting back values that are outside
        // in some cases this is used to get half a normal dist
        // e.g. for distributions from 0 to 1 centered around 0, this results half a normal dist
        if (randomVal < minValue) {
            randomVal = minValue + Math.abs(randomVal - minValue)
        } else if (randomVal > maxValue) {
            randomVal = maxValue - Math.abs(randomVal - maxValue)
        }
        randomVal = _.clamp(randomVal, minValue, maxValue)
        if (rounding) randomVal = _.round(randomVal, rounding)
        return randomVal
    }

    /**
     *  generate random modifiers values using appropriate distributions for each modifier
     * @param  {Number} symmetry  = 1     - Amount of symmetry preserved
     * @param  {Boolean} macro    = true  - Randomise macro modifiers
     * @param  {Boolean} height   = false
     * @param  {Boolean} face     = true
     * @param  {Boolean} body     = true
     * @param  {Number} rounding  = round to N decimal places
     * @return {Object}                   - modifier:value properties
     *                                      e.g. {'l-arm-length': 0.143145}
     */
    randomValues(symmetry = 1, macro = true, height = false, face = true, body = true, measure = false, rounding = 2, sigmaMultiple = 1) {
        // should have dist:
        // bimodal with peaks at 0 and 1 - gender
        // uniform - "macrodetails/Age", "macrodetails/African", "macrodetails/Asian", "macrodetails/Caucasian"
        // normal - all modifiers with left and right
        // exponentials - all targets with only right target
        //
        const modifierGroups = []

        if (macro) { modifierGroups.push.apply(modifierGroups, ['macrodetails', 'macrodetails-universal', 'macrodetails-proportions']) }
        if (measure) { modifierGroups.push.apply(modifierGroups, ['measure']) }
        if (height) { modifierGroups.push.apply(modifierGroups, ['macrodetails-height']) }
        if (face) {
            modifierGroups.push.apply(modifierGroups, [
                'eyebrows', 'eyes', 'chin',
                'forehead', 'head', 'mouth',
                'nose', 'neck', 'ears',
                'cheek'
            ])
        }
        if (body) {
            modifierGroups.push.apply(modifierGroups, ['pelvis', 'hip', 'armslegs', 'stomach', 'breast', 'buttocks', 'torso', 'legs', 'genitals'])
        }

        let modifiers = _.flatten(modifierGroups.map(mGroup => this.getModifiersByGroup(mGroup)))

        // Make sure not all modifiers are always set in the same order
        // (makes it easy to vary dependent modifiers like ethnics)
        modifiers = _.shuffle(modifiers)

        const randomValues = {}

        for (let j = 0; j < modifiers.length; j++) {
            let sigma = null,
                mMin = null,
                mMax = null,
                w = null,
                m2 = null,
                symMax = null,
                symMin = null,
                symmDeviation = null,
                symm = null,
                randomValue = null
            const m = modifiers[j]

            if (!(m.fullName in randomValues)) {
                if (m.groupName === 'head') {
                    // narow distribution
                    sigma = 0.1 * sigmaMultiple
                } else if (["forehead/forehead-nubian-less|more", "forehead/forehead-scale-vert-less|more"].indexOf(m.fullName) > -1) {
                    // very narrow distribution
                    sigma = 0.02 * sigmaMultiple
                } else if (m.fullName.search("trans-horiz") > -1 || m.fullName === "hip/hip-trans-in|out") {
                    if (symmetry === 1) {
                        randomValue = m.defaultValue
                    } else {
                        mMin = m.min
                        mMax = m.max
                        w = Math.abs(mMax - mMin) * (1 - symmetry)
                        mMin = Math.max(mMin, m.defaultValue - w / 2)
                        mMax = Math.min(mMax, m.defaultValue + w / 2)
                        randomValue = this._getRandomValue(mMin, mMax, m.defaultValue, 0.1, rounding)
                    }
                } else if (["forehead", "eyebrows", "neck", "eyes", "nose", "ears", "chin", "cheek", "mouth"].indexOf(m.groupName) > -1) {
                    sigma = 0.1 * sigmaMultiple
                } else if (m.groupName === 'macrodetails') {
                    if (["macrodetails/Age", "macrodetails/African", "macrodetails/Asian", "macrodetails/Caucasian"].indexOf(m.fullName) > -1) {
                        // people could be any age/race so a uniform distribution here
                        randomValue = Math.random()
                    } else if (["macrodetails/Gender"].indexOf(m.fullName) > -1) {
                        // most people are mostly male or mostly female
                        // a bimodal distribution here. we will do this by giving it a 50% change of default of 0 otherwise 1
                        const defaultValue = 1 * Math.random() > 0.5
                        randomValue = this._getRandomValue(m.min, m.max, defaultValue, 0.1, rounding)
                    } else {
                        sigma = 0.3 * sigmaMultiple
                    }
                } else {
                    sigma = 0.1 * sigmaMultiple
                }

                if (randomValue === null)
                // TODO also allow it to continue from current value? Probobly do that by setting the default to _.mean(m.defaultValue,m.value)
                    {
                    randomValue = this._getRandomValue(m.min, m.max, m.defaultValue, sigma, rounding)
                }

                randomValues[m.fullName] = randomValue

                symm = m.getSymmetricOpposite()
                if (symm && !(symm in randomValues)) {
                    if (symmetry === 1) {
                        randomValues[symm] = randomValue
                    } else {
                        m2 = this.human.getModifier(symm)
                    }
                    symmDeviation = ((1 - symmetry) * Math.abs(m2.max - m2.min)) / 2
                    symMin = Math.max(m2.min, Math.min(randomValue - (symmDeviation), m2.max))
                    symMax = Math.max(m2.min, Math.min(randomValue + (symmDeviation), m2.max))
                    randomValues[symm] = this._getRandomValue(symMin, symMax, randomValue, sigma, rounding)
                }
            }
        }

        // No pregnancy for male, too young || too old subjects
        // TODO add further restrictions on gender-dependent targets like pregnant && breast
        if (((randomValues["macrodetails/Gender"] || 0) > 0.5) ||
            ((randomValues["macrodetails/Age"] || 0.5) < 0.2) ||
            ((randomValues["macrodetails/Age"] || 0.7) < 0.75)) {
            if ("stomach/stomach-pregnant-decr|incr" in randomValues) {
                randomValues["stomach/stomach-pregnant-decr|incr"] = 0
            }
        }


        return randomValues
    }

    /** randomize the modifier value along a normal distribution **/
    randomize(symmetry = 1, macro = true, height = false, face = true, body = true, measure = false, rounding = 2, sigmaMultiple = 1) {
        // var oldValues = _.transform(modifiers, (a, m) => a[m.fullName] = m.getValue(), {})
        const randomVals = this.randomValues(symmetry, macro, height, face, body, measure, rounding, sigmaMultiple)


        for (const name in randomVals) {
            if (randomVals.hasOwnProperty(name)) {
                const value = randomVals[name]
                this.children[name].setValue(value, true)
            }
        }
        return randomVals
    }

    reset() {
        for (const name in this.children) {
            if (this.children.hasOwnProperty(name)) {
                this.children[name].resetValue()
            }
        }
    }

    exportConfig() {
        return _.values(this.children)
            .reduce((o, m) => {
                o[m.fullName] = m.getValue()
                return o
            }, {})
    }

    importConfig(json) {
        this.reset()
        return _.map(json, (value, modifierName) => this.children[modifierName].setValue(value))
    }

}
export default Modifiers
