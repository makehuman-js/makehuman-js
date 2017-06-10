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

describe('human.js', function(){
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

        it('should export to obj', function (done) {
            const human = new Human(config)
            human.loadModel(config)
            .then(() => {
                let obj = human.io.toObj()
                let vertice_nb = human.mesh.geometry.vertices.length
                let face_nb = human.mesh.geometry.faces.length
                let group_nb = _.uniq(human.mesh.geometry.faces.map(f => f.materialIndex)).length
                let counts = _.countBy(obj.split('\n').map(line => line.split(' ')[0]))
                expect(counts.v).to.equal(vertice_nb)
                expect(counts.g).to.equal(172)
                expect(counts.f).to.equal(face_nb)
                done()
            })

        });
    })
})
