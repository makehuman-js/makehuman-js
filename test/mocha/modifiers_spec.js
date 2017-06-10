import { j$ as jStat } from 'jstat'
import _ from 'lodash'

import { loadHumanWithoutTargets, loadHumanWithTargets, config, expect, assert } from './fixtures.js'

// just for showing random dists
// import c3 from 'c3'
// import d3 from 'd3'

import {
    loadModifiers,
    ManagedTargetModifier,
    MacroModifier,
    UniversalModifier,
    EthnicModifier,
    Modifiers
} from '../../src/js/human/human-modifier.js'

import {
    Human
} from '../../src/js/human/human.js'

import {Factors} from '../../src/js/human/factors.js'
import {
    allTargets,
    Targets
} from '../../src/js/human/targets.js'
import modelingModifiersDesc from 'makehuman-data/src/json/sliders/modeling_modifiers_desc.json'

// classes of modifier to test
const classes = {
    UniversalModifier,
    MacroModifier,
    EthnicModifier,
}

/** A factory for mock humans to attach modifiers to **/
function mockModifierHuman() {
    return {
        modifiers: {}
    }
}

function findModifierOfClass(human, cls) {
    // load a human with modifiers and also the modifiers targets
    const modifier = _.find(human.modifiers.children, m => m instanceof cls)
    return modifier
}


describe('human-modifiers.js', () => {
    describe('Modifiers', () => {
        describe('with unloaded human', () => {
            let human
            beforeEach('loadHumanNoMeshOrTargets', () => {
                human = new Human()
                return human
            })


            describe('function loadModifiers', () => {
                it('should load with names matching modeling_modifiers_desc.json', () => {
                    const modifiers = new Modifiers({})
                    modifiers.loadModifiers()
                    expect(_.keys(modifiers.children)).to.have.length.above(0)
                    expect(modifiers.children).to.contain.keys(_.keys(modelingModifiersDesc))
                })
            })

            describe('categories', () => {
                // describe('should have a macromodifier for every factor', function () {
                //     var factors = _.keys(new Human().targets.categoryTargets)
                //     factors.forEach(function (factor) {
                //         it('should have one macromodifier for ' + factor, function () {
                //             var macroModifiers = _.filter(human.modifiers.children, m => m.name.toLowerCase() == factor)
                //             expect(macroModifiers).to.have.length(1)
                //         });
                //     })
                // })

                describe('should have factors for every macroModifier', () => {
                    const macroModifiers = _.filter(new Human().modifiers.children, m => m instanceof MacroModifier)
                    macroModifiers.forEach((macroModifier) => {
                        it(`should have factors for ${macroModifier.name}`, () => {
                            const human = new Human()
                            const categories = human.targets.categoryTargets[macroModifier.macroVariable]
                            expect(categories).to.not.be.empty
                            const values = categories.map(c => human.factors[`${c}Val`])
                            expect(values).to.not.include(undefined)
                        })
                    })
                })
            })

            describe('dependencyMapping', () => {
                it('should include macrovarables', () => {
                    const idealRes = {
                        age: ['breast',
                            'macrodetails-universal',
                            'macrodetails-height',
                            'macrodetails-proportions'
                        ],
                        bodyproportions: ['macrodetails-proportions'],
                        gender: ['breast',
                            'macrodetails-universal',
                            'macrodetails-height',
                            'macrodetails-proportions'
                        ],
                        muscle: ['breast', 'macrodetails-height', 'macrodetails-proportions'],
                        weight: ['breast', 'macrodetails-height', 'macrodetails-proportions']
                    }
                    const res = human.modifiers.dependencyMapping
                    expect(res).to.include.keys(['age', 'gender'])
                    expect(res.constructor).equal(Object)
                })
            })

            describe('getModifiersAffectedBy', () => {
                const macroVars = {
                    weight: ["breast", "macrodetails-height", "macrodetails-proportions"],
                    gender: ["breast", "macrodetails-universal", "macrodetails-height", "macrodetails-proportions"],
                    age: ["breast", "macrodetails-universal", "macrodetails-height", "macrodetails-proportions"],
                    height: [],
                    breastfirmness: [],
                    breastsize: [],
                    race: [],
                    muscle: ["breast", "macrodetails-height", "macrodetails-proportions"],
                    None: []
                }


                const possibleVals = ['breast', 'macrodetails-height', 'macrodetails-proportions', 'macrodetails-universal']


                for (const macroVar in macroVars) {
                    if (macroVars.hasOwnProperty(macroVar)) {
                        const idealRes = macroVars[macroVar]

                        it(`should work for predefined inputs ${macroVar}`, () => {
                            const mockModifier = {
                                macroVariable: macroVar
                            }
                            const res = human.modifiers.getModifiersAffectedBy(mockModifier)

                            expect(res.sort()).to.be.a("array").that
                                .deep.equals(idealRes.sort())
                        })
                    }

                    it(`should return filtered results ${macroVar}`, () => {
                        const mockModifier = {
                            macroVariable: macroVar
                        }
                        const fitler = ['macrodetails', 'macrodetails-universal']
                        const res = human.modifiers.getModifiersAffectedBy(mockModifier, fitler)

                        expect(res.sort()).to.be.a("array")
                        expect(fitler).to.include.members(res.sort())
                    })
                }
            })

            describe('getModifiersByGroup', () => {
                const possibleVals = {
                    "breast": ["breast/BreastSize", "breast/BreastFirmness", "breast/breast-trans-vert-down|up", "breast/breast-dist-min|max", "breast/breast-point-min|max", "breast/breast-volume-vert-up|down", "breast/nipple-size-min|max", "breast/nipple-point-in|out"],
                    "macrodetails-height": ["macrodetails-height/Height"],
                    "macrodetails-proportions": ["macrodetails-proportions/BodyProportions"],
                    "macrodetails-universal": ["macrodetails-universal/Muscle", "macrodetails-universal/Weight"]
                }

                for (const group in possibleVals) {
                    if (possibleVals.hasOwnProperty(group)) {
                        const idealRes = possibleVals[group]
                        it(`should work for predefined values ${group}`, () => {
                            let res = human.modifiers.getModifiersByGroup(group)
                            res = res.map(m => m.fullName)
                            expect(res.sort()).to.be.an('array')
                                .that.deep.equals(idealRes.sort())
                        })
                    }
                }
            })

            describe('getModifierDependencies', () => {
                const macroDeps = {
                    "macrodetails-proportions/BodyProportions": ["macrodetails-universal", "macrodetails"],
                    "breast/BreastFirmness": ["macrodetails-universal", "macrodetails"],
                    "breast/BreastSize": ["macrodetails-universal", "macrodetails"],
                    "macrodetails-universal/Muscle": ["macrodetails"],
                    "macrodetails-height/Height": ["macrodetails-universal", "macrodetails"],
                    "macrodetails-universal/Weight": ["macrodetails"],
                    'hip/hip-waist-down|up': [],
                    'macrodetails/African': []
                }

                for (const fullName in macroDeps) {
                    if (macroDeps.hasOwnProperty(fullName)) {
                        const idealRes = macroDeps[fullName]

                        it(`should give predefined results for ${fullName}`, () => {
                            const modifier = _.find(human.modifiers.children, m => m.fullName == fullName)
                            const res = human.modifiers.getModifierDependencies(modifier)

                            expect(res.sort()).to.be.an("array")
                                .that.deep.equals(idealRes.sort())
                        })
                    }
                }

                it('should filter', () => {
                    const fullName = "macrodetails-proportions/BodyProportions"
                    const filter = ["macrodetails-universal"]
                    const modifier = _.find(human.modifiers.children, m => m.fullName == fullName)
                    const res = human.modifiers.getModifierDependencies(modifier, filter)

                    expect(res.sort()).to.be.an("array")
                        .that.deep.equals(filter)
                })
            })

            describe('getModifiersByType', () => {
                const modifierTypes = [EthnicModifier, UniversalModifier, MacroModifier]
                for (const name in classes) {
                    if (classes.hasOwnProperty(name)) {
                        const cls = classes[name]

                        it(`should work for ${name}`, () => {
                            const res = human.modifiers.getModifiersByType(cls)
                            expect(res.sort()).to.be.an('array')
                                .that.all.an.instanceof(cls)
                        })
                    }
                }
            })

            describe('_getRandomValue', () => {
                it('should give valid numbers', () => {
                    const res = human.modifiers._getRandomValue(0, 1, 0.5)
                    expect(res).to.be.a("number").that.satisfy(Number.isFinite)
                })

                // should have dist:
                // bimodal exp at 0 and 1 - gender
                // uniform - "macrodetails/Age", "macrodetails/African", "macrodetails/Asian", "macrodetails/Caucasian"
                // normal - all modifiers with left and right
                // exponentials - all targets with only right target
            })

            describe('randomValues', () => {
                it('should randomize all modifiers', () => {
                    const res = human.modifiers.randomValues(1, true, true, true, true, true)

                    expect(res).to.be.an("object")
                    expect(res).to.contain.keys(_.keys(human.modifiers.children))
                })

                describe('distribution', () => {
                    let sampleOfRandomVals = []

                    beforeEach(() => {
                        sampleOfRandomVals = []
                        for (let i = 0; i < 200; i++) {
                            // TODO sort by modifier
                            sampleOfRandomVals.push(human.modifiers.randomValues(1, true, true, true, true, true, 2))
                        }

                        // now index them by modifier
                        sampleOfRandomVals = _.transform(sampleOfRandomVals,
                            (res, item) => _.map(item,
                                (val, mName) => (res[mName] || (res[mName] = [])).push(val)
                            ), {})
                    })

                    it('should be within modifier bounds', () => {
                        const res = human.modifiers.randomValues(1, true, true, true, true, true, 2)
                        const values = _.values(res)
                        const outSideBounds = _.filter(human.modifiers.children, (m) => {
                            return (_.max(res[m.fullName]) > m.max) || _.min(res[m.fullName]) < m.min
                        })
                        expect(outSideBounds).be.empty
                    })
                })


                it('should output finite numbers', () => {
                    const res = human.modifiers.randomValues(1, true, true, true, true, true, 2)
                    const numbers = _.values(res)

                    assert.isObject(res)
                    expect(numbers).to.all.satisfy(Number.isFinite)
                })

                it('should output non default numbers', () => {
                    const res = human.modifiers.randomValues(1, true, true, true, true, true)
                    let unchanged = _.filter(human.modifiers.children, (modifier, name) => {
                        return res[modifier.fullName] == modifier.default
                    })
                    if (unchanged) unchanged = unchanged.map(m => m.fullName)
                        // these onces are acceptable for now
                    _.pullAll(unchanged, ["genitals/penis-length-min|max", "genitals/penis-circ-min|max", "genitals/penis-testicles-min|max", "macrodetails-height/Height", "legs/legs-upperlegheight-decr|incr", "legs/legs-lowerlegheight-decr|incr"])
                    expect(unchanged).to.be.empty
                })

                it('should output numbers within modifier bounds', () => {
                    const res = human.modifiers.randomValues(1, true, true, true, true, true, 2)
                    const values = _.values(res)
                    const outSideBounds = _.filter(human.modifiers.children, (m) => {
                        return (res[m.fullName] > m.max) || res[m.fullName] < m.min
                    })
                    expect(outSideBounds).be.empty
                })
            })
        })

        describe('with loaded human', () => {
            let human
            beforeEach(() => {
                return loadHumanWithTargets()
                    .then((loadedHuman) => {
                        human = loadedHuman
                    })
            })

            // describe('randomize()', function () {
            //     // TODO
            //
            // })

            describe('reset', () => {
                it('should result in default values', () => {
                    // set random values
                    const modifiers = _.values(human.modifiers.children)
                    _.map(modifiers, modifier => modifier.setValue(_.random(0, 1, true)))
                    human.modifiers.reset()
                    for (const name in human.modifiers.children) {
                        if (human.modifiers.hasOwnProperty(name)) {
                            const modifier = human.modifiers.children[name]
                            const newValue = modifier.getValue()
                            expect(newValue).to.equal(modifier.defaultValue)
                        }
                    }
                })
            })
        })
    })


    describe('Modifier', () => {

        let human
        before(() => {
            return loadHumanWithTargets()
                .then((loadedHuman) => {
                    human = loadedHuman
                })
        })

        beforeEach('reset factors and targets', () => {
            human.modifiers.reset() // reset modifiers
            human.mesh.updateMorphTargets() // and targets
            human.modifiers = new Modifiers(human)
            human.factors = new Factors(human) // and factors
        })

        describe('Every modifier', () => {
            // this is an imperfect test because it's too slow to do 400*2 times

            const modifiers = _.keys(modelingModifiersDesc)
            modifiers.forEach((fullName) => {
                describe(`modifier ${fullName}`, () => {
                    let modifier
                    before(() => {
                        modifier = human.modifiers.children[fullName]
                    })

                    it('should get a finite number', () => {
                        const res = modifier.getValue()
                        expect(res).to.be.a("number")
                        expect(Number.isFinite(res)).to.be.true
                    })
                    it('should change targets when it sets', () => {
                        const targets = modifier.targets.map(t => human.targets.children[t[0]])
                        const initValues = targets.map(t => t.value)
                        const v = _.random(0.1, 0.4, true)
                        modifier.setValue(v)

                        const res = targets.map(t => t.value)
                        expect(res).to.not.deep.equal(initValues)
                            // expect(Number.isFinite(res)).to.be.true
                    })

                    it('should set then get the same value', () => {
                        // this ensures the factors are normalised properly
                        const v = _.random(0.1, 0.4, true)
                        modifier.setValue(v)
                        const res = modifier.getValue()
                        expect(res).to.be.closeTo(v, 0.001)
                    })
                })
            })
        })

        describe('Common properties', function () {
            for (const name in classes) {
                if (classes.hasOwnProperty(name)) {
                    describe(name, () => {
                        this.timeout(5000)
                        const cls = classes[name]

                        it('should construct', () => {
                            const modifier = new cls("base/data/targets/chin/chin-triangle.target", "base/data/targets/chin/chin-triangle.target")
                            expect(modifier).to.exist
                        })

                        describe('properties', () => {
                            let modifier

                            beforeEach('load a modifier of class ', () => {
                                modifier = _.find(human.modifiers.children, m => m instanceof cls)
                                expect(modifier).to.exist
                            })

                            it('should have function getValue', () => {
                                const v = modifier.getValue()
                                expect(v).to.be.a('number')
                                expect(v).not.to.be.NaN
                            })

                            it('should have function setValue', () => {
                                modifier.setValue(0.1)
                                const v = modifier.getValue()
                                expect(v).to.be.closeTo(0.1, 0.0001)
                                    // TODO check value or targets
                            })

                            it('should have function resetValue', () => {
                                const v = modifier.resetValue()
                                expect(v).to.be.a('number')
                                expect(v).not.to.be.NaN
                            })

                            it('should have function min', () => {
                                const v = modifier.min
                                expect(v).to.be.a('number')
                                expect(v).not.to.be.NaN
                            })

                            it('should have function max', () => {
                                const v = modifier.max
                                expect(v).to.be.a('number')
                                expect(v).not.to.be.NaN
                            })

                            it('should have function clampValue', () => {
                                const max = modifier.max || 1
                                const min = modifier.min || 0
                                const mean = (max - min) / 2
                                expect(modifier.clampValue(max + 1)).to.equal(max)
                                expect(modifier.clampValue(min - 1)).to.equal(min)
                                expect(modifier.clampValue(mean)).to.equal(mean)
                            })

                            it('should have function propagateUpdate', () => {
                                expect(modifier.propagateUpdate(true))
                                expect(modifier.propagateUpdate(false))
                            })

                            describe('updateValue', () => {
                                it('should update modifier value', () => {
                                    const v = 0.1345
                                    modifier.updateValue(v, true)
                                    const res = modifier.getValue()
                                    expect(res).to.be.closeTo(v, 0.0001)
                                })

                                // TODO move this. Macrovars don't update targets, they update factors
                                // it('should update influences', function () {
                                //     var v = 0.1138
                                //     modifier.updateValue(v, true)
                                //     var influences = modifier.targets.map(t => t[0])
                                //         .map(n => modifier.parent.human.mesh.morphTargetDictionary[n])
                                //         .map(i => modifier.parent.human.mesh.morphTargetInfluences[i])
                                //     expect(influences).to.include(v)
                                // });
                            })

                            it('should have function getSymmetrySide', () => {
                                const res = modifier.getSymmetrySide()
                                expect(['l', 'r', null]).to.include(res)
                            })

                            it('should have function getSymmetricOpposite', () => {
                                const res = modifier.getSymmetricOpposite()
                                if (res) {
                                    expect(res).to.be.a("string")
                                    const opmodifier = _.find(human.modifers.children, m => m.fullName == res)
                                    expect(opmodifier).to.be.instanceof(modifier.constructor)
                                } else {
                                    expect(res).to.be.null
                                }
                            })

                            it('should getSimilar', () => {
                                const res = modifier.getSimilar()
                                expect(res).to.be.an("array")
                                    .that.all.instanceof(modifier.constructor)
                                const names = res.map(m => m.fullName)
                                expect(names).to.not.include(modifier.fullName)
                            })

                            it('should have isMacro', () => {
                                expect(modifier.isMacro()).to.be.a('boolean')
                            })

                            describe('findMacroDependencies', () => {
                                it('work for right', () => {
                                    const res = modifier.findMacroDependencies(modifier.right)
                                })

                                it('work for groupName', () => {
                                    const res = modifier.findMacroDependencies(modifier.groupName)
                                })

                                it('should work for predefined inputs', () => {
                                    const res = modifier.findMacroDependencies('breast')
                                    expect(res).to.eql(['age', 'breastfirmness', 'breastsize', 'gender', 'muscle', 'weight'])
                                })
                            })

                            describe('getTargetWeights', () => {
                                it('should give a result', () => {
                                    const targetNames = modifier.targets.map(t => t[0])
                                    const inputVal = 0.825
                                    const res = modifier.getTargetWeights(inputVal)

                                    expect(res).to.be.an("object").that.contains.keys(targetNames)

                                    const values = _.values(res)
                                    expect(values).to.all.satisfy(Number.isFinite)
                                })

                                // hm this doesn't seem to be true. Not for macromodifiers after being set. Same is true for makehuman
                                // it('should give normalized weights', function () {
                                //     var targetNames = modifier.targets.map(t => t[0])
                                //     var inputVal = 0.825
                                //     var res = modifier.getTargetWeights(inputVal)
                                //
                                //     var values = _.values(res)
                                //     expect(_.sum(values)).to.be.closeTo(inputVal, 0.01)
                                // });

                                it('should give known output for input', () => {
                                    const africanModifier = _.find(human.modifiers.children, (v, n) => v.name == 'African')
                                    const res = africanModifier.getTargetWeights(1)
                                    expect(_.keys(res)).to.have.length(24)
                                    expect(res['data/targets/macrodetails/caucasian-female-young.target']).to.closeTo(0.1666666666666667, 0.01)
                                    expect(res['data/targets/macrodetails/caucasian-male-baby.target']).to.equal(0.0)
                                })
                            })


                            it('getFactors', () => {
                                const macroFactors = ["african", "asian", "averagecup", "averagefirmness", "averageheight", "averagemuscle", "averageweight", "baby", "caucasian", "child", "female", "idealproportions", "male", "maxcup", "maxfirmness", "maxheight", "maxmuscle", "maxweight", "mincup", "minfirmness", "minheight", "minmuscle", "minweight", "old", "regularproportions", "uncommonproportions", "young"]

                                const res = modifier.getFactors(0.3)
                                expect(res).to.be.a("object") // is an object not array
                                const ownFactors = _.flatten(modifier.targets.map(m => m[1]))
                                expect(res).to.contain.keys(_.concat(ownFactors, macroFactors))
                            })

                            // properties
                            it('should have property macroDependencies that is an array of strings', () => {
                                const res = modifier.macroDependencies
                                const possibleVals = [undefined, "age", "weight", "height", "muscle", "race", "gender", "breastfirmness", "breastsize", "bodyproportions"]
                                expect(modifier.macroDependencies).to.be.an('array')
                                expect(possibleVals).to.include.members(modifier.macroDependencies)
                            })

                            it('should have property macroVariable', () => {
                                expect(modifier).to.have.property('macroVariable')
                                if (modifier.macroVariable !== null) {
                                    expect(modifier.macroVariable).to.be.a('string')
                                }
                            })

                            it('should have property name', () => {
                                expect(modifier).to.have.property('name').that.is.a('string')
                            })

                            it('should have property groupName', () => {
                                expect(modifier).to.have.property('groupName').that.is.a('string')
                            })

                            it('should have property description', () => {
                                expect(modifier).to.have.property('description').that.is.a('string')
                            })

                            it('should have property fullName', () => {
                                expect(modifier).to.have.property('fullName').that.is.a('string')
                            })

                            it('should have property targets', () => {
                                expect(modifier).to.have.property('targets').that.is.an('array')
                            })
                        })
                    })
                }
            }
        })

        describe('Unique properties', () => {
            // now methods and properties unique to each modifier
            describe('UniversalModifier', () => {
                let modifier
                beforeEach('set modifier to a UniversalModifier', () => {
                    modifier = _.find(human.modifiers.children, m => m instanceof UniversalModifier)
                })

                it('left,center,right', () => {
                    // left, right, center. At least one must be a target string
                    expect(modifier).to.have.property('right').that.is.ok
                    expect(modifier).to.include.any.keys(['left', 'center', 'right'])
                })
            })
            describe('MacroModifier only properties', () => {
                let modifier
                beforeEach('set modifier to first a MacroModifier', () => {
                    modifier = _.find(human.modifiers.children, m => m instanceof MacroModifier)
                })

                it('should have setter', () => {
                    expect(modifier).to.have.property('setter').that.is.a('string')
                    expect(human.factors).to.have.property(modifier.setter)
                })
                it('should have getter', () => {
                    expect(modifier).to.have.property('getter').that.is.a('string')
                    expect(human.factors).to.have.property(modifier.getter)
                })
                it('macroVariable', () => {
                    const possibleVals = _.concat(_.keys(modifier.targetMetaData.categoryTargets), [null])
                    const res = modifier.macroVariable
                    expect(possibleVals).to.include(res)
                })
            })
        })
    })
})
