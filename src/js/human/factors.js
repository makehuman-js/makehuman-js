/**
 * @name            MakeHuman
 * @copyright       MakeHuman Team 2001-2016
 * @license         [AGPL3]{@link http://www.makehuman.org/license.php}
 * @author          wassname
 * @description
 * Describes human class which holds the 3d mesh, modifiers, human factors,
 * and morphTargets.
 */

import _ from 'lodash'

/**
 * This class stores macrovariables. They need transformation and it happens
 * here through getters and setters
 */
export class Factors {
    constructor(human) {
        this.human = human
        this.setDefaultValues()
    }

    setDefaultValues() {
        this.MIN_AGE = 1
        this.MAX_AGE = 90
        this.MID_AGE = 25.0
        // TODO BMI needs adjusting to weightKg comes out Ok and BMI=25 corresponds to weight=0.5
        this.MIN_BMI = 15
        this.MAX_BMI = 35

        this._age = 0.5
        this._gender = 0.5
        this._weight = 0.5
        this._muscle = 0.5
        this._height = 0.5
        this._breastSize = 0.5
        this._breastFirmness = 0.5
        this._bodyProportions = 0.5

        this._setGenderVals()
        this._setAgeVals()
        this._setWeightVals()
        this._setMuscleVals()
        this._setHeightVals()
        this._setBreastSizeVals()
        this._setBreastFirmnessVals()
        this._setBodyProportionVals()

        this.caucasianVal = 1 / 3
        this.asianVal = 1 / 3
        this.africanVal = 1 / 3
    }

    // //////////////////////////////////
    // Non getter and setter functions //
    // //////////////////////////////////

    /**
    The height approximatly in  cm.
    **/
    getHeightCm() {
        const bBox = this.getBoundingBox()
        return 10 * (bBox.max.y - bBox.min.y)
    }

    /**
    Bounding box of the basemesh without the helper groups
    **/
    getBoundingBox() {
        if (!this.human.mesh.geometry.boundingBox) { this.human.mesh.geometry.computeBoundingBox() }
        return this.human.mesh.geometry.boundingBox
    }

    /**
    Approximate age in years.
    **/
    getAgeYears() {
        if (this.getAge() < 0.5) {
            return this.MIN_AGE + ((this.MID_AGE - this.MIN_AGE) * 2) * this.getAge()
        } else {
            return this.MID_AGE + ((this.MAX_AGE - this.MID_AGE) * 2) * (this.getAge() - 0.5)
        }
    }

    /**
    Set age in years.
    **/
    setAgeYears(ageYears, updateModifier = true) {
        let age
        ageYears = parseFloat(ageYears)
        if (ageYears < this.MIN_AGE || ageYears > this.MAX_AGE) {
            throw new Error("RuntimeError Invalid age specified, should be minimum %s && maximum %s. % ", this.MIN_AGE, this.MAX_AGE)
        }
        if (ageYears < this.MID_AGE) { age = (ageYears - this.MIN_AGE) / ((this.MID_AGE - this.MIN_AGE) * 2) } else {
            age = ((ageYears - this.MID_AGE) / ((this.MAX_AGE - this.MID_AGE) * 2)) + 0.5
        }
        this.setAge(age, updateModifier)
    }

    getWeightBMI() {
        return this.getWeight() * (this.MAX_BMI - this.MIN_BMI) + this.MIN_BMI
    }
    setWeightBMI(bmi) {
        const weight = bmi / (this.MAX_BMI - this.MIN_BMI) - this.MIN_BMI
        this.setWeight(weight)
    }

    getWeightKg() {
        const heightM = this.getHeightCm() / 100
        return this.getWeightBMI() * heightM * heightM
    }
    setWeightKg(kgs) {
        const heightM = this.getHeightCm() / 100
        this.setWeightBMI(kgs / heightM / heightM)
    }

    // //////////////////////
    // Getter and setters //
    // //////////////////////

    // this makes it a little nicer to access
    // TODO hide the getter and setter functions
    get age() {
        return this.getAge()
    }
    set age(v) {
        return this.setAge(v)
    }
    get gender() {
        return this.getGender()
    }
    set gender(v) {
        return this.setGender(v)
    }
    get weight() {
        return this.getWeight()
    }
    set weight(v) {
        return this.setWeight(v)
    }
    get muscle() {
        return this.getMuscle()
    }
    set muscle(v) {
        return this.setMuscle(v)
    }
    get height() {
        return this.getHeight()
    }
    set height(v) {
        return this.setHeight(v)
    }
    get breastSize() {
        return this.getBreastSize()
    }
    set breastSize(v) {
        return this.setBreastSize(v)
    }
    get breastFirmness() {
        return this.getBreastFirmness()
    }
    set breastFirmness(v) {
        return this.setBreastFirmness(v)
    }
    get bodyProportions() {
        return this.getBodyProportions()
    }
    set bodyProportions(v) {
        return this.setBodyProportions(v)
    }
    get caucasian() {
        return this.getCaucasian()
    }
    set caucasian(v) {
        return this.setCaucasian(v)
    }
    get african() {
        return this.getAfrican()
    }
    set african(v) {
        return this.setAfrican(v)
    }
    get asian() {
        return this.getAsian()
    }
    set asian(v) {
        return this.setAsian(v)
    }

    /**
     * Set gender
     * @param {Number}  gender  -  0 for female to 1 for male
     */
    setGender(gender, updateModifier = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['macrodetails/Gender']
            modifier.setValue(gender)
            // this.human.targets.applyAll()
            return
        }

        gender = _.clamp(gender, 0, 1)
        if (this._gender === gender) { return }
        this._gender = gender
        this._setGenderVals()
    }

    /**
    Gender from 0 (female) to 1 (male)
    **/
    getGender() {
        return this._gender
    }

    /**
    Dominant gender of this human or null
    **/
    getDominantGender() {
        if (this.getGender() < 0.5) { return 'female' } else if (this.getGender() > 0.5) { return 'male' } else {
            return null
        }
    }

    _setGenderVals() {
        this.maleVal = this._gender
        this.femaleVal = 1 - this._gender
    }

    /**
     * Set age
     * @param {Number}  age                   - 0 for 0 years old to 1 for 70 years old
     */
    setAge(age, updateModifier = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['macrodetails/Age']
            modifier.setValue(age)
            // this.human.targets.applyAll()
            return
        }

        age = _.clamp(age, 0, 1)
        if (this._age === age) {
            return
        }
        this._age = age
        this._setAgeVals()
    }

    /**
    Age of this human as a float between 0 && 1.
    **/
    getAge() {
        return this._age
    }

    /**

    Makehuman a8 age sytem where:
    - 0 is a 1 years old baby
    - 0.1875 is 10 year old child
    - 0.5 is a 25 year old young adult
    - 1 is a 90 year old, old adult
    **/
    _setAgeVals() {
        if (this._age < 0.5) {
            this.oldVal = 0
            this.babyVal = Math.max(0, 1 - this._age * 5.333) // 1/0.1875 = 5.333
            this.youngVal = Math.max(0, (this.age - 0.1875) * 3.2) // 1/(0.5-0.1875) = 3.2
            this.childVal = Math.max(0, Math.min(1, 5.333 * this._age) - this.youngVal)
        } else {
            this.childVal = 0
            this.babyVal = 0
            this.oldVal = Math.max(0, this._age * 2 - 1)
            this.youngVal = 1 - this.oldVal
        }
    }

    /**
     * set weight
     * @param {Number}  weight                - 0 to 1
     * @param {Boolean} [updateModifier=true] [description]
     */
    setWeight(weight, updateModifier = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['macrodetails-universal/Weight']
            modifier.setValue(weight, false)
            // this.human.targets.applyAll()
            return
        }

        weight = _.clamp(weight, 0, 1)
        if (this._weight === weight) {
            return
        }
        this._weight = weight
        this._setWeightVals()
    }

    getWeight() {
        return this._weight
    }

    _setWeightVals() {
        this.maxweightVal = Math.max(0, this._weight * 2 - 1)
        this.minweightVal = Math.max(0, 1 - this._weight * 2)
        this.averageweightVal = 1 - (this.maxweightVal + this.minweightVal)
    }

    /**
     * Muscle from 0 to 1
     * @param {Number}  muscle                - 0 to 1
     */
    setMuscle(muscle, updateModifier = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['macrodetails-universal/Muscle']
            modifier.setValue(muscle, false)
            // this.human.targets.applyAll()
            return
        }

        muscle = _.clamp(muscle, 0, 1)
        if (this._muscle === muscle) {
            return
        }
        this._muscle = muscle
        this._setMuscleVals()
    }

    getMuscle() {
        return this._muscle
    }

    _setMuscleVals() {
        this.maxmuscleVal = Math.max(0, this._muscle * 2 - 1)
        this.minmuscleVal = Math.max(0, 1 - this._muscle * 2)
        this.averagemuscleVal = 1 - (this.maxmuscleVal + this.minmuscleVal)
    }

    setHeight(height, updateModifier = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['macrodetails-height/Height']
            modifier.setValue(height, false)
            // this.human.targets.applyAll()
            return
        }

        height = _.clamp(height, 0, 1)
        if (this._height === height) {
            return
        }
        this._height = height
        this._setHeightVals()
    }

    getHeight() {
        return this._height
    }

    _setHeightVals() {
        this.maxheightVal = Math.max(0, this._height * 2 - 1)
        this.minheightVal = Math.max(0, 1 - this._height * 2)
        if (this.maxheightVal > this.minheightVal) {
            this.averageheightVal = 1 - this.maxheightVal
        } else {
            this.averageheightVal = 1 - this.minheightVal
        }
    }

    setBreastSize(size, updateModifier = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['breast/BreastSize']
            modifier.setValue(size, false)
            // this.human.targets.applyAll()
            return
        }

        size = _.clamp(size, 0, 1)
        if (this._breastSize === size) {
            return
        }
        this._breastSize = size
        this._setBreastSizeVals()
    }

    getBreastSize() {
        return this._breastSize
    }

    _setBreastSizeVals() {
        this.maxcupVal = Math.max(0, this._breastSize * 2 - 1)
        this.mincupVal = Math.max(0, 1 - this._breastSize * 2)
        if (this.maxcupVal > this.mincupVal) { this.averagecupVal = 1 - this.maxcupVal } else {
            this.averagecupVal = 1 - this.mincupVal
        }
    }

    setBreastFirmness(firmness, updateModifier = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['breast/BreastFirmness']
            modifier.setValue(firmness, false)
            // this.human.targets.applyAll()
            return
        }

        firmness = _.clamp(firmness, 0, 1)
        if (this._breastFirmness === firmness) {
            return
        }
        this._breastFirmness = firmness
        this._setBreastFirmnessVals()
    }

    getBreastFirmness() {
        return this._breastFirmness
    }

    _setBreastFirmnessVals() {
        this.maxfirmnessVal = Math.max(0, this._breastFirmness * 2 - 1)
        this.minfirmnessVal = Math.max(0, 1 - this._breastFirmness * 2)

        if (this.maxfirmnessVal > this.minfirmnessVal) { this.averagefirmnessVal = 1 - this.maxfirmnessVal } else {
            this.averagefirmnessVal = 1 - this.minfirmnessVal
        }
    }

    setBodyProportions(proportion, updateModifier = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['macrodetails-proportions/BodyProportions']
            modifier.setValue(proportion, false)
            // this.human.targets.applyAll()
            return
        }

        proportion = Math.min(1, Math.max(0, proportion))
        if (this._bodyProportions === proportion) {
            return
        }
        this._bodyProportions = proportion
        this._setBodyProportionVals()
    }

    _setBodyProportionVals() {
        this.idealproportionsVal = Math.max(0, this._bodyProportions * 2 - 1)
        this.uncommonproportionsVal = Math.max(0, 1 - this._bodyProportions * 2)

        if (this.idealproportionsVal > this.uncommonproportionsVal) {
            this.regularproportionsVal = 1 - this.idealproportionsVal
        } else { this.regularproportionsVal = 1 - this.uncommonproportionsVal }
    }

    getBodyProportions() {
        return this._bodyProportions
    }

    setCaucasian(caucasian, updateModifier = true, sync = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['macrodetails/Caucasian']
            modifier.setValue(caucasian, false)
            // this.human.targets.applyAll()
            return
        }

        caucasian = _.clamp(caucasian, 0, 1)
        this.caucasianVal = caucasian

        if (sync && !this.blockEthnicUpdates) {
            this._setEthnicVals('caucasian')
        }
    }

    getCaucasian() {
        return this.caucasianVal
    }

    setAfrican(african, updateModifier = true, sync = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['macrodetails/African']
            modifier.setValue(african, false)
            // this.human.targets.applyAll()
            return
        }

        african = _.clamp(african, 0, 1)
        this.africanVal = african

        if (sync && !this.blockEthnicUpdates) {
            this._setEthnicVals('african')
        }
    }

    getAfrican() {
        return this.africanVal
    }

    setAsian(asian, updateModifier = true, sync = true) {
        if (updateModifier) {
            const modifier = this.human.modifiers.children['macrodetails/Asian']
            modifier.setValue(asian, false)
            // this.human.targets.applyAll()
            return null
        }

        this.asianVal = _.clamp(asian, 0, 1)

        if (sync && !this.blockEthnicUpdates) {
            this._setEthnicVals('asian')
        }
        return asian
    }

    getAsian() {
        return this.asianVal
    }

    /**
    Normalize ethnic values so that they sum to 1.
    **/
    _setEthnicVals(exclude) {
        const _getVal = ethnic => this[`${ethnic}Val`]

        const _setVal = (ethnic, value) => this[`${ethnic}Val`] = value

        function _closeTo(value, limit, epsilon = 0.001) {
            return Math.abs(value - limit) <= epsilon
        }

        const ethnics = ['african', 'asian', 'caucasian']
        let remaining = 1
        if (exclude) {
            _.pull(ethnics, exclude)
        }
        remaining = 1 - _getVal(exclude)

        const otherTotal = _.sum(ethnics.map(e => _getVal(e)))
        if (otherTotal === 0) {
            // Prevent division by zero
            if (ethnics.length === 3 || _getVal(exclude) === 0) {
            // All values 0, this cannot be. Reset to default values.
                ethnics.forEach((e) => {
                    _setVal(e, 1 / 3)
                })
                if (exclude) {
                    _setVal(exclude, 1 / 3)
                }
            } else if (exclude && _closeTo(_getVal(exclude), 1)) {
            // One ethnicity is 1, the rest is 0
                ethnics.forEach(e => _setVal(e, 0))
                _setVal(exclude, 1)
            } else {
            // Increase values of other races (that were 0) to hit total sum of 1
                ethnics.forEach(e => _setVal(e, 0.01))
                this._setEthnicVals(exclude) // Re-normalize
            }
        } else {
            ethnics.map(e => _setVal(e, remaining * (_getVal(e) / otherTotal)))
        }
    }

    /**
    Most dominant ethnicity (african, caucasian, asian) or null
    **/
    getEthnicity() {
        if (this.getAsian() > this.getAfrican() && this.getAsian() > this.getCaucasian()) {
            return 'asian'
        } else if (this.getAfrican() > this.getAsian() && this.getAfrican() > this.getCaucasian()) {
            return 'african'
        } else if (this.getCaucasian() > this.getAsian() && this.getCaucasian() > this.getAfrican()) {
            return 'caucasian'
        } else {
            return null
        }
    }
}
export default Factors
