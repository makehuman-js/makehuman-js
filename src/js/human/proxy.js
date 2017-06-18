/**
 * @name            MakeHuman
 * @copyright       MakeHuman Team 2001-2016
 * @license         [AGPL3]{@link http://www.makehuman.org/license.php}
 * @description     Manages meshes such as clothes which attatch to the human
 * and it's skeleton
 */

import _ from 'lodash'
import * as THREE from 'three'

/**
 * parseProxyUrl
 * @param  {String} url - e.g. "data/proxies/clothes/Bikini/Bikini.json#blue"
 * @return {Object}     - e.g. {group:"clothes",name:"Bikini",file:"bikini.json", materialName:"blue"}
 */
export const parseProxyUrl = (address) => {
    // if (!address.includes('#')) address += '#'
    const [fullUrl, materialName] = address.split('#')
    const [, , group, name, file] = fullUrl.match(/(.+\/)*(.+)\/(.+)\/(.+)\.json/)
    const key = `${group}/${name}/${file}.json${materialName ? `#${materialName}` : ''}`
    const thumbnail = `${group}/${name}/${materialName || file}.thumb.png`
    return { group, name, key, materialName: materialName || '', thumbnail }
}

export class Proxy extends THREE.Object3D {
    constructor(url, human, manager = new THREE.LoadingManager()) {
        super()

        this.manager = manager
        this.human = human

        // after fitting we expand the size by this fraction
        this.extraGeometryScaling = [1.0, 1.0, 1.0]

        this.loader = new THREE.XHRLoader(this.manager)

        const { name, group, materialName, key, thumbnail } = parseProxyUrl(url)
        this.key = key
        this.name = name
        this.group = group
        this.thumbnail = thumbnail
        this.materialName = materialName
        this.url = `${this.human.config.baseUrl}proxies/${this.key}`

        this.mesh = null
        this.visible = false
        this.metadata = {}
    }

    /** load a proxy from threejs json file, making it a child object and giving it the same skeleton **/
    load() {
        const self = this
        if (this.mesh) return Promise.resolve(this.mesh)
        return new Promise((resolve, reject) => {
            try {
                self.loader.load(self.url,
                        resolve,
                        undefined,
                        reject
                    )
            } catch (e) {
                reject(e)
            }
        })
            .catch((err) => {
                console.error('Failed to load proxy data', self.url, err)
            })
            .then(text => JSON.parse(text))
            .then((json) => {
                self.metadata = json.metadata
                const texturePath = self.texturePath &&
                    (typeof self.texturePath === 'string') ?
                        self.texturePath :
                        THREE.Loader.prototype.extractUrlBase(self.url)
                return new THREE.JSONLoader().parse(json, texturePath)
            })
            // use unpacking here to turn one args into two, as promises only return one
            .then(({
                geometry,
                materials
            }) => {
                geometry.name = self.url
                materials.map(m => (m.skinning = true))

                const mesh = new THREE.SkinnedMesh(geometry, new THREE.MultiMaterial(materials))

                // TODO check they are the same skeletons
                mesh.children.pop() // pop existing skeleton
                mesh.skeleton = self.human.skeleton

                mesh.castShadow = true
                mesh.receiveShadow = true

                self.mesh = mesh
                self.mesh.geometry.computeVertexNormals()
                self.add(mesh)

                // when it overlaps with body, show proxy (body has 0, we want higher ints)
                mesh.renderOrder = self.metadata.z_depth

                self.updatePositions()

                // change it to use the material specified in the url hash
                if (self.materialName) {
                    const materialIndex = _.findIndex(materials, material => material.name === self.materialName)
                    self.changeMaterial(materialIndex)
                }

                return mesh
            })
    }

    /** Turn mesh on or off, loading if needed **/
    toggle(state) {
        if (state === undefined) state = !this.visible
        if (this.visible === state) return Promise.resolve(this)
        this.visible = state
        let promisedMesh
        if (state === false) promisedMesh = Promise.resolve()
        else promisedMesh = this.load().then(() => this.updatePositions())
        return promisedMesh.then(() => this.human.proxies.updateFaceMask())
    }

    /**
     * This recalculates the coords of the proxy using the vertice inds, weights, and offsets
     * like in makehumans's proxy.py:Proxy.getCoords()
     */
    updatePositions() {
        // TODO faster to do this in the gpu
        // equation = vertice = w0 * v0 + w1 * v1 + w2*v2 + offset, where w0 = weights[i][0], v0 = ref_verts_i[0]
        if (!this.visible || !this.mesh) return null
        const o = this.metadata.offsets
        const w = this.metadata.weights
        const v = this.metadata.ref_vIdxs
            .map(row =>
                row.map(vIndx => this.human.mesh.geometry.vertices[vIndx])
            )

        // convert this.matrix to Matrix3
        const mw = this.matrix.elements
        const matrix = new THREE.Matrix3()
        matrix.set(mw[0], mw[1], mw[2], mw[4], mw[5], mw[6], mw[8], mw[9], mw[10]).transpose()
        const m = matrix.elements

        for (let i = 0; i < this.mesh.geometry.vertices.length; i++) {
            // xyz offsets calculated as dot(matrix, offsets)
            const vertice = new THREE.Vector3(
                o[i][0] * m[0] + o[i][1] * m[1] + o[i][2] * m[2],
                o[i][0] * m[3] + o[i][1] * m[4] + o[i][2] * m[5],
                o[i][0] * m[6] + o[i][1] * m[7] + o[i][2] * m[8]
            )

            // Three weights to three vectors
            for (let j = 0; j < 3; j++) {
                vertice.x += w[i][j] * v[i][j].x
                vertice.y += w[i][j] * v[i][j].y
                vertice.z += w[i][j] * v[i][j].z
            }
            this.mesh.geometry.vertices[i] = vertice
        }
        this.mesh.geometry.scale(...this.extraGeometryScaling)
        this.mesh.geometry.verticesNeedUpdate = true
        this.mesh.geometry.elementsNeedUpdate = true
        return this.mesh.geometry.vertices
    }

    changeMaterial(i) {
        if (i > this.mesh.material.materials.length) return this.mesh.material.materials.length
        this.mesh.geometry.faces.map(face => (face.materialIndex = i))
        this.mesh.geometry.groupsNeedUpdate = true
        return true
    }

    preRender() {

    }
    onAfterRender() {}
}


/**
 * Container for proxies
 */
export class Proxies extends THREE.Object3D {
    constructor(human) {
        super()
        this.human = human
        // Proxies
        // TODO replace with a better system
        // this._hairProxy = undefined
        // this._eyesProxy = undefined
        // this._eyebrowsProxy = undefined
        // this._eyelashesProxy = undefined
        // this._teethProxy = undefined
        // this._tongueProxy = undefined
        // this._clothesProxies = {}

        this._cache = {}

        // init an object for each proxy but don't load untill needed
        this.human.config.proxies
            .map(url => new Proxy(`${this.human.config.baseUrl}proxies/${url}`, this.human))
            .map(proxy => this.add(proxy))
    }

    /**
     * Toggles or sets a proxy
     * params:
     *   key {String} the url for the proxy  (relative to baseUrl) e.g. eyes/Low-Poly/Low-Poly.json#brown
     *   state {Boolean|undefined} set the proxy on or off or if undefined toggle it
     * returns a promise to load the mesh
     */
    toggleProxy(key, state) {
        // try to find an existing proxy with this key
        let proxy = _.find(this.human.proxies.children, p => p.url === key) ||
            _.find(this.human.proxies.children, p => p.key === key) ||
            _.find(this.human.proxies.children, p => p.name === key)
        // or init a new one
        if (!proxy) {
            console.warn(`Could not find proxy with key ${key}`)
            // throw new Error(`Could not find loaded proxy to toggle with key: ${key}`)
            proxy = new Proxy(`${this.human.config.baseUrl}proxies/${key}`, this.human)
            this.add(proxy)
        } else {
            console.log('toggleProxy', proxy.url, state)
        }
        return proxy.toggle(state)
    }

    updatePositions() {
        this.children.forEach(child => child.updatePositions())
    }

    /** Make faces to hide parts under clothes, see makehuman/plugins/3_libraries_clothes_choose.py:updateFaceMasks **/
    updateFaceMask(minMaskedVertsPerFace = 3) {
        // get deleted vertices from all active proxies
        const deleteVerts = this.children
            .filter(proxy =>
                proxy.visible &&
                proxy.mesh &&
                proxy.metadata.deleteVerts &&
                proxy.metadata.deleteVerts.length
             )
            .map(proxy => proxy.metadata.deleteVerts)
        const nbVertices = this.human.mesh.geometry.vertices.length
        const nullMaterial = this.human.mesh.material.materials.findIndex(m => m.name === 'maskedFaces')

        // for each vertice, see if any proxy wants to delete it
        const dv = Array(nbVertices)
        for (let i = 0; i < dv.length; i++) {
            dv[i] = _.sum(deleteVerts.map(vs => vs[i])) > 0
        }

        // if more than n vertices of a face are masked, mask the face else unmask
        this.human.mesh.geometry.faces.map((face) => {
            if ((dv[face.a] + dv[face.b] + dv[face.c]) >= minMaskedVertsPerFace) {
                face.materialIndex = nullMaterial
            } else {
                face.materialIndex = face.oldMaterialIndex
            }
            return face.materialIndex
        })
        this.human.mesh.geometry.groupsNeedUpdate = true

        const facesMasked = this.human.mesh.geometry.faces
        .filter(face => face.materialIndex === nullMaterial).length
        console.debug('vertices masked ', _.sum(dv), 'faces masked', facesMasked)
    }

    onElementsNeedUpdate() {
        this.updatePositions()
        this.children
        .filter(proxy => proxy.visible && proxy.mesh)
        .map(proxy => proxy.mesh.geometry.computeVertexNormals())
    }

    exportConfig() {
        return this.children.filter(p => p.visible).map(p => p.url)
    }

    importConfig(config) {
        this.children.map(p => (p.visible = false))
        this.updateFaceMask()
        return config.map(url => this.toggleProxy(url, true))
    }
}


export default Proxy
