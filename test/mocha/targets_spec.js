import {
    Targets,
    Target,
    targets,
    TargetMetaData
} from '../../src/js/human/targets.js'
import targetList from 'makehuman-data/src/json/targets/target-list.json'
import targetCategories from 'makehuman-data/src/json/targets/target-category-data.json'
import Human from '../../src/js/human/human.js'
import _ from 'lodash'

import { loadHumanWithTargets, expect } from './fixtures.js'


describe('targets.js', () => {
    let target
    let human
    before(() => {
        return loadHumanWithTargets()
            .then((loadedHuman) => {
                human = loadedHuman
                human.mesh.geometry._bufferGeometry = {}
                const name = Object.keys(human.targets.children)[0]
                target = human.targets.children[name]
            })
    })

    beforeEach('reset factors and targets', () => {
        human.modifiers.reset() // reset modifiers
        Object.keys(human.morphTargetDictionary).map((name) => {
            human.morphTargetInfluences[name] = 0
        })
    })

    describe('Target', () => {
        const targetName = "base/test/testdata/data/targets/chin/chin-triangle.target"

        it('shoud construct', () => {
            const target = new Target(targetName)
            expect(target).to.be.a('object')
        })

        describe('properties', () => {
            // macroVariables, variables, categories, path, group, name
            Object.keys(targetList.targets).forEach((targetName) => {
                  it(targetName, () => {
                      const target = human.targets.children[targetName]
                      expect(target.macroVariables).to.be.an("array")
                      expect(target.variables).to.be.an("array")
                      expect(target.categories).to.be.an("object")
                      expect(target.path).to.be.a("string")
                        .that.has.length.above(0)
                      expect(target.group).to.be.a("string")
                        .that.has.length.above(0)
                      expect(target.name).to.be.a("string")
                        .that.has.length.above(0)
                  });
            })
        })

        describe('methods', () => {

            describe('get and set', () => {
                Object.keys(targetList.targets).forEach((targetName) => {
                      describe(targetName, () => {
                          it('should get ', () => {
                              const target = human.targets.children[targetName]
                              const res = target.value
                              expect(res).to.be.a("number")
                              .that.equals(human.morphTargetInfluences[human.morphTargetDictionary[target.name]])
                          })

                          it('should set', () => {
                              const target = human.targets.children[targetName]
                              const v = target.value = 0.694
                              expect(human.morphTargetInfluences[human.morphTargetDictionary[target.name]]).to.be.closeTo(v, 0.0001)
                          })
                      })
                  })


            })
            //
            // describe('toMorphTarget', () => {
            //
            //
            //     it('should create target vertices', () => {
            //         target.toMorphTarget(human)
            //             // make sure vertices add up
            //         const idealVal = human.mesh.geometry.vertices[119].clone().add({
            //             x: -0.05,
            //             y: 0.001,
            //             z: 0.001
            //         })
            //         expect(target.vertices[119]).to.deep.equal(idealVal)
            //     })
            //
            //     it('should apply to human', () => {
            //         target.toMorphTarget(human)
            //         human.mesh.updateMorphTargets()
            //         const i = human.morphTargetDictionary[target.name]
            //         const morphTarget = human.mesh.geometry.morphTargets[i]
            //         expect(morphTarget).to.equal(target)
            //     })
            //
            //     //
            //     // it('should apply to only one group', function () {
            //     //     target.toMorphTarget(human,'body')
            //     //     // TODO implements this, then find vertices on a differen't material index
            //     //     // and check they haven't changed
            //     // });
            //
            //     it('should have correct amount of differing vertices', () => {
            //         target.toMorphTarget(human)
            //         human.mesh.updateMorphTargets()
            //         const i = human.morphTargetDictionary[target.name]
            //         const origVerts = human.mesh.geometry.vertices
            //         const morphVerts = human.mesh.geometry.morphTargets[i].vertices
            //
            //         const diffs = []
            //         for (let i = 0; i < origVerts.length; i++) {
            //             if (!origVerts[i].equals(morphVerts[i])) {
            //                 const diff = origVerts[i].clone().sub(morphVerts[i]).length()
            //                 diffs.push(diff)
            //             }
            //         }
            //
            //         expect(_.max(diffs)).to.be.above(0.05)
            //         const inputs = _.keys(target.dVertices).length
            //         expect(diffs.length).to.be.equal(inputs)
            //     })
            // })
        })
    })

    describe('TargetMetaData', () => {
        it('should construct', () => {
            const targets = new TargetMetaData()
            expect(targets).to.be.a('object')
        })

        describe('methods', () => {
            let targets
            beforeEach(() => {
                targets = new TargetMetaData()
            })

            describe('getTargetsByGroup', () => {
                it('should work for example input', () => {
                    const tgroup = targets.getTargetsByGroup('expression-units-nose,compression')
                    expect(tgroup).to.have.length(3)
                        // expect it to be a Target
                    expect(tgroup[0].constructor.name).to.equal("Target")
                })
            })

            describe('pathToGroupAndCategories', () => {
                it('should work for "height old female.."', () => {
                    const res = targets.pathToGroupAndCategories('data/targets/macrodetails/height/female-old-averagemuscle-averageweight-minheight.target')
                    expect(res.categories).to.deep.equal({
                        weight: 'averageweight',
                        gender: 'female',
                        age: 'old',
                        height: 'minheight',
                        breastfirmness: null,
                        breastsize: null,
                        race: null,
                        muscle: 'averagemuscle',
                        bodyproportions: null
                    })
                    expect(res.group).to.equal("macrodetails-height")
                })

                it('should not change a group input', () => {
                    const input = "expression-units-eyebrows-right-extern"
                    const res = targets.pathToGroupAndCategories(input)
                    expect(res.group).to.equal(input)
                })

                // targets.targetUrls.forEach(path=>{
                //     it('should have non overlapping results for '+path, function () {
                //         var res=targets.pathToGroupAndCategories(path)
                //         expect(res.group).to.not.have.members(res.categories);
                //     });
                // })
            })


            describe('findTargets', () => {
                it('should output nested arrays', () => {
                    const res = targets.findTargets('torso-torso-vshape-less')
                        // should be an array of string array pairs
                        // e.g. [['a',['b','c',...]],...]
                    expect(res).to.be.an('array')
                        .that.has.deep.property('[0]')
                        .that.is.an('array')
                        .that.has.deep.property('[0]')
                        .that.is.a('string')
                    expect(res)
                        .to.have.deep.property('[0]')
                        .that.has.deep.property('[1]')
                        .that.is.an('array')
                        .that.has.deep.property('[0]')
                        .that.is.a('string')
                })

                it('should work for predefined inputs', () => {
                    const res = targets.findTargets('eyes-l-eye-corner2-up')
                    expect(res)
                        .to.deep.equal([
                            ['data/targets/eyes/l-eye-corner2-up.target', ['eyes-l-eye-corner2-up']]
                        ])
                })

                it('should return empty', () => {
                    const res = targets.findTargets('asd49gfdjlfds-feg354tgredfsdc32')
                    expect(res)
                        .to.be.empty
                })
            })
        })
    })

    describe('Targets', () => {
        it('should construct', () => {
            const human = new Human()
            const targets = new Targets(human)
            expect(targets).to.be.a('object')
            expect(targets).to.have.property('human').that.equals(human)
        })


        describe('applyTargets', () => {

            it('should have different vertices after applying', () => {
                const oldVertices = human.mesh.geometry.vertices.map(vert => vert.clone())
                human.modifiers.randomize()
                human.targets.lastBake = 0
                console.log(human.targets.applyTargets())
                const diffsVerts = _.map(human.mesh.geometry.vertices, (vert, i) => vert.distanceTo(oldVertices[i]))
                    .filter(diff => diff !== 0)

                expect(diffsVerts).to.have.length.above(0)
            })

            it('should get the same value after applying', () => {
                human.modifiers.randomize()
                const oldVals = _.map(human.targets.children, target => target.value)
                human.targets.lastBake = 0
                human.targets.applyTargets()

                const diffsVals = _.map(human.targets.children, target => target.value)
                    .map((val, i) => val - oldVals[i])
                    .filter(diff => diff !== 0)

                expect(diffsVals).to.have.length(0)
            })

        })
    })
})
