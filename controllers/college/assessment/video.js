const Video = require('../../../models/college/assessment/Video');


const addVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const {videoLink } = req.body;
        const video = await Video.create({
            Title,
            videoLink,
            college: id,
        });
        return res.status(201).json({
            message: "Video created successfully",
            video,
        });

    }
    catch (error) {
        return res.status(500).json({
            message: "Unable to create Video",
            error: error.message,
        });
    }
}

const getVideoById = async (req, res) => {
    try {
        const { videoId } = req.params;
        const video = await
        Video
        .findById(videoId)
        if (!video) {
            return res.status(404).json({
                message: "Video not found",
            });
        }
        return res.status(200).json({
            video,
        });
        } catch (error) {
            return res.status(500).json({
                message: "Unable to get Video",
                error: error.message,
            });
            }
}


const getVideos = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const videos = await Video.find({ college: collegeId });
        return res.status(200).json({
            videos,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Unable to get Videos",
            error: error.message,
        });
    }
}


module.exports = {
    addVideo,
    getVideoById,
    getVideos
}