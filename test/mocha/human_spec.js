/**
 * Testing human.js
 */

import _ from 'lodash'
import * as THREE from 'three'

import {
    Human
} from '../../src/js/human/human.js'
import { Factors } from '../../src/js/human/factors.js'
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
        }).timeout(6000)

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

        it('should set pose', function () {
            const human = new Human(config)
            return human.loadModel(config)
            .then(() => {
                // const oldBones = human.skeleton.bones.map(bone => bone.clone())
                human.setPose('standing04')
                const boneQuarternionSum = _.sum(human.skeleton.bones.map(b=>b.quaternion).map(q=>_.sum([q._x,q._y,q._z])))
                return expect(boneQuarternionSum).to.be.gt(0)
            })

        });
    })


    describe('HumanIO', () => {
        it('should export to obj', (done) => {
            const human = new Human(config)
            human.loadModel(config)
            .then(() => {
                const obj = human.io.toObj(true)
                const verticeNb = human.mesh.geometry.vertices.length
                const faceNb = human.mesh.geometry.faces.length
                const counts = _.countBy(obj.split('\n').map(line => line.split(' ')[0]))
                expect(counts.v).to.equal(verticeNb)
                expect(counts.g).to.equal(172)
                expect(counts.f).to.equal(faceNb)
                })
                .then(() => done())
                .catch(error => done(error))
        }).timeout(6000)

        it('should export to obj without helpers', (done) => {
            const human = new Human(config)
            human.loadModel(config)
            .then(() => {
                const obj = human.io.toObj(false)
                const verticeNb = human.mesh.geometry.faces.filter(f=>f.materialIndex==0).reduce((o,f)=>{
                    f.a in o? null: o.push(f.a)
                    f.b in o? null: o.push(f.b)
                    f.c in o? null: o.push(f.c)
                    return o
                 }, []).length
                const counts = _.countBy(obj.split('\n').map(line => line.split(' ')[0]))
                expect(counts.v).to.equal(verticeNb)
                expect(counts.g).to.equal(1)
                })
                .then(() => done())
                .catch(error => done(error))
            
        }).timeout(6000)
    })
})
