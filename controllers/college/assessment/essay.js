const Essay = require('../../../models/college/assessment/Essay');


const addEssay = async (req, res) => {
    try {
        const id = req.params.id;
        const essay = new Essay({
            ...req.body,
            college: id,
        });
        await essay.save();
        res.status(201).send(essay);
    } catch (error) {
        res.status(400
        ).send(error);
    }
}

const getEssayById = async (req, res) => {
    try {
        const _id = req.params.id;
        const essay = await Essay.findById(_id);
        if (!essay) {
            return res.status(404).send();
        }
        res.send(essay);
    } catch (error) {
        res.status(500).send(error);
    }
}

module.exports = {
    addEssay,
    getEssayById
}