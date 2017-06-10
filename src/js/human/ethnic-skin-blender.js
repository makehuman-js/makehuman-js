/**
 * @name            MakeHuman
 * @copyright       MakeHuman Team 2001-2016
 * @license         [AGPL3]{@link http://www.makehuman.org/license.php}
 * @description     blends three ethnic skin tones
 */
import * as THREE from 'three'
import _ from 'lodash'

// these are set to look right when added to the caucasian skin
const asianColor = new THREE.Color().setHSL(0.078, 0.34, 0.576)
const africanColor = new THREE.Color().setHSL(0.09, 0.83, 0.21)
const caucasianColor = new THREE.Color().setHSL(0.062, 0.51, 0.68)


export class EthnicSkinBlender {
    /**
     * return a blend of the three ethnic skin tones based on the human macro settings.
    **/
    constructor(human) {
        this.human = human
    }

    valueOf() {
        const blends = [
            this.human.factors.getCaucasian(),
            this.human.factors.getAfrican(),
            this.human.factors.getAsian()
        ]

        // Set diffuse color
        const color = new THREE.Color(0, 0, 0)
            .add(caucasianColor.clone().multiplyScalar(blends[0]))
            .add(africanColor.clone().multiplyScalar(blends[1]))
            .add(asianColor.clone().multiplyScalar(blends[2]))
        // clamp to [0,1]
        return color.fromArray(color.toArray().map(v => _.clamp(v, 0, 1)))
    }
}

export default EthnicSkinBlender
