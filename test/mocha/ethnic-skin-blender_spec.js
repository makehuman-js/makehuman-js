
import _ from 'lodash'
import * as THREE from 'three'

import {
    Human
} from '../../src/js/human/human.js'
import { config, expect } from './fixtures.js'

describe('ethnic-skin-blender.js', () => {
    describe('ethnicSkinBlender', () => {
        it('description', (done) => {
            const human = new Human(config)
            human.loadModel(config)
                .then(() => {
                    const color = self.human.ethnicSkinBlender.valueOf()
                    expect(color.isColor).to.be(true)
                    done()
                })
        })
    })
})
