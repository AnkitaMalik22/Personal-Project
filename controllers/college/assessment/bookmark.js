const Bookmark = require('../../../models/college/assessment/bookmark');

const addBookmark = async (req, res) => {
    try {
        const id = req.user.id
        const bookmark = new Bookmark({
            ...req.body,
            college: id,
        });
        await bookmark.save();

        const bookmarks = await Bookmark.find({
            college: req.user.id
        });

        res.status(201).send({
            message: 'Bookmark added successfully',
            bookmarks
        })
        
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
            return res.status(404).send({ message: 'Bookmark not found' });
        }
        res.send(bookmark);
    }
    catch (error) {
        res.status(500).send(error);
    }
}


const getAllBookmarks = async (req, res) => {
    // console.log(req.user);

    try {
        const bookmarks = await Bookmark.find({
            college: req.user.id
        });
      
        res.send({success : true, bookmarks});
    } catch (error) {
        res.status(500).send({ message: 'Error while getting bookmarks' });
    }
}


const removeBookmark = async (req, res) => {
    try {
        const _id = req.params.id;
        const bookmark = await Bookmark.findByIdAndDelete(_id);
        if (!bookmark) {
            return res.status(404).send({ message: 'Bookmark not found' });
        }
        const bookmarks = await Bookmark.find({
            college: req.user.id
        });
        res.send({ message: 'Bookmark deleted successfully' , bookmarks});
    } catch (error) {
        res.status(500).send({
            message: 'Error while deleting bookmark'
        })
        }

    }




module.exports = {
    addBookmark,
    getBookmarkById,
    getAllBookmarks,
    removeBookmark
}








