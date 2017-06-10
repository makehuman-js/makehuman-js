/**
 * Testing human.js
 */

import _ from 'lodash'
import * as THREE from 'three'

import {
    Human
} from '../../src/js/human/human.js'
import {Factors} from '../../src/js/human/factors.js'
import { loadHumanWithoutTargets, loadHumanWithTargets, config, expect, assert } from './fixtures.js'
import {
    Modifiers
} from '../../src/js/human/human-modifier.js'

describe('human.js', () => {

    describe('Human', () => {

        // TODO save, load

        it('should create instances', () => {
            const human = new Human(config)
            return expect(human).to.exist
        })

        it('should load model from config', (done) => {
            const human = new Human(config)
            human.loadModel(config)
                .then(() => {
                    expect(human).to.have.property('mesh').that.has.property('geometry')
                    expect(human).to.have.property('mesh').that.has.property('material')
                    done()
                })
        })

        it('should load targets from config', (done) => {
            const human = new Human(config)
            human.loadModel(config)
                .then(() => human.loadTargets())
                .then(() => {
                    expect(human).to.have.property('mesh').that.has.property('geometry')
                    expect(human).to.have.property('mesh').that.has.property('material')
                    done()
                })
        })

        it('should not override Object3D property', () => {
            const obj = new THREE.Object3D()
            const human = new Human()

            const oldProps = Object.getOwnPropertyNames(obj)
            const newProps = Object.getOwnPropertyNames(human)
            expect(newProps).to.include.members(oldProps)
        })
    })
})
