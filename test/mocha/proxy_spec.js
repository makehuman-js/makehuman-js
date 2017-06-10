import _ from 'lodash'
import * as THREE from 'three'
import { loadHumanWithTargets, expect } from './fixtures.js'
import { Proxies, Proxy, parseProxyUrl } from '../../src/js/human/proxy'

describe('proxy.js', () => {
    let human
    before(() => {
        return loadHumanWithTargets()
            .then((loadedHuman) => {
                human = loadedHuman
            })
    })

    beforeEach('reset factors and targets', () => {
        human.proxies = new Proxies(human)
    })

    describe('Proxy', () => {

        describe('load', () => {
            // TODO test: changeMaterial toggle() toggle(true) toggle(false)
            //
            it('should load test data', () => {
                const proxy = new Proxy('clothes/female_sportsuit01/female_sportsuit01.json', human)
                return proxy.load().then(() => {
                    expect(proxy.mesh.geometry.vertices).to.have.length(1797)
                    expect(proxy.metadata.offsets).to.have.length(1797)
                    expect(proxy.metadata.weights).to.have.length(1797)
                    expect(proxy.metadata.ref_vIdxs).to.have.length(1797)
                    expect(proxy.mesh.skeleton).to.equal(proxy.human.skeleton)
                    expect(proxy.mesh.material.materials).to.be.an('array').with.length(1)
                    expect(proxy.mesh.geometry.faces[0].materialIndex).to.equal(0)
                })
            })
            // TODO make sure it loads female_sportsuit01 with normalMap, aoMap and diffuseMap
            // TODO make sure it loads fedora with displacement map
        });


        describe('updatePositions', () => {
            it('should give an expected output', () => {
                const proxy = new Proxy('clothes/female_sportsuit01/female_sportsuit01.json', human)
                return proxy.load().then(() => {
                    proxy.visible = true
                    proxy.matrix = new THREE.Matrix3()
                    proxy.matrix.set(...[1.17581407, 0.24112541, 0.22047869, 0.21796053, 1.0330958, 0.2008679, 0.20102205, 0.03048203, 1.00957655]).transpose()
                    proxy.updatePositions()
                    const afterSum = _.sum(proxy.mesh.geometry.vertices.map(v => v.length()))
                    expect(afterSum).to.be.closeTo(1994.2161, 0.0001)
                })
            })
        })
    })

        //
        //
    describe('Proxies', () => {
        // toggleProxy
        //
        // updatePositions
        //
        // updateFaceMask
        //
        // onElementsNeedUpdate
        //
        // exportConfig
        //
        // importConfig
    })

    describe('parseProxyUrl', () => {
        const urls = [
            [
                'clothes/female_sportsuit01/female_sportsuit01.json#black', {
                    group: "clothes",
                    name: "female_sportsuit01",
                    key: "clothes/female_sportsuit01/female_sportsuit01.json#black",
                    materialName: "black",
                    thumbnail: "clothes/female_sportsuit01/black.thumb.png"
                }
            ],
            [
                'data/proxies/clothes/female_sportsuit01/female_sportsuit01.json#black', {
                    group: "clothes",
                    name: "female_sportsuit01",
                    key: "clothes/female_sportsuit01/female_sportsuit01.json#black",
                    materialName: "black",
                    thumbnail: "clothes/female_sportsuit01/black.thumb.png"
                }
            ],
            [
                'http://localhost:8080/data/proxies/clothes/female_sportsuit01/female_sportsuit01.json', {
                    group: "clothes",
                    name: "female_sportsuit01",
                    key: "clothes/female_sportsuit01/female_sportsuit01.json",
                    materialName: "",
                    thumbnail: "clothes/female_sportsuit01/female_sportsuit01.thumb.png"
                }
            ]
        ]
        urls.forEach(([url, ans]) => {
            it(`should parse ${url}`, () => {
                const r = parseProxyUrl(url)
                expect(r).to.deep.equals(ans)
            })
        })
    })
})
