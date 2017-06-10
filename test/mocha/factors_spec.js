import _ from 'lodash'

import { Factors } from '../../src/js/human/factors.js'
import { loadHumanWithoutTargets, expect } from './fixtures.js'
import {
    Modifiers
} from '../../src/js/human/human-modifier.js'

describe('factors.js', () => {
    describe('Factors', () => {
        let factors = null
        before('promise human', () => {
            return loadHumanWithoutTargets()
                .then((human) => {
                    factors = human.factors
                    return human.factors
                })
        })

        beforeEach('reset factors and targets', () => {
            const human = factors.human
            human.mesh.updateMorphTargets() // and targets
            human.modifiers = new Modifiers(human) // reset modifiers
            factors = human.factors = new Factors(human) // and factors
        })

        const properties = ["african", "age", "asian", "bodyProportions", "breastFirmness", "breastSize", "caucasian", "gender", "height", "muscle", "weight"]

        const factorNames = ["age", "bodyproportions", "breastfirmness", "breastsize", "gender", "height", "muscle", "race", "weight"]

        const vals = ["_age", "_gender", "_weight", "_muscle", "_height", "_breastSize", "_breastFirmness", "_bodyProportions", "maleVal", "femaleVal", "childVal", "babyVal", "oldVal", "youngVal", "maxweightVal", "minweightVal", "averageweightVal", "maxmuscleVal", "minmuscleVal", "averagemuscleVal", "maxheightVal", "minheightVal", "averageheightVal", "maxcupVal", "mincupVal", "averagecupVal", "maxfirmnessVal", "minfirmnessVal", "averagefirmnessVal", "idealproportionsVal", "uncommonproportionsVal", "regularproportionsVal", "caucasianVal", "asianVal", "africanVal"]

        properties.forEach((prop) => {
            describe(`property ${prop}`, () => {
                it('should get', () => {
                    expect(factors).have.property(prop)
                    expect(factors).to.have.property(prop).that.satisfy(Number.isFinite)
                })

                it('should set ', () => {
                    factors[prop] = 0.1
                    expect(factors[prop]).to.equal(0.1)
                })
            })
        })

        factorNames.forEach((factor) => {
            describe(`factor ${factor}`, () => {
                // todo check results over a range of values
                // [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.9,1].forEach(
                it('should have normalised values', () => {
                    const categorys = factors.human.targets.categoryTargets[factor]
                    const releventFactors = categorys.map(cat => factors[`${cat}Val`])
                    const sum = _.sum(releventFactors)
                    expect(sum).to.equal(1)
                })
            })
        })

        describe('values', () => {
            vals.forEach((prop) => {
                it(`should get for ${prop}`, () => {
                    expect(factors).have.property(prop)
                    expect(factors).to.have.property(prop).that.satisfy(Number.isFinite)
                })
                it(`should set for ${prop}`, () => {
                    factors[prop] = 0.1
                    expect(factors[prop]).to.equal(0.1)
                })
            })
        })

        describe('functions', () => {
            // todo check results over a range of values
            // [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.9,1].forEach(

            it('getAgeYears', () => {
                const res = factors.getAgeYears()
                expect(res).to.be.a("number")
            })
            it('setAgeYears', () => {
                factors.setAgeYears(33)
                const res = factors.getAgeYears()
                expect(res).to.equal(33)
            })
            it('getHeightCm', () => {
                const res = factors.getHeightCm()
                expect(res).to.be.a("number")
            })
            it('getBoundingBox', () => {
                const res = factors.getBoundingBox()
                expect(res).to.have.property('min')
                    .that.is.an("object")
                    .that.has.keys('x', 'y', 'z')
                expect(res).to.have.property('max')
                    .that.is.an("object")
                    .that.has.keys('x', 'y', 'z')
                const values = _.concat(_.values(res.min), _.values(res.max))
                expect(values).to.all.satisfy(Number.isFinite)
                    // var valFinite = _.reduce(res.min, (accum, v, k) => accum && Number.isFinite(v), true)
                    // expect(valFinite).to.be.true
            })
            it('getDominantGender', () => {
                const res = factors.getDominantGender()
                expect(['male', 'female', null]).to.contain(res)
            })
            it('getEthnicity', () => {
                const res = factors.getDominantGender()
                expect(['african', 'asian', 'caucasian', null]).to.contain(res)
            })
        })
    })
})
