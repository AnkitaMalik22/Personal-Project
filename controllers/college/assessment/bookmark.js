const Bookmark = require('../../../models/college/assessment/bookmark');

const addBookmark = async (req, res) => {
    try {
        const id = req.user.id
        const bookmark = new Bookmark({
            ...req.body,
            college: id,
        });
        await bookmark.save();
        res.status(201).send(bookmark);
    } catch (error) {
        res.status(400).send(error);
    }
}


const getBookmarkById = async (req, res) => {
    try {
        const _id = req.params.id;
        const bookmark = await Bookmark.findById
            (_id);
        if (!bookmark) {
            return res.status(404).send();
        }
        res.send(bookmark);
    }
    catch (error) {
        res.status(500).send(error);
    }
}






